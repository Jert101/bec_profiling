import type { FormFieldConfig } from "./types";

export const SECTIONS = [
  "Personal information",
  "Address",
  "Family",
  "Family members",
  "Household",
  "Flags & consent",
  "Notes",
] as const;

export const ADDRESS_FIELD_NAMES = ["province", "city_municipality", "barangay", "street_sitio", "contact_number"] as const;

export const DEFAULT_FORM_FIELDS: FormFieldConfig[] = [
  { name: "first_name", section: "Personal information", label: "First name", type: "text", options: [], required: true, enabled: true, sort_order: 10 },
  { name: "middle_name", section: "Personal information", label: "Middle name", type: "text", options: [], required: false, enabled: true, sort_order: 11 },
  { name: "last_name", section: "Personal information", label: "Last name", type: "text", options: [], required: true, enabled: true, sort_order: 12 },
  { name: "suffix", section: "Personal information", label: "Suffix", type: "text", options: [], required: false, enabled: true, sort_order: 13 },
  { name: "sex", section: "Personal information", label: "Sex", type: "select", options: ["Male", "Female"], required: false, enabled: true, sort_order: 14 },
  { name: "date_of_birth", section: "Personal information", label: "Date of birth", type: "date", options: [], required: false, enabled: true, sort_order: 15 },
  {
    name: "civil_status", section: "Personal information", label: "Civil status", type: "select",
    options: ["Single", "Married", "Widowed", "Separated", "Annulled", "Live-in"], required: false, enabled: true, sort_order: 16,
  },
  {
    name: "religion", section: "Personal information", label: "Religion", type: "select",
    options: ["Roman Catholic", "Iglesia ni Cristo", "Islam", "Protestant", "Seventh-day Adventist", "Jehovah's Witnesses", "Aglipayan", "Born Again Christian", "Other", "None / Prefer not to say"],
    required: false, enabled: true, sort_order: 17,
  },
  {
    name: "parish", section: "Personal information", label: "Parish", type: "select",
    options: ["St. Michael the Archangel Cathedral", "San Lorenzo Ruiz Parish", "Our Lady of Fatima Parish", "San Roque Parish", "Immaculate Conception Parish (Bahayan)", "Resurrection of the Lord Filipino-Chinese Catholic Community", "San Pedro Calungsod Parish (Kabacsanan)", "Our Lady of Perpetual Help Shrine (Tibanga)", "Corpus Christi Parish (Tubod)", "Lord of the Holy Cross Parish", "San Vicente Ferrer Parish", "Birhen sa Sto. Rosario Parish (Pala-o)", "Inahan sa Kinabuhi (ISK) Parish", "San Isidro Labrador Parish (Buru-un)", "Other / Outside Iligan City"],
    required: false, enabled: true, sort_order: 18,
  },
  { name: "occupation", section: "Personal information", label: "Occupation", type: "text", options: [], required: false, enabled: true, sort_order: 19 },
  { name: "matrimony", section: "Personal information", label: "Matrimony", type: "select", options: ["Civil", "Church"], required: false, enabled: true, sort_order: 20 },
  { name: "matrimony_date", section: "Personal information", label: "Matrimony date", type: "date", options: [], required: false, enabled: true, sort_order: 21 },
  { name: "bec_cell_name", section: "Personal information", label: "BEC / Cell Name", type: "text", options: [], required: false, enabled: true, sort_order: 22 },
  {
    name: "sacraments", section: "Personal information", label: "Sacraments", type: "multiselect",
    options: ["Baptism", "Confirmation", "Eucharist", "Confession", "Anointing of the Sick", "Holy Orders", "Matrimony"],
    required: false, enabled: true, sort_order: 23,
  },

  { name: "province", section: "Address", label: "Province", type: "select", options: [], required: false, enabled: true, sort_order: 30 },
  { name: "city_municipality", section: "Address", label: "City / Municipality", type: "select", options: [], required: false, enabled: true, sort_order: 31 },
  { name: "barangay", section: "Address", label: "Barangay", type: "select", options: [], required: false, enabled: true, sort_order: 32 },
  { name: "street_sitio", section: "Address", label: "Street / Sitio", type: "text", options: [], required: false, enabled: true, sort_order: 33 },
  { name: "contact_number", section: "Address", label: "Contact number", type: "text", options: [], required: false, enabled: true, sort_order: 34 },

  { name: "mother_name", section: "Family", label: "Mother's name", type: "text", options: [], required: false, enabled: true, sort_order: 40 },
  { name: "father_name", section: "Family", label: "Father's name", type: "text", options: [], required: false, enabled: true, sort_order: 41 },
  { name: "family_members", section: "Family members", label: "Family members", type: "repeater", options: [], required: false, enabled: true, sort_order: 50 },

  { name: "household_number", section: "Household", label: "Household number", type: "text", options: [], required: false, enabled: true, sort_order: 60 },
  { name: "household_members", section: "Household", label: "Household members (count)", type: "number", options: [], required: false, enabled: true, sort_order: 61 },
  { name: "household_head", section: "Household", label: "Household head", type: "text", options: [], required: false, enabled: true, sort_order: 62 },

  { name: "is_pwd", section: "Flags & consent", label: "PWD", type: "flag", options: [], required: false, enabled: true, sort_order: 70 },
  { name: "is_senior", section: "Flags & consent", label: "Senior citizen", type: "flag", options: [], required: false, enabled: true, sort_order: 71 },
  { name: "is_4ps", section: "Flags & consent", label: "4Ps beneficiary", type: "flag", options: [], required: false, enabled: true, sort_order: 72 },
  { name: "is_indigent", section: "Flags & consent", label: "Indigent", type: "flag", options: [], required: false, enabled: true, sort_order: 73 },
  { name: "consent_given", section: "Flags & consent", label: "Consent given", type: "flag", options: [], required: false, enabled: true, sort_order: 74 },

  { name: "notes", section: "Notes", label: "Notes / remarks", type: "textarea", options: [], required: false, enabled: true, sort_order: 80 },
  { name: "recorded_by", section: "Notes", label: "Recorded by", type: "text", options: [], required: false, enabled: true, sort_order: 81 },
];

const LOCKED_FIELDS = new Set(["first_name", "last_name"]);

export function normalizeFields(fields: FormFieldConfig[]): FormFieldConfig[] {
  return fields
    .map((f) =>
      LOCKED_FIELDS.has(f.name)
        ? { ...f, enabled: true, required: true }
        : f,
    )
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function isLocked(name: string) {
  return LOCKED_FIELDS.has(name);
}

export function groupBySection(fields: FormFieldConfig[]): { section: string; fields: FormFieldConfig[] }[] {
  const order: string[] = [];
  const map = new Map<string, FormFieldConfig[]>();
  for (const f of fields) {
    if (!map.has(f.section)) {
      map.set(f.section, []);
      order.push(f.section);
    }
    map.get(f.section)!.push(f);
  }
  return order
    .map((section) => ({ section, fields: map.get(section)! }))
    .filter((g) => g.fields.some((f) => f.enabled));
}

export function parseOptions(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}