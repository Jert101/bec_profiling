import { supabase } from "./supabase";
import type { PageKey, Role } from "./types";

export const ALL_PAGES: PageKey[] = ["dashboard", "records", "stats"];

export async function getRolePages(role: Role): Promise<PageKey[]> {
  const { data, error } = await supabase
    .from("role_pages")
    .select("page")
    .eq("role", role);
  if (error) throw new Error(error.message);
  const allowed = new Set((data ?? []).map((r) => r.page as PageKey));
  return ALL_PAGES.filter((p) => allowed.has(p));
}

export async function setRolePages(role: Role, pages: PageKey[]): Promise<void> {
  const { error: delError } = await supabase.from("role_pages").delete().eq("role", role);
  if (delError) throw new Error(delError.message);
  if (pages.length === 0) return;
  const { error: insError } = await supabase
    .from("role_pages")
    .insert(pages.map((page) => ({ role, page })));
  if (insError) throw new Error(insError.message);
}