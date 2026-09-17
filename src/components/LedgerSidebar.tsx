"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getTotalCount } from "@/lib/residents";
import { useApp } from "@/components/AppProvider";
import type { PageKey } from "@/lib/types";

const TAB_DEFS: Record<PageKey, { label: string; hrefFor: (isAdmin: boolean) => string }> = {
  dashboard: { label: "Dashboard", hrefFor: (isAdmin) => (isAdmin ? "/dashboard" : "/home") },
  records: { label: "Records", hrefFor: () => "/records" },
  stats: { label: "Stats", hrefFor: () => "/stats" },
  logs: { label: "Activity Log", hrefFor: () => "/timestamp" },
};

export default function LedgerSidebar() {
  const pathname = usePathname();
  const { session, logout, pages, pagesReady } = useApp();
  const [total, setTotal] = useState<number | null>(null);

  const isAdmin = session?.role === "admin";
  const roleLabel =
    isAdmin
      ? "Admin"
      : session?.role === "parish"
        ? (session.parishName ?? "Parish")
        : "Moderator";
  const tabs = pages.map((view) => ({
    view,
    label: TAB_DEFS[view].label,
    href: TAB_DEFS[view].hrefFor(isAdmin),
  }));

  useEffect(() => {
    let alive = true;
    getTotalCount()
      .then((n) => alive && setTotal(n))
      .catch(() => alive && setTotal(null));
    return () => {
      alive = false;
    };
  }, [pathname]);

  const active = pathname.startsWith("/dashboard") || pathname.startsWith("/home")
    ? "dashboard"
    : pathname.startsWith("/stats")
      ? "stats"
      : pathname.startsWith("/timestamp")
        ? "logs"
        : "records";

  return (
    <nav className="flex flex-col items-center gap-1 bg-teal pt-5 text-cream">
      <Image
        src="/logo.png"
        alt="Logo"
        width={40}
        height={40}
        className="mb-6 h-10 w-10 rounded-full object-cover"
        priority
      />

      {tabs.length > 0 && !pagesReady && (
        <span className="mt-2 text-[11px] text-cream/70">Loading…</span>
      )}

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
          {roleLabel}
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