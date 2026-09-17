"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Search, Trash2, X } from "lucide-react";
import type { DuplicateMatch, FamilyMember, FormFieldConfig, ResidentForm, Vicariate } from "@/lib/types";
import { initials, fullName } from "@/lib/types";
import {
  createResident,
  updateResident,
  deleteResident,
  validateForm,
  getFormFields,
  getVicariates,
  getFamilyMembers,
  createFamilyMembers,
  updateFamilyMember,
  deleteFamilyMembers,
  findPotentialDuplicates,
} from "@/lib/residents";
import { normalizeFields, groupBySection, DEFAULT_FORM_FIELDS } from "@/lib/formConfig";
import { useApp } from "@/components/AppProvider";
import FormField from "@/components/ui/FormField";
import Section from "@/components/ui/Section";
import Chip from "@/components/ui/Chip";
import AddressFields, { ADDRESS_FIELD_NAMES } from "@/components/form/AddressSection";
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
  const { session, showToast, confirmDelete } = useApp();
  const isParishRole = session?.role === "parish";
  const lockParishId = session?.parishId ?? null;
  const readOnly = false;
  const [form, setForm] = useState<ResidentForm>(initial);
  const [family, setFamily] = useState<FamilyRow[]>([]);
  const [deletedFamilyIds, setDeletedFamilyIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<FormFieldConfig[]>(() =>
    normalizeFields(DEFAULT_FORM_FIELDS),
  );
  const [vicariates, setVicariates] = useState<Vicariate[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [dupLoading, setDupLoading] = useState(false);
  const [dupDone, setDupDone] = useState(false);
  const [dupAcknowledged, setDupAcknowledged] = useState(false);
  const [dupModalOpen, setDupModalOpen] = useState(false);

  const dupBlocking = duplicates.some((d) => d.match === "exact_dob");

  useEffect(() => {
    const firstName = form.first_name.trim();
    const lastName = form.last_name.trim();
    const t = setTimeout(() => {
      if (!firstName || !lastName) {
        setDuplicates([]);
        setDupDone(false);
        setDupAcknowledged(false);
        setDupModalOpen(false);
        return;
      }
      setDupLoading(true);
      findPotentialDuplicates({
        firstName,
        lastName,
        dateOfBirth: form.date_of_birth,
        excludeId: isNew ? null : id,
      })
        .then((matches) => {
          setDuplicates(matches);
          setDupDone(true);
          setDupAcknowledged(false);
          if (matches.length > 0) setDupModalOpen(true);
        })
        .catch(() => {
          setDuplicates([]);
          setDupDone(false);
        })
        .finally(() => setDupLoading(false));
    }, 700);
    return () => clearTimeout(t);
  }, [form.first_name, form.last_name, form.date_of_birth, isNew, id]);

  useEffect(() => {
    let alive = true;
    getFormFields()
      .then((data) => {
        if (!alive) return;
        if (data && data.length > 0) setFields(normalizeFields(data));
      })
      .catch(() => {
        /* keep defaults */
      });
    getVicariates()
      .then((data) => {
        if (!alive) return;
        setVicariates(data);
        if (isParishRole && isNew && lockParishId) {
          const mine = data
            .flatMap((v) => v.parishes.map((p) => ({ vicariate: v.name, ...p })))
            .find((p) => p.id === lockParishId);
          if (mine) setForm((prev) => ({ ...prev, vicariate: mine.vicariate, parish: mine.name }));
        }
      })
      .catch(() => {
        /* keep empty */
      });
    return () => {
      alive = false;
    };
  }, [isNew, isParishRole, lockParishId]);

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
              category: m.category ?? "",
              sacraments: m.sacraments ?? [],
            },
          })),
        );
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id, isNew]);

  const setValue = (key: keyof ResidentForm, value: string | boolean | string[]) =>
    setForm((prev) => ({ ...prev, [key]: value as never }));

  const groups = groupBySection(fields);

  const resolveParishId = (): number | null => {
    const vic = vicariates.find((v) => v.name === form.vicariate);
    if (!vic) return null;
    return vic.parishes.find((p) => p.name === form.parish)?.id ?? null;
  };

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
    const validation = validateForm(form, fields);
    if (validation) {
      showToast(validation, true);
      return;
    }
    if (dupBlocking && !dupAcknowledged) {
      setDupModalOpen(true);
      showToast("Possible duplicate found — review before saving.", true);
      return;
    }
    setSaving(true);
    try {
      const parishId = isParishRole ? lockParishId : resolveParishId();
      if (isNew) {
        const resident = await createResident(form, parishId);
        await syncFamily(resident.id);
        showToast("Record added");
      } else if (id !== undefined) {
        await updateResident(id, form, parishId);
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

  const renderStandardField = (f: FormFieldConfig) => {
    const value = form[f.name as keyof ResidentForm];

    if (f.name === "vicariate" || f.name === "parish") {
      let options: string[];
      if (f.name === "vicariate") {
        options = vicariates.map((v) => v.name);
      } else {
        const selectedVicariate = vicariates.find((v) => v.name === form.vicariate);
        options = selectedVicariate
          ? selectedVicariate.parishes.map((p) => p.name)
          : [];
        const current = (value as string) ?? "";
        if (current && !options.includes(current)) options = [current, ...options];
      }
      return (
        <div key={f.name}>
          <FormField
            type="select"
            label={f.label}
            name={f.name}
            value={(value as string) ?? ""}
            disabled={readOnly || isParishRole}
            required={f.required}
            onChange={(v) => {
              setValue(f.name as keyof ResidentForm, v);
              if (f.name === "vicariate") setForm((prev) => ({ ...prev, parish: "" }));
            }}
            options={options}
            placeholder={
              f.name === "vicariate"
                ? "Select vicariate"
                : form.vicariate
                  ? "Select parish"
                  : "Select a vicariate first"
            }
          />
        </div>
      );
    }

    if (f.type === "multiselect") {
      const selected = (value as string[]) ?? [];
      const toggle = (opt: string) =>
        setValue(
          f.name as keyof ResidentForm,
          selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt],
        );
      return (
        <div key={f.name} className="flex flex-col gap-1.5 md:col-span-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-light">
            {f.label}
            {f.required && <span className="ml-0.5 text-danger">*</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {f.options.map((opt) => (
              <Chip
                key={opt}
                label={opt}
                checked={selected.includes(opt)}
                disabled={readOnly}
                onChange={() => toggle(opt)}
              />
            ))}
          </div>
        </div>
      );
    }

    if (f.type === "select") {
      return (
        <div key={f.name}>
          <FormField
            type="select"
            label={f.label}
            name={f.name}
            value={(value as string) ?? ""}
            disabled={readOnly}
            required={f.required}
            onChange={(v) => setValue(f.name as keyof ResidentForm, v)}
            options={f.options}
          />
        </div>
      );
    }

    const inputType =
      f.type === "date" || f.type === "number" ? f.type : f.type === "textarea" ? "textarea" : "text";

    return (
      <div key={f.name} className={f.type === "textarea" ? "md:col-span-3" : ""}>
        <FormField
          type={inputType as "text" | "date" | "number" | "textarea"}
          label={f.label}
          name={f.name}
          value={(value as string) ?? ""}
          disabled={readOnly}
          required={f.required}
          onChange={(v) => setValue(f.name as keyof ResidentForm, v)}
          placeholder={f.name === "bec_cell_name" ? "e.g. San Jose BEC" : "Select..."}
        />
      </div>
    );
  };

  const renderStandardSection = (section: string, fs: FormFieldConfig[]) => {
    const addressFields = fs.filter(
      (f) => (ADDRESS_FIELD_NAMES as readonly string[]).includes(f.name) && f.enabled,
    );
    const standard = fs.filter(
      (f) => !(ADDRESS_FIELD_NAMES as readonly string[]).includes(f.name),
    );

    if (section === "Notes") {
      return (
        <NotesSection
          key={section}
          fields={fs}
          notes={form.notes}
          recordedBy={form.recorded_by}
          disabled={readOnly}
          onNotes={(v) => setValue("notes", v)}
          onRecordedBy={(v) => setValue("recorded_by", v)}
        />
      );
    }

    const familyField = fs.find((f) => f.type === "repeater");
    if (familyField) {
      return <FamilySection key={section} members={family} onChange={handleFamilyChange} readOnly={readOnly} />;
    }

    if (addressFields.length === 0 && standard.length === 0) return null;

    return (
      <Section key={section} title={section}>
        {addressFields.length > 0 && (
          <AddressFields
            fields={fs}
            province={form.province}
            city={form.city_municipality}
            barangay={form.barangay}
            streetSitio={form.street_sitio}
            contactNumber={form.contact_number}
            disabled={readOnly}
            onProvince={(v) => {
              setValue("province", v);
              setForm((prev) => ({ ...prev, city_municipality: "", barangay: "" }));
            }}
            onCity={(v) => {
              setValue("city_municipality", v);
              setForm((prev) => ({ ...prev, barangay: "" }));
            }}
            onBarangay={(v) => setValue("barangay", v)}
            onStreetSitio={(v) => setValue("street_sitio", v)}
            onContactNumber={(v) => setValue("contact_number", v)}
          />
        )}
        {standard.length > 0 && (
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
            {standard.map((f) => renderStandardField(f))}
          </div>
        )}
      </Section>
    );
  };

  return (
    <div>
      <div className="sticky top-0 z-30 mb-7 flex flex-wrap items-start justify-between gap-5 rounded-md border border-line bg-white/95 px-4 py-3 shadow-[0_4px_16px_rgba(18,53,51,0.10)] backdrop-blur sm:px-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sage-light font-serif text-[22px] font-bold text-teal-dark">
            {isNew ? "+" : initials(initial)}
          </div>
          <div>
            <h1 className="mb-1 font-serif text-[28px] text-teal-dark">
              {isNew ? "New Resident Record" : fullName(initial)}
            </h1>
            <div className="text-sm text-slate-light">
              {readOnly && (
                <span className="mr-2 rounded bg-gold-light px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#8A6A1F]">
                  View only
                </span>
              )}
              {!isNew &&
                (initial.barangay
                  ? `${initial.barangay}${initial.city_municipality ? `, ${initial.city_municipality}` : ""}`
                  : "No address on file")}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Link
            href="/records"
            className="whitespace-nowrap rounded-md border border-line bg-white px-4 py-2.5 text-sm font-semibold text-teal transition hover:border-teal"
          >
            ← Back to records
          </Link>
          {!isNew && !readOnly && (
            <button
              onClick={handleDelete}
              className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-line bg-white px-4 py-2.5 text-sm font-semibold text-danger transition hover:border-danger hover:bg-[#FCEEEC]"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
          {!readOnly && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="cursor-pointer whitespace-nowrap rounded-md bg-teal px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-teal-dark disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save record"}
            </button>
          )}
        </div>
      </div>

      <div className="mb-6">
        {dupLoading && duplicates.length === 0 && (
          <div className="flex items-center gap-2 rounded-md border border-line bg-white px-4 py-3 text-sm text-slate-light">
            <Search className="h-4 w-4 animate-pulse" />
            Checking for duplicate records...
          </div>
        )}

        {!dupLoading && dupDone && duplicates.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-sage">
            <CheckCircle2 className="h-4 w-4" />
            No matching records found.
          </div>
        )}
      </div>

      {dupModalOpen && duplicates.length > 0 && (
        <div
          className="fixed inset-0 z-[998] flex items-center justify-center bg-teal/30 px-4"
          onClick={() => setDupModalOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-md bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-1 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-base font-semibold text-slate">
                <AlertTriangle className="h-5 w-5 shrink-0 text-danger" />
                Possible duplicate found
              </div>
              <button
                onClick={() => setDupModalOpen(false)}
                aria-label="Close duplicate warning"
                className="cursor-pointer rounded p-1 text-slate-light transition hover:bg-cream hover:text-slate"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-4 text-sm text-slate-light">
              {dupBlocking
                ? "A record with the same name and birthdate already exists. Confirm below if this is a different person."
                : "Same name found without a matching birthdate. Please review before saving."}
            </p>

            <ul className="space-y-3">
              {duplicates.map((d) => (
                <li
                  key={d.id}
                  className="rounded-md border border-line bg-cream/50 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/records/${d.id}`}
                      className="font-semibold text-teal underline-offset-2 hover:underline"
                    >
                      {d.name}
                    </Link>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                        d.match === "exact_dob"
                          ? "bg-[#FCEEEC] text-danger"
                          : "bg-gold-light text-[#8A6A1F]"
                      }`}
                    >
                      {d.match === "exact_dob" ? "Same birthdate" : "Name match only"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-light">
                    {d.dateOfBirth && <span>DOB {d.dateOfBirth}</span>}
                    {(d.vicariate || d.parish || d.barangay) && (
                      <span>
                        {d.dateOfBirth ? " · " : ""}
                        {[d.parish, d.vicariate, d.barangay].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                onClick={() => setDupModalOpen(false)}
                className="cursor-pointer rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-teal transition hover:border-teal"
              >
                Review records
              </button>
              {dupBlocking && (
                <button
                  onClick={() => {
                    setDupAcknowledged(true);
                    setDupModalOpen(false);
                  }}
                  className="cursor-pointer rounded-md bg-teal px-4 py-2 text-sm font-semibold text-cream transition hover:bg-teal-dark"
                >
                  Save anyway
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        {groups.map((g) => renderStandardSection(g.section, g.fields))}
      </form>
    </div>
  );
}