import { supabase } from "./supabase";
import { logActivity } from "./activity";
import type { Session } from "./types";

const SESSION_KEY = "resident_profiler_session";
const VALID_ROLES = ["admin", "moderator", "parish"] as const;

// --- Tiny external store (sessionStorage-backed) ---
let current: Session | null = null;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Session;
      if (parsed && VALID_ROLES.includes(parsed.role)) {
        current = parsed;
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

export function logoutSession() {
  const role = current?.role ?? null;
  commit(null);
  logActivity({ action: "auth.logout", entity: "auth", details: role ? { role } : null });
}

export async function loginWithPin(pin: string): Promise<Session | null> {
  const { data, error } = await supabase.rpc("app_login", { pin });
  if (error) throw new Error(error.message);
  const identity = data as string | null;

  if (identity === "admin") {
    const session: Session = { role: "admin" };
    commit(session);
    logActivity({ action: "auth.login", entity: "auth", details: { role: "admin" } });
    return session;
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
      const session: Session = { role: "parish", parishId, parishName };
      commit(session);
      logActivity({
        action: "auth.login",
        entity: "auth",
        details: { role: "parish", parishId, parishName },
      });
      return session;
    }
  }

  logActivity({ action: "auth.login_failed", entity: "auth" });
  return null;
}

export type ChangeCodeResult = "ok" | "auth_required" | "invalid_pin" | "not_found" | "error";

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
  if (data === "auth_required") return { result: "auth_required", message: "Your admin access code is incorrect." };
  if (data === "invalid_pin") return { result: "invalid_pin", message: "The new access code cannot be empty." };
  if (data === "not_found") return { result: "not_found", message: "That user could not be found." };
  await logActivity({ action: "code.changed", entity: "auth", details: { targetKey } });
  return { result: "ok", message: `${data} access code updated.` };
}