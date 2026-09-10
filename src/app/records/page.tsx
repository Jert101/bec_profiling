"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { getStats, searchResidents } from "@/lib/residents";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Resident, Stats } from "@/lib/types";
import ResidentGrid from "@/components/records/ResidentGrid";
import EmptyState from "@/components/records/EmptyState";
import SupabaseSetup from "@/components/SupabaseSetup";

function RecordsApp() {
  const [query, setQuery] = useState("");
  const [residents, setResidents] = useState<Resident[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    let alive = true;
    const timer = setTimeout(() => {
      searchResidents(query)
        .then((r) => alive && setResidents(r))
        .catch((e: Error) => alive && setError(e.message))
        .finally(() => alive && setLoading(false));
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

  const handleSearch = (value: string) => {
    setQuery(value);
    setLoading(true);
  };

  return (
    <div className="mx-auto max-w-[1100px] px-10 pb-16 pt-7">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative min-w-[280px] flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-light" />
          <input
            type="text"
            placeholder="Search by name, barangay, occupation, contact, religion..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-md border border-line bg-white py-3 pl-10 pr-4 font-sans text-[15px] text-slate outline-none transition focus:border-sage focus:ring-3 focus:ring-sage-light"
          />
        </div>

        {stats && (
          <div className="whitespace-nowrap rounded-md border border-line bg-white px-4.5 py-2.5 text-[13px] text-slate-light">
            <strong className="font-serif text-base font-bold text-teal-dark">
              {stats.total}
            </strong>{" "}
            records ·{" "}
            <span className="text-[#8A6A1F]">
              <strong className="font-serif text-base font-bold">{stats.catholic}</strong>{" "}
              Catholic ({stats.catholicPct}%)
            </span>
          </div>
        )}

        <Link
          href="/records/new"
          className="whitespace-nowrap rounded-md bg-teal px-5 py-3 text-sm font-semibold text-cream transition hover:bg-teal-dark"
        >
          + New Record
        </Link>
      </div>

      {error ? (
        <div className="rounded-md border border-danger/30 bg-[#FCEEEC] px-5 py-4 text-sm text-danger">
          {error}
        </div>
      ) : loading && !residents.length ? (
        <div className="px-5 py-20 text-center text-slate-light">Loading records...</div>
      ) : residents.length ? (
        <ResidentGrid residents={residents} />
      ) : (
        <EmptyState searching={query.trim() !== ""} />
      )}
    </div>
  );
}

export default function RecordsPage() {
  if (!isSupabaseConfigured) return <SupabaseSetup />;
  return <RecordsApp />;
}