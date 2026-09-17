import { supabase } from "./supabase";
import { getSessionSnapshot } from "./auth";

export type ActivityLogRow = {
  id: number;
  created_at: string;
  acted_by: string | null;
  action: string;
  entity: string;
  entity_id: number | null;
  details: Record<string, unknown> | null;
};

export async function logActivity(input: {
  action: string;
  entity: string;
  entityId?: number | null;
  details?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    const session = getSessionSnapshot();
    const { error } = await supabase.from("activity_log").insert({
      action: input.action,
      entity: input.entity,
      entity_id: input.entityId ?? null,
      details: input.details ?? null,
      acted_by: session?.role ?? null,
    });
    if (error) console.error("logActivity:", error.message);
  } catch (e) {
    console.error("logActivity:", e);
  }
}

export async function getActivityLogs(limit = 300): Promise<ActivityLogRow[]> {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as ActivityLogRow[];
}

export async function getActivityCounts(): Promise<{ total: number; today: number }> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [a, b] = await Promise.all([
    supabase.from("activity_log").select("*", { count: "exact", head: true }),
    supabase.from("activity_log").select("*", { count: "exact", head: true }).gte("created_at", start.toISOString()),
  ]);
  if (a.error) throw new Error(a.error.message);
  if (b.error) throw new Error(b.error.message);
  return { total: a.count ?? 0, today: b.count ?? 0 };
}

export async function clearActivityLogs(): Promise<number> {
  const { count, error } = await supabase
    .from("activity_log")
    .delete()
    .gte("id", 0);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export const ACTION_LABELS: Record<string, string> = {
  "resident.created": "Record created",
  "resident.updated": "Record updated",
  "resident.deleted": "Record deleted",
  "family_members.created": "Family members added",
  "family_member.updated": "Family member updated",
  "family_members.deleted": "Family members removed",
  "vicariate.created": "Vicariate added",
  "vicariate.renamed": "Vicariate renamed",
  "vicariate.deleted": "Vicariate deleted",
  "parish.created": "Parish added",
  "parish.renamed": "Parish renamed",
  "parish.deleted": "Parish deleted",
  "form_fields.updated": "Form layout updated",
  "role_pages.updated": "Page access updated",
  "code.changed": "Access code changed",
  "parish_code.set": "Parish code set",
  "parish_code.clear": "Parish code removed",
  "auth.login": "Signed in",
  "auth.login_failed": "Sign-in failed",
  "auth.logout": "Signed out",
};

export function describeActivity(row: ActivityLogRow): string {
  const d = row.details ?? {};
  const who = renderName(d);
  const ref = who || (row.entity_id ? `Record #${row.entity_id}` : "");
  const paren = (s: string) => (s ? s : "");

  switch (row.action) {
    case "resident.created":
    case "resident.updated":
    case "resident.deleted":
      return ref;
    case "family_members.created":
      return `Added ${String(d.count ?? 0)} member${Number(d.count) === 1 ? "" : "s"} for ${paren(ref)}`.trim();
    case "family_member.updated":
      return `Updated ${paren(String(d.member ?? "a member"))} for ${paren(ref)}`.trim();
    case "family_members.deleted":
      return `Removed ${String(d.count ?? 0)} member${Number(d.count) === 1 ? "" : "s"} from ${paren(ref)}`.trim();
    case "vicariate.created":
      return paren(String(d.name ?? ""));
    case "vicariate.renamed":
      return d.oldName ? `"${String(d.oldName)}" → "${String(d.name ?? "")}"` : "";
    case "vicariate.deleted":
      return paren(String(d.name ?? ""));
    case "parish.created":
      return paren(String(d.name ?? ""));
    case "parish.renamed":
      return d.oldName ? `"${String(d.oldName)}" → "${String(d.name ?? "")}"` : "";
    case "parish.deleted":
      return paren(String(d.name ?? ""));
    case "form_fields.updated":
      return `Updated ${String(d.count ?? "the")} form field${Number(d.count) === 1 ? "" : "s"}`;
    case "role_pages.updated":
      return Array.isArray(d.pages) && (d.pages as string[]).length
        ? `Moderator access: ${(d.pages as string[]).join(", ")}`
        : "Moderator access: none";
    case "code.changed":
      return d.targetKey ? `${String(d.targetKey)} access code` : "";
    case "parish_code.set":
      return d.parishName ? `Access code set for ${String(d.parishName)}` : "";
    case "parish_code.clear":
      return d.parishName ? `Access code removed for ${String(d.parishName)}` : "";
    case "auth.login":
      return d.role ? `as ${String(d.role).replace(/^./, (c) => c.toUpperCase())}` : "";
    case "auth.login_failed":
      return "An invalid access code was entered";
    case "auth.logout":
      return "";
    default:
      return "";
  }
}

function renderName(d: Record<string, unknown>): string {
  const f = String(d.first_name ?? "");
  const m = String(d.last_name ?? "");
  return [f, m].filter(Boolean).join(" ");
}

export function residentDetails(
  r: Pick<{ first_name: string; last_name: string }, "first_name" | "last_name">,
): Record<string, unknown> {
  return { first_name: r.first_name, last_name: r.last_name };
}