"use client";

import { useEffect, useMemo, useState } from "react";
import { getFamilyStats, getVicariates, searchResidents } from "@/lib/residents";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { FamilyStats, Resident, Vicariate } from "@/lib/types";
import { calcAge } from "@/lib/types";
import { SACRAMENT_OPTIONS } from "@/lib/constants";
import SupabaseSetup from "@/components/SupabaseSetup";
import PageGuard from "@/components/PageGuard";
import { useApp } from "@/components/AppProvider";

type Bucket = { label: string; count: number; pct: number };

function pctOf(count: number, total: number): number {
  return total ? Math.round((count / total) * 1000) / 10 : 0;
}

function buildBuckets(get: (r: Resident) => string | null, residents: Resident[]): Bucket[] {
  const map = new Map<string, number>();
  for (const r of residents) {
    const key = get(r) || "(Not specified)";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count, pct: pctOf(count, residents.length) }))
    .sort((a, b) => b.count - a.count);
}

function ageGroup(dob: string | null | undefined): string | null {
  const age = calcAge(dob);
  if (age === null) return null;
  if (age <= 12) return "Children (0–12)";
  if (age <= 17) return "Youth (13–17)";
  if (age <= 30) return "Young adult (18–30)";
  if (age <= 59) return "Adult (31–59)";
  return "Senior (60+)";
}

function BarRow({ label, count, pct, barClass = "bg-teal" }: Bucket & { barClass?: string }) {
  return (
    <div className="mb-2.5 grid grid-cols-[110px_1fr_70px] items-center gap-3 text-[13px] last:mb-0 sm:grid-cols-[150px_1fr_80px]">
      <span className="truncate sm:whitespace-normal">{label}</span>
      <div className="h-2.5 overflow-hidden rounded-full bg-sage-light">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-right text-slate-light">
        {count} ({pct}%)
      </span>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-white p-5">
      <h2 className="mb-4 font-serif text-[18px] font-bold text-teal-dark">{title}</h2>
      {children}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p className="rounded-md border border-dashed border-line bg-cream/50 px-4 py-6 text-center text-sm text-slate-light">
      {text}
    </p>
  );
}

function StatsApp() {
  const { session } = useApp();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [vicariates, setVicariates] = useState<Vicariate[]>([]);
  const [familyStats, setFamilyStats] = useState<FamilyStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getVicariates()
      .then((v) => alive && setVicariates(v))
      .catch(() => {});
    getFamilyStats()
      .then((f) => alive && setFamilyStats(f))
      .catch(() => {});
    searchResidents("")
      .then((r) => alive && setResidents(r))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  const total = residents.length;

  const sexBuckets = useMemo(() => buildBuckets((r) => r.sex, residents), [residents]);
  const civilBuckets = useMemo(() => buildBuckets((r) => r.civil_status, residents), [residents]);
  const ageBuckets = useMemo(() => buildBuckets((r) => ageGroup(r.date_of_birth), residents), [residents]);

  const sacBars = useMemo(() => {
    const out: Bucket[] = [];
    for (const name of SACRAMENT_OPTIONS) {
      const count = residents.filter((r) => (r.sacraments ?? []).includes(name)).length;
      out.push({ label: name, count, pct: pctOf(count, total) });
    }
    return out;
  }, [residents, total]);

  const male = sexBuckets.find((b) => b.label === "Male")?.count ?? 0;
  const female = sexBuckets.find((b) => b.label === "Female")?.count ?? 0;
  const seniors = ageBuckets.find((b) => b.label === "Senior (60+)")?.count ?? 0;
  const isParishRole = session?.role === "parish";
  const parishCount = isParishRole
    ? 1
    : vicariates.reduce((n, v) => n + v.parishes.length, 0);
  const countInParish = (vicName: string, parishName: string) =>
    residents.filter((r) => r.vicariate === vicName && r.parish === parishName).length;

  const myParish = isParishRole
    ? vicariates
        .flatMap((v) => v.parishes.map((p) => ({ vicName: v.name, parish: p })))
        .find(({ parish: p }) => p.name === session?.parishName) ?? null
    : null;

  const summary = [
    { label: "Total members", value: total },
    { label: "Male", value: male },
    { label: "Female", value: female },
    { label: "Seniors (60+)", value: seniors },
    { label: "Parishes", value: parishCount },
    { label: "Family members", value: familyStats?.total ?? 0 },
  ];

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-7 sm:px-6 lg:px-10">
      <div className="sticky top-0 z-30 mb-6 rounded-md border border-line bg-white/95 px-4 py-3 shadow-[0_4px_16px_rgba(18,53,51,0.10)] backdrop-blur sm:px-5">
        <h1 className="font-serif text-[24px] text-teal-dark">Statistics</h1>
        <div className="mt-1 text-sm text-slate-light">
          {total > 0
            ? `Breakdown across ${total} recorded ${total === 1 ? "resident" : "residents"}`
            : "Loading profile statistics..."}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-danger/30 bg-[#FCEEEC] px-5 py-4 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        {summary.map((s) => (
          <div key={s.label} className="rounded-md border border-line bg-white p-4 text-center">
            <div className="font-serif text-[26px] font-bold leading-none text-teal-dark">{s.value}</div>
            <div className="mt-1.5 text-[12px] leading-tight text-slate-light">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Block title="Sex">
          {sexBuckets.length === 0 ? (
            <EmptyHint text="No sex information recorded yet." />
          ) : (
            sexBuckets.map((b) => <BarRow key={b.label} {...b} barClass="bg-sage" />)
          )}
        </Block>

        <Block title="Age groups">
          {ageBuckets.length === 0 ? (
            <EmptyHint text="No date of birth recorded yet." />
          ) : (
            ageBuckets.map((b) => <BarRow key={b.label} {...b} barClass="bg-teal" />)
          )}
        </Block>

        <Block title="Civil status">
          {civilBuckets.length === 0 ? (
            <EmptyHint text="No civil status information recorded yet." />
          ) : (
            civilBuckets.map((b) => <BarRow key={b.label} {...b} barClass="bg-gold" />)
          )}
        </Block>

        <Block title="Sacraments received">
          {total === 0 ? (
            <EmptyHint text="Add resident records to see sacraments coverage." />
          ) : (
            sacBars.map((b, i) => (
              <BarRow key={b.label} {...b} barClass={i % 2 === 0 ? "bg-teal" : "bg-sage"} />
            ))
          )}
        </Block>

        <Block title="Members per parish">
          {vicariates.length === 0 ? (
            <EmptyHint text="No vicariates have been set up yet." />
          ) : isParishRole && myParish ? (
            <div className="flex flex-col gap-4">
              <h3 className="mb-1.5 text-[13px] font-bold uppercase tracking-wide text-teal-dark">
                {myParish.vicName}
              </h3>
              <ul className="flex flex-col gap-1">
                <li className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="truncate text-slate">{myParish.parish.name}</span>
                  <span className="shrink-0 rounded bg-cream px-2 py-0.5 font-semibold text-slate-light">
                    {countInParish(myParish.vicName, myParish.parish.name)}
                  </span>
                </li>
              </ul>
            </div>
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
                    {v.parishes.length === 0 && (
                      <li className="text-xs text-slate-light">No parishes yet.</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Block>

        <Block title="Family members by category">
          {!familyStats || familyStats.total === 0 ? (
            <EmptyHint text="No family members recorded yet." />
          ) : (
            <>
              <p className="mb-3 text-sm text-slate-light">
                {familyStats.total} family member{familyStats.total === 1 ? "" : "s"} across all
                households.
              </p>
              {familyStats.byCategory.map((c) => (
                <BarRow
                  key={c.category}
                  label={c.category}
                  count={c.count}
                  pct={pctOf(c.count, familyStats.total)}
                  barClass="bg-sage"
                />
              ))}
            </>
          )}
        </Block>
      </div>
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