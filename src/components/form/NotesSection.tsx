"use client";

import FormField from "@/components/ui/FormField";
import Section from "@/components/ui/Section";
import type { FormFieldConfig } from "@/lib/types";

export default function NotesSection({
  fields,
  notes,
  recordedBy,
  disabled,
  onNotes,
  onRecordedBy,
}: {
  fields: FormFieldConfig[];
  notes: string;
  recordedBy: string;
  disabled?: boolean;
  onNotes: (v: string) => void;
  onRecordedBy: (v: string) => void;
}) {
  const notesField = fields.find((f) => f.name === "notes");
  const recordedByField = fields.find((f) => f.name === "recorded_by");
  const showNotes = notesField?.enabled;
  const showRecordedBy = recordedByField?.enabled;

  if (!showNotes && !showRecordedBy) return null;

  return (
    <Section title="Notes">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
        {showNotes && (
          <div className="md:col-span-2">
            <FormField
              type="textarea"
              label={notesField!.label}
              name="notes"
              value={notes}
              disabled={disabled}
              onChange={onNotes}
            />
          </div>
        )}
        {showRecordedBy && (
          <FormField
            label={recordedByField!.label}
            name="recorded_by"
            value={recordedBy}
            disabled={disabled}
            onChange={onRecordedBy}
          />
        )}
      </div>
    </Section>
  );
}