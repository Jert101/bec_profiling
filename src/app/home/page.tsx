"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Church, Plus, Users } from "lucide-react";
import { getStats, getVicariates, searchResidents } from "@/lib/residents";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Resident, Stats, Vicariate } from "@/lib/types";
import { fullName } from "@/lib/types";
import PageGuard from "@/components/PageGuard";
import SupabaseSetup from "@/components/SupabaseSetup";

function HomeApp() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [vicariates, setVicariates] = useState<Vicariate[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getStats()
      .then((s) => alive && setStats(s))
      .catch((e: Error) => alive && setError(e.message));
    getVicariates()
      .then((v) => alive && setVicariates(v))
      .catch(() => {});
    searchResidents("")
      .then((r) => alive && setResidents(r))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  const recent = [...residents]
    .sort((a, b) => b.date_recorded.localeCompare(a.date_recorded))
    .slice(0, 6);

  const countInParish = (vicName: string, parishName: string) =>
    residents.filter((r) => r.vicariate === vicName && r.parish === parishName).length;

  const parishCount = vicariates.reduce((n, v) => n + v.parishes.length, 0);

  const statCards = [
    { label: "Total members", value: residents.length, icon: Users, href: "/records" },
    { label: "Catholic members", value: stats?.catholic ?? 0, icon: Church, href: "/records" },
    { label: "Vicariates", value: vicariates.length, icon: Building2, href: "/records" },
    { label: "Parishes", value: parishCount, icon: Building2, href: "/records" },
  ];

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-7 sm:px-6 lg:px-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] text-teal-dark">Overview</h1>
          <p className="text-sm text-slate-light">
            Welcome back. Here is what&apos;s happening in your parish database.
          </p>
        </div>
        <Link
          href="/records/new"
          className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-md bg-teal px-5 py-3 text-sm font-semibold text-cream transition hover:bg-teal-dark"
        >
          <Plus className="h-4 w-4" />
          New Record
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-danger/30 bg-[#FCEEEC] px-5 py-4 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group rounded-md border border-line bg-white p-4 transition hover:border-teal hover:shadow-[0_2px_12px_rgba(27,77,74,0.10)]"
          >
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-sage-light text-teal-dark">
              <card.icon className="h-5 w-5" />
            </span>
            <span className="block font-serif text-[26px] font-bold leading-none text-teal-dark">
              {residents.length === 0 && stats === null && vicariates.length === 0 ? "–" : card.value}
            </span>
            <span className="mt-1 block text-[13px] text-slate-light">{card.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-md border border-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-[18px] font-bold text-teal-dark">Recent records</h2>
            <Link
              href="/records"
              className="flex cursor-pointer items-center gap-1 text-[13px] font-semibold text-teal transition hover:text-teal-dark"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="rounded-md border border-dashed border-line bg-cream/50 px-4 py-8 text-center text-sm text-slate-light">
              No records yet. Add your first resident profile.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/records/${r.id}`}
                    className="flex items-center justify-between gap-3 rounded-md px-2 py-2 transition hover:bg-sage-light/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-semibold text-slate">
                        {fullName(r)}
                      </span>
                      <span className="block truncate text-xs text-slate-light">
                        {[r.barangay, r.city_municipality].filter(Boolean).join(", ") || "No address"}
                      </span>
                    </span>
                    {r.parish && (
                      <span className="rounded bg-sage-light px-2 py-0.5 text-[11px] font-semibold text-teal-dark">
                        {r.parish}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-md border border-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-[18px] font-bold text-teal-dark">Members per parish</h2>
            <Link
              href="/records"
              className="flex cursor-pointer items-center gap-1 text-[13px] font-semibold text-teal transition hover:text-teal-dark"
            >
              Browse records <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {vicariates.length === 0 ? (
            <p className="rounded-md border border-dashed border-line bg-cream/50 px-4 py-8 text-center text-sm text-slate-light">
              No vicariates set up yet.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {vicariates.map((v) => (
                <div key={v.id}>
                  <h3 className="mb-1.5 text-[13px] font-bold uppercase tracking-wide text-teal-dark">
                    {v.name}
                  </h3>
                  <ul className="flex flex-col gap-1">
                    {v.parishes.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-3 text-[13px]">
                        <span className="truncate text-slate">{p.name}</span>
                        <span className="shrink-0 rounded bg-cream px-2 py-0.5 font-semibold text-slate-light">
                          {countInParish(v.name, p.name)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  if (!isSupabaseConfigured) return <SupabaseSetup />;
  return (
    <PageGuard page="dashboard">
      <HomeApp />
    </PageGuard>
  );
}