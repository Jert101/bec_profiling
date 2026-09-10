import { supabase } from "./supabase";
import type { FamilyMember, FamilyMemberForm, FormFieldConfig, Resident, ResidentForm, Stats } from "./types";

const SEARCH_COLUMNS = [
  "first_name",
  "middle_name",
  "last_name",
  "barangay",
  "city_municipality",
  "occupation",
  "contact_number",
  "religion",
  "bec_cell_name",
] as const;

export async function searchResidents(query = ""): Promise<Resident[]> {
  const q = query.trim();
  let request = supabase
    .from("residents")
    .select("*")
    .order("last_name")
    .order("first_name");

  if (q) {
    const orClause = SEARCH_COLUMNS.map((c) => `${c}.ilike.%${q}%`).join(",");
    request = request.or(orClause);
  }

  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return (data ?? []) as Resident[];
}

export async function getResident(id: number): Promise<Resident | null> {
  const { data, error } = await supabase
    .from("residents")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Resident) ?? null;
}

export async function getTotalCount(): Promise<number> {
  const { count, error } = await supabase
    .from("residents")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getStats(): Promise<Stats> {
  const { data, error, count } = await supabase
    .from("residents")
    .select("religion", { count: "exact" });
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  const map = new Map<string, number>();
  for (const row of data ?? []) {
    const rel = row.religion || "(Not specified)";
    map.set(rel, (map.get(rel) ?? 0) + 1);
  }

  const breakdown = [...map.entries()]
    .map(([religion, cnt]) => ({
      religion,
      count: cnt,
      pct: total ? Math.round((cnt / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const catholic = map.get("Roman Catholic") ?? 0;

  return {
    total,
    catholic,
    catholicPct: total ? Math.round((catholic / total) * 1000) / 10 : 0,
    religionBreakdown: breakdown,
  };
}

function toDb(form: ResidentForm) {
  const emptyToNull = <K extends keyof ResidentForm>(k: K) => {
    const v = form[k];
    return typeof v === "string" && v.trim() === "" ? null : v;
  };

  const members = emptyToNull("household_members");
  return {
    first_name: form.first_name.trim(),
    middle_name: emptyToNull("middle_name"),
    last_name: form.last_name.trim(),
    suffix: emptyToNull("suffix"),
    sex: emptyToNull("sex"),
    date_of_birth: emptyToNull("date_of_birth") || null,
    civil_status: emptyToNull("civil_status"),
    religion: emptyToNull("religion"),
    parish: emptyToNull("parish"),
    matrimony: emptyToNull("matrimony"),
    matrimony_date: emptyToNull("matrimony_date") || null,
    bec_cell_name: emptyToNull("bec_cell_name"),
    sacraments: Array.isArray(form.sacraments) ? form.sacraments : [],
    barangay: emptyToNull("barangay"),
    street_sitio: emptyToNull("street_sitio"),
    city_municipality: emptyToNull("city_municipality"),
    province: emptyToNull("province"),
    contact_number: emptyToNull("contact_number"),
    occupation: emptyToNull("occupation"),
    mother_name: emptyToNull("mother_name"),
    father_name: emptyToNull("father_name"),
    household_number: emptyToNull("household_number"),
    household_members: members === null || members === "" || members === undefined
      ? null
      : Number(members),
    household_head: emptyToNull("household_head"),
    is_pwd: form.is_pwd,
    is_senior: form.is_senior,
    is_4ps: form.is_4ps,
    is_indigent: form.is_indigent,
    consent_given: form.consent_given,
    notes: emptyToNull("notes"),
    recorded_by: emptyToNull("recorded_by"),
  };
}

export function validateForm(form: ResidentForm, fields: FormFieldConfig[]): string | null {
  for (const f of fields) {
    if (!f.enabled || !f.required) continue;
    if (f.type === "flag") continue;
    const value = form[f.name as keyof ResidentForm];
    if (Array.isArray(value)) {
      if (value.length === 0) return `${f.label} is required.`;
    } else {
      const v = typeof value === "string" ? value.trim() : value;
      if (!v && v !== false) return `${f.label} is required.`;
    }
  }
  const members = form.household_members;
  if (
    members !== "" &&
    members !== null &&
    members !== undefined &&
    Number.isNaN(Number(members))
  ) {
    return "Household Members must be a number.";
  }
  return null;
}

export async function getFormFields(): Promise<FormFieldConfig[]> {
  const { data, error } = await supabase
    .from("form_fields")
    .select("*")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as FormFieldConfig[];
}

export async function updateFormFields(rows: FormFieldConfig[]): Promise<void> {
  const { error } = await supabase.from("form_fields").upsert(rows);
  if (error) throw new Error(error.message);
}

export async function createResident(form: ResidentForm): Promise<Resident> {
  const { data, error } = await supabase
    .from("residents")
    .insert(toDb(form))
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Resident;
}

export async function updateResident(id: number, form: ResidentForm): Promise<Resident> {
  const { data, error } = await supabase
    .from("residents")
    .update(toDb(form))
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Resident;
}

export async function deleteResident(id: number): Promise<void> {
  const { error } = await supabase.from("residents").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

function familyMemberToDb(form: FamilyMemberForm) {
  const emptyToNull = (v: string) => (v.trim() === "" ? null : v.trim());
  const age = form.age.trim();
  return {
    full_name: form.full_name.trim(),
    relationship: emptyToNull(form.relationship),
    sex: emptyToNull(form.sex),
    age: age === "" ? null : Number(age),
    occupation: emptyToNull(form.occupation),
  };
}

export async function getFamilyMembers(residentId: number): Promise<FamilyMember[]> {
  const { data, error } = await supabase
    .from("family_members")
    .select("*")
    .eq("resident_id", residentId)
    .order("id");
  if (error) throw new Error(error.message);
  return (data ?? []) as FamilyMember[];
}

export async function createFamilyMember(residentId: number, form: FamilyMemberForm): Promise<void> {
  const { error } = await supabase
    .from("family_members")
    .insert({ resident_id: residentId, ...familyMemberToDb(form) });
  if (error) throw new Error(error.message);
}

export async function createFamilyMembers(residentId: number, forms: FamilyMemberForm[]): Promise<void> {
  if (forms.length === 0) return;
  const { error } = await supabase
    .from("family_members")
    .insert(forms.map((f) => ({ resident_id: residentId, ...familyMemberToDb(f) })));
  if (error) throw new Error(error.message);
}

export async function updateFamilyMember(id: number, form: FamilyMemberForm): Promise<void> {
  const { error } = await supabase
    .from("family_members")
    .update(familyMemberToDb(form))
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteFamilyMembers(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from("family_members").delete().in("id", ids);
  if (error) throw new Error(error.message);
}

export async function deleteFamilyMembersByResident(residentId: number): Promise<void> {
  const { error } = await supabase
    .from("family_members")
    .delete()
    .eq("resident_id", residentId);
  if (error) throw new Error(error.message);
}