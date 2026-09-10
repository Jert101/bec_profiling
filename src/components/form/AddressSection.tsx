"use client";

import { getBarangays, getCities, getProvinces } from "@/lib/locations";
import FormField from "@/components/ui/FormField";
import Section from "@/components/ui/Section";

export default function AddressSection({
  province,
  city,
  barangay,
  streetSitio,
  contactNumber,
  onProvince,
  onCity,
  onBarangay,
  onStreetSitio,
  onContactNumber,
}: {
  province: string;
  city: string;
  barangay: string;
  streetSitio: string;
  contactNumber: string;
  onProvince: (v: string) => void;
  onCity: (v: string) => void;
  onBarangay: (v: string) => void;
  onStreetSitio: (v: string) => void;
  onContactNumber: (v: string) => void;
}) {
  const provinces = getProvinces();
  const cities = province ? getCities(province) : [];
  const barangays = province && city ? getBarangays(province, city) : [];

  return (
    <Section title="Address">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
        <FormField
          type="select"
          label="Province"
          name="province"
          value={province}
          onChange={onProvince}
          options={provinces}
        />
        <FormField
          type="select"
          label="City / Municipality"
          name="city_municipality"
          value={city}
          onChange={onCity}
          options={cities}
        />
        <FormField
          type="select"
          label="Barangay"
          name="barangay"
          value={barangay}
          onChange={onBarangay}
          options={barangays}
        />
        <FormField label="Street / Sitio" name="street_sitio" value={streetSitio} onChange={onStreetSitio} />
        <FormField label="Contact number" name="contact_number" value={contactNumber} onChange={onContactNumber} />
      </div>
    </Section>
  );
}