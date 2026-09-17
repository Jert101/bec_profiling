"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  LayoutGrid,
  Search,
  Users,
} from "lucide-react";
import { getStats, getVicariates, searchResidents } from "@/lib/residents";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Resident, Stats, Vicariate } from "@/lib/types";
import ResidentGrid from "@/components/records/ResidentGrid";
import EmptyState from "@/components/records/EmptyState";
import SupabaseSetup from "@/components/SupabaseSetup";
import PageGuard from "@/components/PageGuard";
import { useApp } from "@/components/AppProvider";

const ALL = "__all__";
const UNASSIGNED = "__unassigned__";

function RecordsApp() {
  const { session } = useApp();
  const isParishRole = session?.role === "parish";
  const parishName = session?.parishName ?? null;

  const [vicariates, setVicariates] = useState<Vicariate[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [vic, setVic] = useState<Vicariate | null>(null);
  const [parish, setParish] = useState<string | null>(
    isParishRole ? parishName : null,
  );
  const [query, setQuery] = useState("");

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((e: Error) => setError(e.message));
    let alive = true;
    getVicariates()
      .then((v) => alive && setVicariates(v))
      .catch(() => {});
    searchResidents("")
      .then((r) => alive && setResidents(r))
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const view: "vicariates" | "parishes" | "residents" = isParishRole
    ? "residents"
    : vic === null && parish === null
      ? "vicariates"
      : vic !== null && parish === null
        ? "parishes"
        : "residents";

  const current = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return residents;
    return residents.filter((r) =>
      `${r.first_name} ${r.middle_name ?? ""} ${r.last_name} ${r.suffix ?? ""} ${
        r.barangay ?? ""
      } ${r.vicariate ?? ""} ${r.parish ?? ""} ${r.contact_number ?? ""} ${
        r.occupation ?? ""
      }`
        .toLowerCase()
        .includes(q),
    );
  }, [residents, query]);

  const visible = useMemo(() => {
    if (view !== "residents") return current;
    if (parish === ALL) return vic ? current.filter((r) => r.vicariate === vic.name) : current;
    if (parish === UNASSIGNED) return current.filter((r) => !r.parish);
    if (parish) return current.filter((r) => (!vic || r.vicariate === vic.name) && r.parish === parish);
    return current;
  }, [view, current, parish, vic]);

  const countInVicariate = (name: string) => residents.filter((r) => r.vicariate === name).length;
  const countInParish = (vicName: string | null, parishName: string) =>
    residents.filter((r) => (!vicName || r.vicariate === vicName) && r.parish === parishName).length;
  const unassignedCount = residents.filter((r) => !r.parish).length;
  const parishCount = vicariates.reduce((n, v) => n + v.parishes.length, 0);

  const goUp = () => {
    setQuery("");
    if (parish !== null) setParish(null);
    else setVic(null);
  };

  const backLabel =
    view === "parishes" ? "Vicariates" : vic ? `${vic.name}` : "Vicariates";

  const title =
    view === "vicariates"
      ? "Records"
      : view === "parishes"
        ? `${vic?.name ?? "Parishes"}`
        : parish === UNASSIGNED
          ? "Unassigned records"
          : parish === ALL
            ? vic
              ? `All records in ${vic.name}`
              : "All records"
            : (parish ?? "Residents");

  const subtitle =
    view === "vicariates"
      ? "Browse members by vicariate and parish, or search everything at once."
      : view === "parishes"
        ? `Select a parish in ${vic?.name ?? "this vicariate"} to view its members.`
        : parish === UNASSIGNED
          ? "Records that are not yet tagged to a parish."
          : parish === ALL
            ? `Every member${
                vic ? ` under ${vic.name}` : ""
              } in one place — search or browse below.`
            : `Members of ${parish ?? "this parish"} · ${current.length}${
                query.trim() ? ` match${current.length === 1 ? "" : "es"} for "${query.trim()}"` : ""
              }`;

  const cardClass =
    "flex cursor-pointer items-center gap-3 rounded-md border border-line bg-white p-4 text-left transition hover:border-teal hover:shadow-[0_2px_12px_rgba(27,77,74,0.10)]";

  const statTile = (href: string, icon: ReactNode, value: number, label: string) => (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md border border-line bg-white p-3.5 transition hover:border-teal"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sage-light text-teal-dark">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-serif text-[22px] font-bold leading-none text-teal-dark">
          {value}
        </span>
        <span className="block truncate text-[12px] text-slate-light">{label}</span>
      </span>
    </Link>
  );

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-7 sm:px-6 lg:px-10">
      <div className="sticky top-0 z-30 mb-6 rounded-md border border-line bg-white/95 px-4 py-3 shadow-[0_4px_16px_rgba(18,53,51,0.10)] backdrop-blur sm:px-5">
        <div className="flex flex-wrap items-center gap-3">
          {!isParishRole && (
            <button
              onClick={goUp}
              disabled={view === "vicariates"}
              className="flex cursor-pointer items-center gap-1 rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-teal transition hover:border-teal disabled:cursor-default disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {backLabel}
            </button>
          )}
          <div className="min-w-0 flex-1">
            {isParishRole && (
              <h1 className="truncate font-serif text-[22px] text-teal-dark">
                {parishName ?? "Records"}
              </h1>
            )}
            {!isParishRole && <h1 className="truncate font-serif text-[22px] text-teal-dark">{title}</h1>}
            {view === "vicariates" && (
              <p className="text-sm text-slate-light">
                {stats
                  ? `${stats.total} recorded ${
                      stats.total === 1 ? "member" : "members"
                    } across the vicariates.`
                  : "Loading summary..."}
              </p>
            )}
            {(view === "parishes" || view === "residents") && (
              <p className="truncate text-sm text-slate-light">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-line pt-3">
          {view === "residents" && (
            <div className="relative w-full min-w-0 flex-1 sm:min-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-light" />
              <input
                type="text"
                placeholder={`Search within ${title}...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-md border border-line bg-white py-2.5 pl-10 pr-4 font-sans text-[15px] text-slate outline-none transition focus:border-sage focus:ring-3 focus:ring-sage-light"
              />
            </div>
          )}

          {view === "residents" && !loading && (
            <span className="text-[13px] text-slate-light">
              {visible.length} {visible.length === 1 ? "member" : "members"}
              {query.trim() && current.length !== visible.length ? " shown" : ""}
            </span>
          )}

          <Link
            href="/records/new"
            className="ml-auto whitespace-nowrap rounded-md bg-teal px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-teal-dark"
          >
            + New Record
          </Link>
        </div>
      </div>

      {view === "vicariates" && (
        <div className="mb-6 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {statTile(
            "/records",
            <Users className="h-5 w-5" />,
            residents.length,
            "Total members",
          )}
          {statTile("/records", <LayoutGrid className="h-5 w-5" />, vicariates.length, "Vicariates")}
          {statTile("/records", <Building2 className="h-5 w-5" />, parishCount, "Parishes")}
          {statTile(
            "/records",
            <FolderOpen className="h-5 w-5" />,
            unassignedCount,
            "Unassigned",
          )}
        </div>
      )}

      {error ? (
        <div className="rounded-md border border-danger/30 bg-[#FCEEEC] px-5 py-4 text-sm text-danger">
          {error}
        </div>
      ) : loading && !residents.length ? (
        <div className="px-5 py-20 text-center text-slate-light">Loading records...</div>
      ) : view === "vicariates" ? (
        residents.length === 0 && vicariates.length === 0 ? (
          <EmptyState searching={false} />
        ) : (
          <>
            <div className="mb-3 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-slate-light">
              <LayoutGrid className="h-4 w-4" />
              Vicariates &amp; parishes
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-3.5">
              <button
                onClick={() => {
                  setQuery("");
                  setVic(null);
                  setParish(ALL);
                }}
                className={cardClass}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sage-light text-teal-dark">
                  <Users className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-[15px] font-semibold text-teal-dark">
                    All records
                  </span>
                  <span className="text-xs text-slate-light">
                    Everyone in the database · {residents.length} members
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-light" />
              </button>

              {vicariates.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setQuery("");
                    setVic(v);
                    setParish(null);
                  }}
                  className={cardClass}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sage-light text-teal-dark">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="block truncate font-serif text-[15px] font-semibold text-teal-dark">
                        {v.name}
                      </span>
                      <span className="shrink-0 rounded bg-cream px-1.5 py-0.5 text-xs font-semibold text-slate-light">
                        {countInVicariate(v.name)}
                      </span>
                    </span>
                    <span className="text-xs text-slate-light">
                      {v.parishes.length} {v.parishes.length === 1 ? "parish" : "parishes"}
                    </span>
                  </span>
                </button>
              ))}

              {unassignedCount > 0 && (
                <button
                  onClick={() => {
                    setQuery("");
                    setVic(null);
                    setParish(UNASSIGNED);
                  }}
                  className={cardClass}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-cream text-slate-light">
                    <FolderOpen className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-[15px] font-semibold text-slate-dark">
                      Unassigned
                    </span>
                    <span className="text-xs text-slate-light">{unassignedCount} members</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-light" />
                </button>
              )}
            </div>
          </>
        )
      ) : view === "parishes" && vic ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-3.5">
          <button
            onClick={() => {
              setQuery("");
              setParish(ALL);
            }}
            className={cardClass}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sage-light text-teal-dark">
              <Users className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-serif text-[15px] font-semibold text-teal-dark">
                All in {vic.name}
              </span>
              <span className="text-xs text-slate-light">
                {countInVicariate(vic.name)} {countInVicariate(vic.name) === 1 ? "member" : "members"}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-light" />
          </button>

          {vic.parishes.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setQuery("");
                setParish(p.name);
              }}
              className={cardClass}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sage-light text-teal-dark">
                <Building2 className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-serif text-[15px] font-semibold text-teal-dark">
                  {p.name}
                </span>
                <span className="text-xs text-slate-light">
                  {countInParish(vic.name, p.name)}{" "}
                  {countInParish(vic.name, p.name) === 1 ? "member" : "members"}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-light" />
            </button>
          ))}

          {vic.parishes.length === 0 && (
            <p className="rounded-md border border-dashed border-line bg-cream/50 px-4 py-8 text-center text-sm text-slate-light">
              No parishes yet in this vicariate.
            </p>
          )}
        </div>
      ) : visible.length > 0 ? (
        <ResidentGrid residents={visible} />
      ) : (
        <EmptyState searching={query.trim() !== "" || view === "residents"} />
      )}
    </div>
  );
}

export default function RecordsPage() {
  if (!isSupabaseConfigured) return <SupabaseSetup />;
  return (
    <PageGuard page="records">
      <RecordsApp />
    </PageGuard>
  );
}