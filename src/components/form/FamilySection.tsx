"use client";

import { Plus, X } from "lucide-react";
import { emptyFamilyMember } from "@/lib/types";
import type { FamilyMemberForm } from "@/lib/types";
import { SEX_OPTIONS, FAMILY_CATEGORY_OPTIONS, SACRAMENT_OPTIONS } from "@/lib/constants";
import Section from "@/components/ui/Section";
import Chip from "@/components/ui/Chip";

export interface FamilyRow {
  id?: number;
  data: FamilyMemberForm;
}

const inputClass =
  "w-full rounded-md border border-line bg-white px-3 py-2 font-sans text-sm text-slate outline-none transition focus:border-sage focus:ring-3 focus:ring-sage-light";

function Row({
  member,
  index,
  onUpdate,
  onRemove,
}: {
  member: FamilyMemberForm;
  index: number;
  onUpdate: (patch: Partial<FamilyMemberForm>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-md border border-line bg-cream/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-light">
          Family member {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-danger transition hover:bg-[#FCEEEC]"
        >
          <X className="h-3.5 w-3.5" />
          Remove
        </button>
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-[2fr_1fr_0.8fr_0.8fr_1.4fr]">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-light">
            Full name
          </label>
          <input
            type="text"
            value={member.full_name}
            onChange={(e) => onUpdate({ full_name: e.target.value })}
            className={inputClass}
            placeholder="e.g. Juan Dela Cruz Jr."
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-light">
            Relationship
          </label>
          <input
            type="text"
            value={member.relationship}
            onChange={(e) => onUpdate({ relationship: e.target.value })}
            className={inputClass}
            placeholder="e.g. Spouse, Child"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-light">
            Sex
          </label>
          <select
            value={member.sex}
            onChange={(e) => onUpdate({ sex: e.target.value })}
            className={inputClass}
          >
            <option value="">Select...</option>
            {SEX_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-light">
            Age
          </label>
          <input
            type="number"
            value={member.age}
            onChange={(e) => onUpdate({ age: e.target.value })}
            className={inputClass}
            placeholder="e.g. 35"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-light">
            Occupation
          </label>
          <input
            type="text"
            value={member.occupation}
            onChange={(e) => onUpdate({ occupation: e.target.value })}
            className={inputClass}
            placeholder="e.g. Farmer, Teacher"
          />
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-light">
          Category
        </label>
        <select
          value={member.category}
          onChange={(e) => onUpdate({ category: e.target.value })}
          className={`${inputClass} max-w-xs`}
        >
          <option value="">Select...</option>
          {FAMILY_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-light">
          Sacraments
        </label>
        <div className="flex flex-wrap gap-1.5">
          {SACRAMENT_OPTIONS.map((opt) => {
            const selected = member.sacraments.includes(opt);
            return (
              <Chip
                key={opt}
                label={opt}
                checked={selected}
                onChange={() =>
                  onUpdate({
                    sacraments: selected
                      ? member.sacraments.filter((s) => s !== opt)
                      : [...member.sacraments, opt],
                  })
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function FamilySection({
  members,
  onChange,
  readOnly,
}: {
  members: FamilyRow[];
  onChange: (members: FamilyRow[]) => void;
  readOnly?: boolean;
}) {
  const updateRow = (index: number, patch: Partial<FamilyMemberForm>) => {
    const next = members.map((m, i) =>
      i === index ? { ...m, data: { ...m.data, ...patch } } : m,
    );
    onChange(next);
  };

  const removeRow = (index: number) => {
    onChange(members.filter((_, i) => i !== index));
  };

  const addRow = () => {
    onChange([...members, { data: emptyFamilyMember() }]);
  };

  if (readOnly) {
    return (
      <Section title="Family members">
        {members.length === 0 ? (
          <p className="text-sm text-slate-light">No family members recorded.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {members.map((m, i) => (
              <div
                key={m.id ?? `new-${i}`}
                className="rounded-md border border-line bg-cream/50 p-4"
              >
                <div className="mb-1 font-serif text-[15px] font-semibold text-teal-dark">
                  {m.data.full_name || `Family member ${i + 1}`}
                </div>
                <section className="flex flex-wrap gap-x-4 gap-y-0.5 text-[13px] text-slate-light">
                  {m.data.relationship && <span>{m.data.relationship}</span>}
                  {m.data.sex && <span>{m.data.sex}</span>}
                  {m.data.age && <span>{m.data.age} yrs</span>}
                  {m.data.occupation && <span>{m.data.occupation}</span>}
                  {m.data.category && <span>{m.data.category}</span>}
                </section>
                {m.data.sacraments.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {m.data.sacraments.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-sage-light px-2.5 py-0.5 text-[11px] font-medium text-teal-dark"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>
    );
  }

  return (
    <Section title="Family members">
      {members.length === 0 ? (
        <p className="mb-4 text-sm text-slate-light">
          No family members added yet. Add the people living in the household.
        </p>
      ) : (
        <div className="mb-4 flex flex-col gap-3">
          {members.map((m, i) => (
            <Row
              key={m.id ?? `new-${i}`}
              member={m.data}
              index={i}
              onUpdate={(patch) => updateRow(i, patch)}
              onRemove={() => removeRow(i)}
            />
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={addRow}
        className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-sage px-4 py-2.5 text-sm font-semibold text-teal transition hover:bg-sage-light"
      >
        <Plus className="h-4 w-4" />
        Add family member
      </button>
    </Section>
  );
}