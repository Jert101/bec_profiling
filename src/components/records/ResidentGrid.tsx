import type { Resident } from "@/lib/types";
import ResidentCard from "./ResidentCard";

export default function ResidentGrid({ residents }: { residents: Resident[] }) {
  if (residents.length === 0) return null;
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3.5">
      {residents.map((r) => (
        <ResidentCard key={r.id} resident={r} />
      ))}
    </div>
  );
}