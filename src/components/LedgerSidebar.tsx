"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getTotalCount } from "@/lib/residents";
import { useApp } from "@/components/AppProvider";

const COMMON_TABS = [
  { view: "records", label: "Records", href: "/records" },
  { view: "stats", label: "Stats", href: "/stats" },
];

export default function LedgerSidebar() {
  const pathname = usePathname();
  const { session, logout } = useApp();
  const [total, setTotal] = useState<number | null>(null);

  const isAdmin = session?.role === "admin";
  const tabs = isAdmin
    ? [{ view: "dashboard", label: "Dashboard", href: "/dashboard" }, ...COMMON_TABS]
    : COMMON_TABS;

  useEffect(() => {
    let alive = true;
    getTotalCount()
      .then((n) => alive && setTotal(n))
      .catch(() => alive && setTotal(null));
    return () => {
      alive = false;
    };
  }, [pathname]);

  const active = pathname.startsWith("/dashboard")
    ? "dashboard"
    : pathname.startsWith("/stats")
      ? "stats"
      : "records";

  return (
    <nav className="flex flex-col items-center gap-1 bg-teal pt-5 text-cream">
      <div className="mb-7 rotate-180 p-2 text-center font-serif text-[22px] font-bold tracking-widest [writing-mode:vertical-rl]">
        KZ
      </div>

      {tabs.map((tab) => (
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

      <div className="mt-auto flex flex-col items-center gap-2 pb-4">
        <span className="text-center text-[11px] leading-relaxed">
          <span className="block font-serif text-[22px] font-bold text-gold">
            {total ?? "–"}
          </span>
          total
        </span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          {isAdmin ? "Admin" : "Moderator"}
        </span>
        <button
          onClick={logout}
          className="cursor-pointer rounded-md bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-cream transition hover:bg-white/20"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}