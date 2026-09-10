import { emptyForm } from "@/lib/types";
import RecordForm from "@/components/RecordForm";

export default function NewRecordPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-10 pb-16 pt-7">
      <RecordForm initial={emptyForm()} isNew />
    </div>
  );
}