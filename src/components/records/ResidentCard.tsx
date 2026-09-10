import Link from "next/link";
import type { Resident } from "@/lib/types";
import { calcAge, fullName } from "@/lib/types";

export default function ResidentCard({ resident: r }: { resident: Resident }) {
  const age = calcAge(r.date_of_birth);

  return (
    <Link
      href={`/records/${r.id}`}
      className="block cursor-pointer rounded-md border border-line bg-white p-4 transition hover:-translate-y-px hover:border-sage hover:shadow-[0_4px_14px_rgba(27,77,74,0.08)]"
    >
      <div className="mb-1.5 font-serif text-[17px] font-semibold text-teal-dark">
        {fullName(r)}
      </div>
      <div className="flex flex-col gap-0.5 text-[13px] text-slate-light">
        <span>
          {r.barangay || "No barangay set"}
          {r.city_municipality ? `, ${r.city_municipality}` : ""}
        </span>
        <span>
          {age !== null ? `${age} yrs · ` : ""}
          {r.sex || ""}
        </span>
        {r.contact_number ? <span className="font-mono">{r.contact_number}</span> : null}
      </div>
      {r.religion ? (
        <span
          className={`mt-2 inline-block rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
            r.religion === "Roman Catholic"
              ? "bg-gold-light text-[#8A6A1F]"
              : "bg-sage-light text-teal-dark"
          }`}
        >
          {r.religion}
        </span>
      ) : null}
    </Link>
  );
}