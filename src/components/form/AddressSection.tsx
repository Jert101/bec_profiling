"use client";

import { getBarangays, getCities, getProvinces } from "@/lib/locations";
import FormField from "@/components/ui/FormField";
import Section from "@/components/ui/Section";
import type { FormFieldConfig } from "@/lib/types";

export const ADDRESS_FIELD_NAMES = [
  "province",
  "city_municipality",
  "barangay",
  "street_sitio",
  "contact_number",
] as const;

export default function AddressSection({
  fields,
  province,
  city,
  barangay,
  streetSitio,
  contactNumber,
  disabled,
  onProvince,
  onCity,
  onBarangay,
  onStreetSitio,
  onContactNumber,
}: {
  fields: FormFieldConfig[];
  province: string;
  city: string;
  barangay: string;
  streetSitio: string;
  contactNumber: string;
  disabled?: boolean;
  onProvince: (v: string) => void;
  onCity: (v: string) => void;
  onBarangay: (v: string) => void;
  onStreetSitio: (v: string) => void;
  onContactNumber: (v: string) => void;
}) {
  const enabled = (name: string) => fields.some((f) => f.name === name && f.enabled);
  const label = (name: string) => fields.find((f) => f.name === name)?.label ?? name;
  const sectionTitle = fields.find((f) => f.name === "province")?.section ?? "Address";

  const provinces = getProvinces();
  const cities = province ? getCities(province) : [];
  const barangays = province && city ? getBarangays(province, city) : [];

  return (
    <Section title={sectionTitle}>
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
        {enabled("province") && (
          <FormField
            type="select"
            label={label("province")}
            name="province"
            value={province}
            disabled={disabled}
            onChange={onProvince}
            options={provinces}
          />
        )}
        {enabled("city_municipality") && (
          <FormField
            type="select"
            label={label("city_municipality")}
            name="city_municipality"
            value={city}
            disabled={disabled}
            onChange={onCity}
            options={cities}
          />
        )}
        {enabled("barangay") && (
          <FormField
            type="select"
            label={label("barangay")}
            name="barangay"
            value={barangay}
            disabled={disabled}
            onChange={onBarangay}
            options={barangays}
          />
        )}
        {enabled("street_sitio") && (
          <FormField
            label={label("street_sitio")}
            name="street_sitio"
            value={streetSitio}
            disabled={disabled}
            onChange={onStreetSitio}
          />
        )}
        {enabled("contact_number") && (
          <FormField
            label={label("contact_number")}
            name="contact_number"
            value={contactNumber}
            disabled={disabled}
            onChange={onContactNumber}
          />
        )}
      </div>
    </Section>
  );
}