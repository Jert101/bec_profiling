import { emptyForm } from "@/lib/types";
import RecordForm from "@/components/RecordForm";
import PageGuard from "@/components/PageGuard";

export default function NewRecordPage() {
  return (
    <PageGuard page="records">
      <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-7 sm:px-6 lg:px-10">
        <RecordForm initial={emptyForm()} isNew />
      </div>
    </PageGuard>
  );
}