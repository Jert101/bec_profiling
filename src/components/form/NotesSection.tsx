"use client";

import FormField from "@/components/ui/FormField";
import Section from "@/components/ui/Section";

export default function NotesSection({
  notes,
  recordedBy,
  onNotes,
  onRecordedBy,
}: {
  notes: string;
  recordedBy: string;
  onNotes: (v: string) => void;
  onRecordedBy: (v: string) => void;
}) {
  return (
    <Section title="Notes">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-light">
              Notes / remarks
            </label>
            <textarea
              name="notes"
              value={notes}
              onChange={(e) => onNotes(e.target.value)}
              className="min-h-[70px] w-full resize-y rounded-md border border-line bg-white px-3 py-2.5 font-sans text-sm text-slate outline-none transition focus:border-sage focus:ring-3 focus:ring-sage-light"
            />
          </div>
        </div>
        <FormField label="Recorded by" name="recorded_by" value={recordedBy} onChange={onRecordedBy} />
      </div>
    </Section>
  );
}