export const SEX_OPTIONS = ["Male", "Female"];

export const CIVIL_STATUS_OPTIONS = [
  "Single",
  "Married",
  "Widowed",
  "Separated",
  "Annulled",
  "Live-in",
];

export const RELIGION_OPTIONS = [
  "Roman Catholic",
  "Iglesia ni Cristo",
  "Islam",
  "Protestant",
  "Seventh-day Adventist",
  "Jehovah's Witnesses",
  "Aglipayan",
  "Born Again Christian",
  "Other",
  "None / Prefer not to say",
];

export const PARISH_OPTIONS = [
  "St. Michael the Archangel Cathedral",
  "San Lorenzo Ruiz Parish",
  "Our Lady of Fatima Parish",
  "San Roque Parish",
  "Immaculate Conception Parish (Bahayan)",
  "Resurrection of the Lord Filipino-Chinese Catholic Community",
  "San Pedro Calungsod Parish (Kabacsanan)",
  "Our Lady of Perpetual Help Shrine (Tibanga)",
  "Corpus Christi Parish (Tubod)",
  "Lord of the Holy Cross Parish",
  "San Vicente Ferrer Parish",
  "Birhen sa Sto. Rosario Parish (Pala-o)",
  "Inahan sa Kinabuhi (ISK) Parish",
  "San Isidro Labrador Parish (Buru-un)",
  "Other / Outside Iligan City",
];

export const MATRIMONY_OPTIONS = ["Civil", "Church"];

export const SACRAMENT_OPTIONS = [
  "Baptism",
  "Confirmation",
  "Eucharist",
  "Confession",
  "Anointing of the Sick",
  "Holy Orders",
  "Matrimony",
];

export const FLAG_OPTIONS: { key: "is_pwd" | "is_senior" | "is_4ps" | "is_indigent" | "consent_given"; label: string }[] = [
  { key: "is_pwd", label: "PWD" },
  { key: "is_senior", label: "Senior citizen" },
  { key: "is_4ps", label: "4Ps beneficiary" },
  { key: "is_indigent", label: "Indigent" },
  { key: "consent_given", label: "Consent given" },
];