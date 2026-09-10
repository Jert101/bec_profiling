"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getTotalCount } from "@/lib/residents";

const TABS = [
  { view: "records", label: "Records", href: "/records" },
  { view: "stats", label: "Stats", href: "/stats" },
];

export default function LedgerSidebar() {
  const pathname = usePathname();
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    getTotalCount()
      .then((n) => alive && setTotal(n))
      .catch(() => alive && setTotal(null));
    return () => {
      alive = false;
    };
  }, [pathname]);

  const active =
    pathname.startsWith("/records") ? "records" : pathname.startsWith("/stats") ? "stats" : "records";

  return (
    <nav className="flex flex-col items-center gap-1 bg-teal pt-5 text-cream">
      <div className="mb-7 rotate-180 p-2 text-center font-serif text-[22px] font-bold tracking-widest [writing-mode:vertical-rl]">
        KZ
      </div>

      {TABS.map((tab) => (
        <Link
          key={tab.view}
          href={tab.href}
          className={`ml-1.5 mb-1 flex cursor-pointer flex-col items-center rounded-l-md px-2 py-3.5 text-xs font-semibold uppercase tracking-widest transition-colors [writing-mode:vertical-rl] ${
            active === tab.view
              ? "bg-cream text-teal-dark"
              : "bg-white/5 text-cream hover:bg-white/15"
          }`}
        >
          <span className="rotate-180">{tab.label}</span>
        </Link>
      ))}

      <div className="mt-auto mb-5 text-center text-[11px] leading-relaxed">
        <span className="block font-serif text-[22px] font-bold text-gold">
          {total ?? "–"}
        </span>
        total
      </div>
    </nav>
  );
}