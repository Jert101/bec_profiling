export interface Resident {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  sex: string | null;
  date_of_birth: string | null;
  civil_status: string | null;
  religion: string | null;
  parish: string | null;
  barangay: string | null;
  street_sitio: string | null;
  city_municipality: string | null;
  province: string | null;
  contact_number: string | null;
  occupation: string | null;
  mother_name: string | null;
  father_name: string | null;
  household_number: string | null;
  household_members: number | null;
  household_head: string | null;
  is_pwd: boolean;
  is_senior: boolean;
  is_4ps: boolean;
  is_indigent: boolean;
  consent_given: boolean;
  notes: string | null;
  recorded_by: string | null;
  date_recorded: string;
}

export type ResidentForm = {
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  sex: string;
  date_of_birth: string;
  civil_status: string;
  religion: string;
  parish: string;
  barangay: string;
  street_sitio: string;
  city_municipality: string;
  province: string;
  contact_number: string;
  occupation: string;
  mother_name: string;
  father_name: string;
  household_number: string;
  household_members: string;
  household_head: string;
  is_pwd: boolean;
  is_senior: boolean;
  is_4ps: boolean;
  is_indigent: boolean;
  consent_given: boolean;
  notes: string;
  recorded_by: string;
};

export interface ReligionStat {
  religion: string | null;
  count: number;
}

export interface Stats {
  total: number;
  catholic: number;
  catholicPct: number;
  religionBreakdown: { religion: string; count: number; pct: number }[];
}

export interface FamilyMember {
  id: number;
  resident_id: number;
  full_name: string;
  relationship: string | null;
  sex: string | null;
  age: number | null;
  occupation: string | null;
  date_added: string;
}

export interface FamilyMemberForm {
  full_name: string;
  relationship: string;
  sex: string;
  age: string;
  occupation: string;
}

export function fullName(r: Pick<Resident, "first_name" | "middle_name" | "last_name" | "suffix">): string {
  return [r.first_name, r.middle_name, r.last_name, r.suffix].filter(Boolean).join(" ");
}

export function initials(r: Pick<Resident, "first_name" | "last_name">): string {
  return ((r.first_name?.[0] || "") + (r.last_name?.[0] || "")).toUpperCase();
}

export function calcAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function emptyForm(): ResidentForm {
  return {
    first_name: "",
    middle_name: "",
    last_name: "",
    suffix: "",
    sex: "",
    date_of_birth: "",
    civil_status: "",
    religion: "",
    parish: "",
    barangay: "",
    street_sitio: "",
    city_municipality: "",
    province: "",
    contact_number: "",
    occupation: "",
    mother_name: "",
    father_name: "",
    household_number: "",
    household_members: "",
    household_head: "",
    is_pwd: false,
    is_senior: false,
    is_4ps: false,
    is_indigent: false,
    consent_given: false,
    notes: "",
    recorded_by: "",
  };
}

export function emptyFamilyMember(): FamilyMemberForm {
  return { full_name: "", relationship: "", sex: "", age: "", occupation: "" };
}