export interface Resident {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  sex: string | null;
  date_of_birth: string | null;
  civil_status: string | null;
  vicariate: string | null;
  parish: string | null;
  matrimony: string | null;
  matrimony_date: string | null;
  bec_cell_name: string | null;
  sacraments: string[];
  barangay: string | null;
  street_sitio: string | null;
  city_municipality: string | null;
  province: string | null;
  contact_number: string | null;
  occupation: string | null;
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
  vicariate: string;
  parish: string;
  matrimony: string;
  matrimony_date: string;
  bec_cell_name: string;
  sacraments: string[];
  barangay: string;
  street_sitio: string;
  city_municipality: string;
  province: string;
  contact_number: string;
  occupation: string;
  notes: string;
  recorded_by: string;
};

export interface Stats {
  total: number;
}

export interface FamilyStats {
  total: number;
  byCategory: { category: string; count: number }[];
}

export interface FamilyMember {
  id: number;
  resident_id: number;
  full_name: string;
  relationship: string | null;
  sex: string | null;
  age: number | null;
  occupation: string | null;
  category: string | null;
  sacraments: string[];
  date_added: string;
}

export interface FamilyMemberForm {
  full_name: string;
  relationship: string;
  sex: string;
  age: string;
  occupation: string;
  category: string;
  sacraments: string[];
}

export interface VicariateParish {
  id: number;
  name: string;
}

export interface Vicariate {
  id: number;
  name: string;
  sort_order: number;
  parishes: VicariateParish[];
}

export interface FormFieldConfig {
  name: string;
  section: string;
  label: string;
  type: "text" | "date" | "number" | "select" | "multiselect" | "flag" | "textarea" | "repeater";
  options: string[];
  required: boolean;
  enabled: boolean;
  sort_order: number;
}

export type Role = "admin" | "moderator";

export type PageKey = "dashboard" | "records" | "stats" | "logs";

export type DuplicateMatch = {
  id: number;
  name: string;
  dateOfBirth: string | null;
  barangay: string | null;
  parish: string | null;
  vicariate: string | null;
  match: "exact_dob" | "same_name";
};

export interface Session {
  role: Role;
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
    vicariate: "",
    parish: "",
    matrimony: "",
    matrimony_date: "",
    bec_cell_name: "",
    sacraments: [],
    barangay: "",
    street_sitio: "",
    city_municipality: "",
    province: "",
    contact_number: "",
    occupation: "",
    notes: "",
    recorded_by: "",
  };
}

export function emptyFamilyMember(): FamilyMemberForm {
  return {
    full_name: "",
    relationship: "",
    sex: "",
    age: "",
    occupation: "",
    category: "",
    sacraments: [],
  };
}