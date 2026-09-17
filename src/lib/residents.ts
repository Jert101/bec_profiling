import { supabase } from "./supabase";
import { logActivity } from "./activity";
import { fullName } from "./types";
import type {
  DuplicateMatch,
  FamilyMember,
  FamilyMemberForm,
  FamilyStats,
  FormFieldConfig,
  Resident,
  ResidentForm,
  Stats,
  Vicariate,
} from "./types";

const SEARCH_COLUMNS = [
  "first_name",
  "middle_name",
  "last_name",
  "barangay",
  "city_municipality",
  "occupation",
  "contact_number",
  "vicariate",
  "parish",
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

const normName = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export async function findPotentialDuplicates({
  firstName,
  lastName,
  dateOfBirth,
  excludeId,
}: {
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  excludeId?: number | null;
}): Promise<DuplicateMatch[]> {
  const fn = normName(firstName);
  const ln = normName(lastName);
  const dob = (dateOfBirth ?? "").trim() || null;
  if (!fn || !ln) return [];

  const { data, error } = await supabase
    .from("residents")
    .select("id, first_name, middle_name, last_name, suffix, date_of_birth, barangay, parish, vicariate");
  if (error) throw new Error(error.message);

  const matches: DuplicateMatch[] = [];
  for (const r of data ?? []) {
    if (excludeId && r.id === excludeId) continue;
    if (normName(r.first_name ?? "") !== fn || normName(r.last_name ?? "") !== ln) continue;
    const otherDob = (r.date_of_birth ?? "") || null;
    const exact = !!dob && !!otherDob && dob === otherDob;
    matches.push({
      id: r.id,
      name: fullName(r),
      dateOfBirth: otherDob,
      barangay: r.barangay ?? null,
      parish: r.parish ?? null,
      vicariate: r.vicariate ?? null,
      match: exact ? "exact_dob" : "same_name",
    });
  }
  return matches;
}

export async function getTotalCount(): Promise<number> {
  const { count, error } = await supabase
    .from("residents")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getStats(): Promise<Stats> {
  const { count, error } = await supabase
    .from("residents")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return { total: count ?? 0 };
}

export async function getFamilyStats(): Promise<FamilyStats> {
  const { data, error, count } = await supabase
    .from("family_members")
    .select("category", { count: "exact" });
  if (error) throw new Error(error.message);
  const map = new Map<string, number>();
  for (const row of data ?? []) {
    const cat = row.category || "(Not specified)";
    map.set(cat, (map.get(cat) ?? 0) + 1);
  }
  const byCategory = [...map.entries()]
    .map(([category, c]) => ({ category, count: c }))
    .sort((a, b) => b.count - a.count);
  return { total: count ?? 0, byCategory };
}

function toDb(form: ResidentForm) {
  const emptyToNull = <K extends keyof ResidentForm>(k: K) => {
    const v = form[k];
    return typeof v === "string" && v.trim() === "" ? null : v;
  };

  return {
    first_name: form.first_name.trim(),
    middle_name: emptyToNull("middle_name"),
    last_name: form.last_name.trim(),
    suffix: emptyToNull("suffix"),
    sex: emptyToNull("sex"),
    date_of_birth: emptyToNull("date_of_birth") || null,
    civil_status: emptyToNull("civil_status"),
    vicariate: emptyToNull("vicariate"),
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
    notes: emptyToNull("notes"),
    recorded_by: emptyToNull("recorded_by"),
  };
}

export function validateForm(form: ResidentForm, fields: FormFieldConfig[]): string | null {
  for (const f of fields) {
    if (!f.enabled || !f.required) continue;
    const value = form[f.name as keyof ResidentForm];
    if (Array.isArray(value)) {
      if (value.length === 0) return `${f.label} is required.`;
    } else {
      const v = typeof value === "string" ? value.trim() : value;
      if (!v) return `${f.label} is required.`;
    }
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
  await logActivity({
    action: "form_fields.updated",
    entity: "form_fields",
    details: { count: rows.length },
  });
}

export async function getVicariates(): Promise<Vicariate[]> {
  const [v, p] = await Promise.all([
    supabase.from("vicariates").select("id, name, sort_order").order("sort_order").order("name"),
    supabase.from("parishes").select("id, vicariate_id, name, sort_order").order("sort_order").order("name"),
  ]);
  if (v.error) throw new Error(v.error.message);
  if (p.error) throw new Error(p.error.message);
  const map = new Map<number, Vicariate>();
  for (const row of v.data ?? []) map.set(row.id, { ...row, parishes: [] });
  for (const pRow of p.data ?? []) {
    const vic = map.get(pRow.vicariate_id);
    if (vic) vic.parishes.push({ id: pRow.id, name: pRow.name });
  }
  return [...map.values()];
}

export async function addVicariate(name: string): Promise<void> {
  const { error } = await supabase.from("vicariates").insert({ name: name.trim() });
  if (error) throw new Error(error.message);
  await logActivity({
    action: "vicariate.created",
    entity: "vicariate",
    details: { name: name.trim() },
  });
}

export async function renameVicariate(id: number, name: string): Promise<void> {
  const { data: before } = await supabase
    .from("vicariates")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase
    .from("vicariates")
    .update({ name: name.trim() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await logActivity({
    action: "vicariate.renamed",
    entity: "vicariate",
    entityId: id,
    details: { oldName: before?.name ?? null, name: name.trim() },
  });
}

export async function deleteVicariate(id: number): Promise<void> {
  const { data: before } = await supabase
    .from("vicariates")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("vicariates").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await logActivity({
    action: "vicariate.deleted",
    entity: "vicariate",
    entityId: id,
    details: { name: before?.name ?? null },
  });
}

export async function addParish(vicariateId: number, name: string): Promise<void> {
  const { data: vicValue } = await supabase
    .from("vicariates")
    .select("name")
    .eq("id", vicariateId)
    .maybeSingle();
  const { error } = await supabase
    .from("parishes")
    .insert({ vicariate_id: vicariateId, name: name.trim() });
  if (error) throw new Error(error.message);
  await logActivity({
    action: "parish.created",
    entity: "parish",
    details: { name: name.trim(), vicariate: vicValue?.name ?? null },
  });
}

export async function renameParish(id: number, name: string): Promise<void> {
  const { data: before } = await supabase
    .from("parishes")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase
    .from("parishes")
    .update({ name: name.trim() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await logActivity({
    action: "parish.renamed",
    entity: "parish",
    entityId: id,
    details: { oldName: before?.name ?? null, name: name.trim() },
  });
}

export async function deleteParish(id: number): Promise<void> {
  const { data: before } = await supabase
    .from("parishes")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("parishes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await logActivity({
    action: "parish.deleted",
    entity: "parish",
    entityId: id,
    details: { name: before?.name ?? null },
  });
}

export async function createResident(form: ResidentForm): Promise<Resident> {
  const { data, error } = await supabase
    .from("residents")
    .insert(toDb(form))
    .select()
    .single();
  if (error) throw new Error(error.message);
  await logActivity({
    action: "resident.created",
    entity: "resident",
    entityId: data.id,
    details: {
      first_name: data.first_name,
      last_name: data.last_name,
      barangay: data.barangay ?? null,
      parish: data.parish ?? null,
    },
  });
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
  await logActivity({
    action: "resident.updated",
    entity: "resident",
    entityId: data.id,
    details: {
      first_name: data.first_name,
      last_name: data.last_name,
      barangay: data.barangay ?? null,
      parish: data.parish ?? null,
    },
  });
  return data as Resident;
}

export async function deleteResident(id: number): Promise<void> {
  const { data: before } = await supabase
    .from("residents")
    .select("id, first_name, last_name")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("residents").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await logActivity({
    action: "resident.deleted",
    entity: "resident",
    entityId: id,
    details: {
      first_name: before?.first_name ?? "",
      last_name: before?.last_name ?? "",
    },
  });
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
    category: emptyToNull(form.category),
    sacraments: Array.isArray(form.sacraments) ? form.sacraments : [],
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

async function residentRef(id: number): Promise<Record<string, unknown>> {
  const { data } = await supabase
    .from("residents")
    .select("first_name, last_name")
    .eq("id", id)
    .maybeSingle();
  return { first_name: data?.first_name ?? "", last_name: data?.last_name ?? "" };
}

export async function createFamilyMember(residentId: number, form: FamilyMemberForm): Promise<void> {
  const { error } = await supabase
    .from("family_members")
    .insert({ resident_id: residentId, ...familyMemberToDb(form) });
  if (error) throw new Error(error.message);
  await logActivity({
    action: "family_members.created",
    entity: "family_member",
    entityId: residentId,
    details: { count: 1, ...(await residentRef(residentId)) },
  });
}

export async function createFamilyMembers(residentId: number, forms: FamilyMemberForm[]): Promise<void> {
  if (forms.length === 0) return;
  const { error } = await supabase
    .from("family_members")
    .insert(forms.map((f) => ({ resident_id: residentId, ...familyMemberToDb(f) })));
  if (error) throw new Error(error.message);
  await logActivity({
    action: "family_members.created",
    entity: "family_member",
    entityId: residentId,
    details: { count: forms.length, ...(await residentRef(residentId)) },
  });
}

export async function updateFamilyMember(id: number, form: FamilyMemberForm): Promise<void> {
  const { data: before } = await supabase
    .from("family_members")
    .select("resident_id")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase
    .from("family_members")
    .update(familyMemberToDb(form))
    .eq("id", id);
  if (error) throw new Error(error.message);
  if (before) {
    await logActivity({
      action: "family_member.updated",
      entity: "family_member",
      entityId: before.resident_id,
      details: { member: form.full_name, ...(await residentRef(before.resident_id)) },
    });
  }
}

export async function deleteFamilyMembers(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const { data: before } = await supabase
    .from("family_members")
    .select("resident_id")
    .in("id", ids)
    .maybeSingle();
  const { error } = await supabase.from("family_members").delete().in("id", ids);
  if (error) throw new Error(error.message);
  if (before) {
    await logActivity({
      action: "family_members.deleted",
      entity: "family_member",
      entityId: before.resident_id,
      details: { count: ids.length, ...(await residentRef(before.resident_id)) },
    });
  }
}

export async function deleteFamilyMembersByResident(residentId: number): Promise<void> {
  const { data: before } = await supabase
    .from("family_members")
    .select("id")
    .eq("resident_id", residentId);
  const { error } = await supabase
    .from("family_members")
    .delete()
    .eq("resident_id", residentId);
  if (error) throw new Error(error.message);
  await logActivity({
    action: "family_members.deleted",
    entity: "family_member",
    entityId: residentId,
    details: { count: before?.length ?? 0, ...(await residentRef(residentId)) },
  });
}