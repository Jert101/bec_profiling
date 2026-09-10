"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { FamilyMember, ResidentForm } from "@/lib/types";
import { initials, fullName } from "@/lib/types";
import { FLAG_OPTIONS, RELIGION_OPTIONS, PARISH_OPTIONS, CIVIL_STATUS_OPTIONS, SEX_OPTIONS } from "@/lib/constants";
import {
  createResident,
  updateResident,
  deleteResident,
  validateForm,
  getFamilyMembers,
  createFamilyMembers,
  updateFamilyMember,
  deleteFamilyMembers,
} from "@/lib/residents";
import { useApp } from "@/components/AppProvider";
import FormField from "@/components/ui/FormField";
import Section from "@/components/ui/Section";
import Chip from "@/components/ui/Chip";
import AddressSection from "@/components/form/AddressSection";
import NotesSection from "@/components/form/NotesSection";
import FamilySection from "@/components/form/FamilySection";
import type { FamilyRow } from "@/components/form/FamilySection";

export default function RecordForm({
  initial,
  isNew,
  id,
}: {
  initial: ResidentForm;
  isNew: boolean;
  id?: number;
}) {
  const router = useRouter();
  const { showToast, confirmDelete } = useApp();
  const [form, setForm] = useState<ResidentForm>(initial);
  const [family, setFamily] = useState<FamilyRow[]>([]);
  const [deletedFamilyIds, setDeletedFamilyIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ResidentForm>(key: K, value: ResidentForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (isNew || id === undefined) return;
    let alive = true;
    getFamilyMembers(id)
      .then((members) => {
        if (!alive) return;
        setFamily(
          members.map((m: FamilyMember) => ({
            id: m.id,
            data: {
              full_name: m.full_name,
              relationship: m.relationship ?? "",
              sex: m.sex ?? "",
              age: m.age !== null && m.age !== undefined ? String(m.age) : "",
              occupation: m.occupation ?? "",
            },
          })),
        );
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id, isNew]);

  const syncFamily = async (residentId: number) => {
    const toCreate = family.filter((m) => m.id === undefined).map((m) => m.data);
    await createFamilyMembers(residentId, toCreate);
    for (const m of family) {
      if (m.id !== undefined) await updateFamilyMember(m.id, m.data);
    }
    if (deletedFamilyIds.length > 0) await deleteFamilyMembers(deletedFamilyIds);
  };

  const handleFamilyChange = (next: FamilyRow[]) => {
    const removedWithId = family
      .filter((m) => m.id !== undefined && !next.some((n) => n.id === m.id))
      .map((m) => m.id!);
    if (removedWithId.length > 0) {
      setDeletedFamilyIds((prev) => [...prev, ...removedWithId]);
    }
    setFamily(next);
  };

  const handleSave = async () => {
    const validation = validateForm(form);
    if (validation) {
      showToast(validation, true);
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const resident = await createResident(form);
        await syncFamily(resident.id);
        showToast("Record added");
      } else if (id !== undefined) {
        await updateResident(id, form);
        await syncFamily(id);
        showToast("Record updated");
      }
      router.push("/records");
      router.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not save record", true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirmDelete(fullName(initial));
    if (!ok || id === undefined) return;
    try {
      await deleteResident(id);
      showToast("Record deleted");
      router.push("/records");
      router.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not delete record", true);
    }
  };

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-5 border-b-2 border-teal pb-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sage-light font-serif text-[22px] font-bold text-teal-dark">
            {isNew ? "+" : initials(initial)}
          </div>
          <div>
            <h1 className="mb-1 font-serif text-[28px] text-teal-dark">
              {isNew ? "New Resident Record" : fullName(initial)}
            </h1>
            <div className="text-sm text-slate-light">
              {!isNew && (
                initial.barangay
                  ? `${initial.barangay}${initial.city_municipality ? `, ${initial.city_municipality}` : ""}`
                  : "No address on file"
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/records"
            className="whitespace-nowrap rounded-md border border-line bg-white px-4 py-2.5 text-sm font-semibold text-teal transition hover:border-teal"
          >
            ← Back to records
          </Link>
          {!isNew && (
            <button
              onClick={handleDelete}
              className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-line bg-white px-4 py-2.5 text-sm font-semibold text-danger transition hover:border-danger hover:bg-[#FCEEEC]"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="cursor-pointer whitespace-nowrap rounded-md bg-teal px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-teal-dark disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save record"}
          </button>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <Section title="Personal information">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
            <FormField label="First name" name="first_name" value={form.first_name} onChange={(v) => set("first_name", v)} required />
            <FormField label="Middle name" name="middle_name" value={form.middle_name} onChange={(v) => set("middle_name", v)} />
            <FormField label="Last name" name="last_name" value={form.last_name} onChange={(v) => set("last_name", v)} required />
            <FormField label="Suffix" name="suffix" value={form.suffix} onChange={(v) => set("suffix", v)} />
            <FormField type="select" label="Sex" name="sex" value={form.sex} onChange={(v) => set("sex", v)} options={SEX_OPTIONS} />
            <FormField type="date" label="Date of birth" name="date_of_birth" value={form.date_of_birth} onChange={(v) => set("date_of_birth", v)} />
            <FormField type="select" label="Civil status" name="civil_status" value={form.civil_status} onChange={(v) => set("civil_status", v)} options={CIVIL_STATUS_OPTIONS} />
            <FormField type="select" label="Religion" name="religion" value={form.religion} onChange={(v) => set("religion", v)} options={RELIGION_OPTIONS} />
            <FormField type="select" label="Parish" name="parish" value={form.parish} onChange={(v) => set("parish", v)} options={PARISH_OPTIONS} />
            <FormField label="Occupation" name="occupation" value={form.occupation} onChange={(v) => set("occupation", v)} />
          </div>
        </Section>

        <AddressSection
          province={form.province}
          city={form.city_municipality}
          barangay={form.barangay}
          streetSitio={form.street_sitio}
          contactNumber={form.contact_number}
          onProvince={(v) => {
            set("province", v);
            set("city_municipality", "");
            set("barangay", "");
          }}
          onCity={(v) => {
            set("city_municipality", v);
            set("barangay", "");
          }}
          onBarangay={(v) => set("barangay", v)}
          onStreetSitio={(v) => set("street_sitio", v)}
          onContactNumber={(v) => set("contact_number", v)}
        />

        <Section title="Family">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            <FormField label="Mother's name" name="mother_name" value={form.mother_name} onChange={(v) => set("mother_name", v)} />
            <FormField label="Father's name" name="father_name" value={form.father_name} onChange={(v) => set("father_name", v)} />
          </div>
        </Section>

        <FamilySection members={family} onChange={handleFamilyChange} />

        <Section title="Household">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
            <FormField label="Household number" name="household_number" value={form.household_number} onChange={(v) => set("household_number", v)} />
            <FormField type="number" label="Household members (count)" name="household_members" value={form.household_members} onChange={(v) => set("household_members", v)} />
            <FormField label="Household head" name="household_head" value={form.household_head} onChange={(v) => set("household_head", v)} />
          </div>
        </Section>

        <Section title="Flags & consent">
          <div className="flex flex-wrap gap-2.5">
            {FLAG_OPTIONS.map(({ key, label }) => (
              <Chip key={key} label={label} checked={form[key]} onChange={(v) => set(key, v)} />
            ))}
          </div>
        </Section>

        <NotesSection
          notes={form.notes}
          recordedBy={form.recorded_by}
          onNotes={(v) => set("notes", v)}
          onRecordedBy={(v) => set("recorded_by", v)}
        />
      </form>
    </div>
  );
}