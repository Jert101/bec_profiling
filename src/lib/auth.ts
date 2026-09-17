import { supabase } from "./supabase";
import { logActivity } from "./activity";
import type { Session } from "./types";

const SESSION_KEY = "resident_profiler_session";
const VALID_ROLES = ["admin", "moderator", "parish"] as const;

const ABSOLUTE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const IDLE_TTL_MS = 30 * 60 * 1000; // 30 minutes idle
const TOUCH_THROTTLE_MS = 30 * 1000; // how often a session may be refreshed

// --- Tiny external store (sessionStorage-backed) ---
let current: Session | null = null;
const listeners = new Set<() => void>();

function isExpired(s: Session): boolean {
  const now = Date.now();
  const issued = s.issuedAt ?? now;
  const lastActive = s.lastActive ?? issued;
  return now - issued >= ABSOLUTE_TTL_MS || now - lastActive >= IDLE_TTL_MS;
}

if (typeof window !== "undefined") {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Session;
      if (parsed && VALID_ROLES.includes(parsed.role) && !isExpired(parsed)) {
        current = parsed;
      } else if (parsed) {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
  } catch {
    /* ignore */
  }
}

export function getSessionSnapshot(): Session | null {
  return current;
}

export function subscribeSession(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function commit(session: Session | null) {
  current = session;
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function withTimestamps(s: Session): Session {
  const now = Date.now();
  return { ...s, issuedAt: now, lastActive: now };
}

// Refresh the idle timestamp (throttled). If the session has gone idle past
// the limit, or passed the absolute lifetime, it is cleared (auto logout).
export function touchSession() {
  if (!current) return;
  const now = Date.now();
  const lastActive = current.lastActive ?? current.issuedAt ?? now;
  if (now - lastActive < TOUCH_THROTTLE_MS) return;
  if (isExpired(current)) {
    commit(null);
    return;
  }
  commit({ ...current, lastActive: now });
}

export function logoutSession() {
  const role = current?.role ?? null;
  commit(null);
  logActivity({ action: "auth.logout", entity: "auth", details: role ? { role } : null });
}

export type LoginErrorKind = "invalid" | "locked" | "error";

export interface LoginResult {
  session: Session | null;
  error: LoginErrorKind | null;
  message?: string;
}

export async function loginWithPin(pin: string): Promise<LoginResult> {
  const { data, error } = await supabase.rpc("app_login", { pin });
  if (error) return { session: null, error: "error", message: error.message };
  const identity = data as string | null;

  if (identity === "locked") {
    return {
      session: null,
      error: "locked",
      message:
        "Too many incorrect attempts for this access code. Try again in 15 minutes.",
    };
  }

  if (identity === "admin") {
    const session = withTimestamps({ role: "admin" });
    commit(session);
    logActivity({ action: "auth.login", entity: "auth", details: { role: "admin" } });
    return { session, error: null };
  }

  if (identity?.startsWith("parish:")) {
    const parishId = Number(identity.slice("parish:".length));
    if (Number.isFinite(parishId) && parishId > 0) {
      const { data: p } = await supabase
        .from("parishes")
        .select("name")
        .eq("id", parishId)
        .maybeSingle();
      const parishName = (p as { name?: string } | null)?.name ?? null;
      const session = withTimestamps({ role: "parish", parishId, parishName });
      commit(session);
      logActivity({
        action: "auth.login",
        entity: "auth",
        details: { role: "parish", parishId, parishName },
      });
      return { session, error: null };
    }
  }

  logActivity({ action: "auth.login_failed", entity: "auth" });
  return { session: null, error: "invalid", message: "Access code not recognized." };
}

export type ChangeCodeResult =
  | "ok"
  | "auth_required"
  | "invalid_pin"
  | "not_found"
  | "locked"
  | "error";

export async function changeUserCode(
  targetKey: "admin" | "moderator",
  newPin: string,
  adminPin: string,
): Promise<{ result: ChangeCodeResult; message: string }> {
  const { data, error } = await supabase.rpc("app_change_code", {
    target_key: targetKey,
    new_pin: newPin,
    admin_pin: adminPin,
  });
  if (error) return { result: "error", message: error.message };
  if (data === null) return { result: "not_found", message: "That user could not be found." };
  if (data === "auth_required")
    return { result: "auth_required", message: "Your admin access code is incorrect." };
  if (data === "invalid_pin")
    return { result: "invalid_pin", message: "The new access code cannot be empty." };
  if (data === "locked")
    return {
      result: "locked",
      message: "Too many incorrect attempts with the admin access code. Try again in 15 minutes.",
    };
  if (data === "not_found") return { result: "not_found", message: "That user could not be found." };
  await logActivity({ action: "code.changed", entity: "auth", details: { targetKey } });
  return { result: "ok", message: `${data} access code updated.` };
}