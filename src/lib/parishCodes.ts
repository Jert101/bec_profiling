import { supabase } from "./supabase";
import { logActivity } from "./activity";

export interface ParishCodeInfo {
  parish_id: number;
  vicariate_name: string;
  parish_name: string;
  code_set: boolean;
  code_plain: string | null;
}

export type ParishCodeResult =
  | "ok"
  | "auth_required"
  | "too_short"
  | "not_found"
  | "locked"
  | "duplicate"
  | "error";

export async function listParishCodes(): Promise<ParishCodeInfo[]> {
  const { data, error } = await supabase.rpc("parish_codes_list");
  if (error) throw new Error(error.message);
  return (data ?? []) as ParishCodeInfo[];
}

function toResult(
  data: string | null,
  error: { message: string } | null,
): { result: ParishCodeResult; message: string } {
  if (error) return { result: "error", message: error.message };
  if (data === "auth_required")
    return { result: "auth_required", message: "Your admin access code is incorrect." };
  if (data === "too_short")
    return { result: "too_short", message: "The access code must be at least 6 characters." };
  if (data === "not_found")
    return { result: "not_found", message: "That parish could not be found." };
  if (data === "locked")
    return {
      result: "locked",
      message: "Too many incorrect attempts with the admin access code. Try again in 15 minutes.",
    };
  if (data === "duplicate")
    return { result: "duplicate", message: "That access code is already used by another parish." };
  if (data === "ok") return { result: "ok", message: "Parish access code saved." };
  return { result: "error", message: "Unexpected response from the server." };
}

export async function setParishCode(
  parishId: number,
  newCode: string,
  adminPin: string,
  parishName?: string | null,
): Promise<{ result: ParishCodeResult; message: string }> {
  const { data, error } = await supabase.rpc("parish_code_set", {
    target: parishId,
    new_code: newCode,
    admin_pin: adminPin,
  });
  const res = toResult(data as string | null, error);
  if (res.result === "ok") {
    await logActivity({
      action: "parish_code.set",
      entity: "parish",
      entityId: parishId,
      details: { parishId, parishName: parishName ?? null },
    });
  }
  return res;
}

export async function clearParishCode(
  parishId: number,
  adminPin: string,
  parishName?: string | null,
): Promise<{ result: ParishCodeResult; message: string }> {
  const { data, error } = await supabase.rpc("parish_code_clear", {
    target: parishId,
    admin_pin: adminPin,
  });
  const res = toResult(data as string | null, error);
  if (res.result === "ok") {
    await logActivity({
      action: "parish_code.clear",
      entity: "parish",
      entityId: parishId,
      details: { parishId, parishName: parishName ?? null },
    });
  }
  return res;
}