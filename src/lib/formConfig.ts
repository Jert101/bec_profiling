import type { FormFieldConfig } from "./types";

export const SECTIONS = [
  "Personal information",
  "Family members",
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
  { name: "vicariate", section: "Personal information", label: "Vicariate", type: "select", options: [], required: false, enabled: true, sort_order: 18 },
  {
    name: "parish", section: "Personal information", label: "Parish", type: "select",
    options: ["St. Michael the Archangel Cathedral", "San Lorenzo Ruiz Parish", "Our Lady of Fatima Parish", "San Roque Parish", "Immaculate Conception Parish (Bahayan)", "Resurrection of the Lord Filipino-Chinese Catholic Community", "San Pedro Calungsod Parish (Kabacsanan)", "Our Lady of Perpetual Help Shrine (Tibanga)", "Corpus Christi Parish (Tubod)", "Lord of the Holy Cross Parish", "San Vicente Ferrer Parish", "Birhen sa Sto. Rosario Parish (Pala-o)", "Inahan sa Kinabuhi (ISK) Parish", "San Isidro Labrador Parish (Buru-un)", "Other / Outside Iligan City"],
    required: false, enabled: true, sort_order: 19,
  },
  { name: "occupation", section: "Personal information", label: "Occupation", type: "text", options: [], required: false, enabled: true, sort_order: 20 },
  { name: "matrimony", section: "Personal information", label: "Matrimony", type: "select", options: ["Civil", "Church"], required: false, enabled: true, sort_order: 21 },
  { name: "matrimony_date", section: "Personal information", label: "Matrimony date", type: "date", options: [], required: false, enabled: true, sort_order: 22 },
  { name: "bec_cell_name", section: "Personal information", label: "BEC / Cell Name", type: "text", options: [], required: false, enabled: true, sort_order: 23 },
  {
    name: "sacraments", section: "Personal information", label: "Sacraments", type: "multiselect",
    options: ["Baptism", "Confirmation", "Eucharist", "Confession", "Anointing of the Sick", "Holy Orders", "Matrimony"],
    required: false, enabled: true, sort_order: 24,
  },

  { name: "province", section: "Personal information", label: "Province", type: "select", options: [], required: false, enabled: true, sort_order: 25 },
  { name: "city_municipality", section: "Personal information", label: "City / Municipality", type: "select", options: [], required: false, enabled: true, sort_order: 26 },
  { name: "barangay", section: "Personal information", label: "Barangay", type: "select", options: [], required: false, enabled: true, sort_order: 27 },
  { name: "street_sitio", section: "Personal information", label: "Street / Sitio", type: "text", options: [], required: false, enabled: true, sort_order: 28 },
  { name: "contact_number", section: "Personal information", label: "Contact number", type: "text", options: [], required: false, enabled: true, sort_order: 29 },

  { name: "family_members", section: "Family members", label: "Family members", type: "repeater", options: [], required: false, enabled: true, sort_order: 50 },

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
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}