"use client";

import { useEffect, useState } from "react";
import { getStats } from "@/lib/residents";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Stats } from "@/lib/types";
import SupabaseSetup from "@/components/SupabaseSetup";
import PageGuard from "@/components/PageGuard";

function StatsApp() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-7 sm:px-6 lg:px-10">
      <div className="mb-6">
        <h1 className="font-serif text-[26px] text-teal-dark">Religion breakdown</h1>
        <div className="mt-1 text-sm text-slate-light">
          {stats ? `Across ${stats.total} recorded ${stats.total === 1 ? "resident" : "residents"}` : "Loading..."}
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-danger/30 bg-[#FCEEEC] px-5 py-4 text-sm text-danger">
          {error}
        </div>
      ) : !stats ? (
        <div className="rounded-md border border-line bg-white px-6 py-8 text-slate-light">
          Loading...
        </div>
      ) : stats.total === 0 ? (
        <div className="rounded-md border border-line bg-white px-6 py-16 text-center text-slate-light">
          <div className="mb-3 text-4xl">📊</div>
          <h3 className="mb-2 text-lg text-slate-light">No data yet</h3>
          <p className="text-sm">Add resident records to see the religion breakdown here.</p>
        </div>
      ) : (
        <div className="rounded-md border border-line bg-white p-6">
          {stats.religionBreakdown.map((row) => (
            <div
              key={row.religion}
              className="mb-3 grid grid-cols-[120px_1fr_60px] items-center gap-3 text-[13px] last:mb-0 sm:grid-cols-[160px_1fr_70px]"
            >
              <span className="truncate">{row.religion}</span>
              <div className="h-2.5 overflow-hidden rounded-full bg-sage-light">
                <div
                  className={`h-full rounded-full ${row.religion === "Roman Catholic" ? "bg-gold" : "bg-sage"}`}
                  style={{ width: `${row.pct}%` }}
                />
              </div>
              <span className="text-right text-slate-light">
                {row.count} ({row.pct}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StatsPage() {
  if (!isSupabaseConfigured) return <SupabaseSetup />;
  return (
    <PageGuard page="stats">
      <StatsApp />
    </PageGuard>
  );
}