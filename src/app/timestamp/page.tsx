"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  FolderCog,
  KeyRound,
  LogIn,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserPen,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  ACTION_LABELS,
  clearActivityLogs,
  describeActivity,
  getActivityCounts,
  getActivityLogs,
} from "@/lib/activity";
import type { ActivityLogRow } from "@/lib/activity";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useApp } from "@/components/AppProvider";
import SupabaseSetup from "@/components/SupabaseSetup";
import PageGuard from "@/components/PageGuard";

const CATEGORIES: Record<string, { label: string; match: (a: string) => boolean }> = {
  all: { label: "All activities", match: () => true },
  residents: { label: "Records", match: (a) => a.startsWith("resident.") },
  family: { label: "Family members", match: (a) => a.startsWith("family_") },
  hierarchy: { label: "Vicariates & parishes", match: (a) => a.startsWith("vicariate") || a.startsWith("parish") },
  config: { label: "Form & access", match: (a) => a === "form_fields.updated" || a === "role_pages.updated" },
  auth: { label: "Sign-ins & security", match: (a) => a.startsWith("auth.") || a.startsWith("code.") },
};

function actionIcon(action: string): { icon: ReactNode; tone: string } {
  if (action === "resident.created") return { icon: <UserPlus className="h-4 w-4" />, tone: "bg-sage-light text-teal-dark" };
  if (action === "resident.updated") return { icon: <UserPen className="h-4 w-4" />, tone: "bg-sage-light text-teal-dark" };
  if (action === "resident.deleted") return { icon: <UserX className="h-4 w-4" />, tone: "bg-[#FCEEEC] text-danger" };
  if (action === "family_members.created" || action === "family_member.updated" || action === "family_members.deleted")
    return { icon: <Users className="h-4 w-4" />, tone: "bg-sage-light text-teal-dark" };
  if (action.startsWith("vicariate.") || action.startsWith("parish."))
    return { icon: <Building2 className="h-4 w-4" />, tone: "bg-gold-light text-[#8A6A1F]" };
  if (action === "form_fields.updated") return { icon: <FolderCog className="h-4 w-4" />, tone: "bg-gold-light text-[#8A6A1F]" };
  if (action === "role_pages.updated") return { icon: <ShieldCheck className="h-4 w-4" />, tone: "bg-gold-light text-[#8A6A1F]" };
  if (action === "code.changed") return { icon: <KeyRound className="h-4 w-4" />, tone: "bg-gold-light text-[#8A6A1F]" };
  if (action === "auth.login") return { icon: <LogIn className="h-4 w-4" />, tone: "bg-sage-light text-teal-dark" };
  if (action === "auth.logout") return { icon: <LogOut className="h-4 w-4" />, tone: "bg-sage-light text-teal-dark" };
  if (action === "auth.login_failed") return { icon: <AlertTriangle className="h-4 w-4" />, tone: "bg-[#FCEEEC] text-danger" };
  return { icon: <Clock className="h-4 w-4" />, tone: "bg-sage-light text-teal-dark" };
}

const timeFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return timeFmt.format(then);
}

function TimestampApp() {
  const { showToast } = useApp();
  const [rows, setRows] = useState<ActivityLogRow[]>([]);
  const [counts, setCounts] = useState<{ total: number; today: number }>({ total: 0, today: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("all");
  const [actor, setActor] = useState("all");
  const [query, setQuery] = useState("");
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const load = useCallback((withSpinner: boolean) => {
    if (withSpinner) setLoading(true);
    Promise.all([getActivityLogs(300), getActivityCounts()])
      .then(([logs, c]) => {
        setRows(logs);
        setCounts(c);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(false), 0);
    return () => clearTimeout(t);
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (!CATEGORIES[category].match(r.action)) return false;
      if (actor !== "all" && (r.acted_by ?? "none") !== actor) return false;
      if (q) {
        const text = `${ACTION_LABELS[r.action] ?? r.action} ${describeActivity(r)}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [rows, category, actor, query]);

  const handleClear = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setClearing(true);
    try {
      const n = await clearActivityLogs();
      showToast(`Cleared ${n} log entries`);
      setConfirmClear(false);
      load(false);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not clear the log", true);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-7 sm:px-6 lg:px-10">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[22px] text-teal-dark">Activity Log</h1>
          <p className="text-sm text-slate-light">
            A timestamp record of every activity in this system — created, updated, deleted, and more.
          </p>
        </div>
        <button
          onClick={() => {
            setError(null);
            load(true);
          }}
          disabled={loading}
          className="flex cursor-pointer items-center gap-1.5 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-teal transition hover:border-teal disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <div className="rounded-md border border-line bg-white p-3.5">
          <span className="block font-serif text-[22px] font-bold leading-none text-teal-dark">{counts.total}</span>
          <span className="text-[12px] text-slate-light">Total activities</span>
        </div>
        <div className="rounded-md border border-line bg-white p-3.5">
          <span className="block font-serif text-[22px] font-bold leading-none text-teal-dark">{counts.today}</span>
          <span className="text-[12px] text-slate-light">Today</span>
        </div>
        <div className="rounded-md border border-line bg-white p-3.5">
          <span className="block font-serif text-[22px] font-bold leading-none text-teal-dark">
            {rows.filter((r) => r.entity === "resident").length}
          </span>
          <span className="text-[12px] text-slate-light">Record changes shown</span>
        </div>
        <div className="rounded-md border border-line bg-white p-3.5">
          <span className="block font-serif text-[22px] font-bold leading-none text-teal-dark">
            {rows.filter((r) => r.action.startsWith("auth.login")).length}
          </span>
          <span className="text-[12px] text-slate-light">Sign-ins shown</span>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative w-full min-w-0 flex-1 sm:min-w-[240px] sm:flex-none sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-light" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the log..."
            className="w-full rounded-md border border-line bg-white py-2.5 pl-9 pr-4 text-sm text-slate outline-none transition focus:border-sage focus:ring-3 focus:ring-sage-light"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="cursor-pointer rounded-md border border-line bg-white px-3 py-2.5 text-sm text-slate outline-none transition focus:border-sage"
        >
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <select
          value={actor}
          onChange={(e) => setActor(e.target.value)}
          className="cursor-pointer rounded-md border border-line bg-white px-3 py-2.5 text-sm text-slate outline-none transition focus:border-sage"
        >
          <option value="all">Any user</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
        </select>
      </div>

      {error ? (
        <div className="rounded-md border border-danger/30 bg-[#FCEEEC] px-5 py-4 text-sm text-danger">{error}</div>
      ) : loading && rows.length === 0 ? (
        <div className="px-5 py-20 text-center text-slate-light">Loading activity log...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-line bg-cream/50 px-5 py-16 text-center">
          <Clock className="mx-auto mb-3 h-8 w-8 text-slate-light" />
          <h3 className="mb-1 text-lg text-slate-light">No activities here yet</h3>
          <p className="text-sm text-slate-light">Actions you take in the system will appear here with their timestamps.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-md border border-line bg-white">
          {filtered.map((r) => {
            const { icon, tone } = actionIcon(r.action);
            const desc = describeActivity(r);
            const isResident = r.entity === "resident" && r.entity_id !== null;
            const label = ACTION_LABELS[r.action] ?? r.action;
            return (
              <li key={r.id} className="flex items-start gap-3 px-4 py-3.5">
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${tone}`}>
                  {icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate">
                    {isResident ? (
                      <Link href={`/records/${r.entity_id}`} className="text-teal underline-offset-2 hover:underline">
                        {label}
                      </Link>
                    ) : (
                      label
                    )}
                  </p>
                  {desc && <p className="mt-0.5 text-sm text-slate-light">{desc}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                  <span className="text-xs font-medium text-teal">{timeFmt.format(new Date(r.created_at))}</span>
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-light">
                    <span className="rounded-full bg-cream px-1.5 py-0.5 font-semibold uppercase tracking-wide">
                      {r.acted_by === "admin" ? "Admin" : r.acted_by === "moderator" ? "Moderator" : "System"}
                    </span>
                    <span className="text-slate-light/70">{relativeTime(r.created_at)}</span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {rows.length > 0 && (
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-light">
            Showing {filtered.length} of {rows.length} loaded entries.
          </p>
          {!clearing && (
            <button
              onClick={handleClear}
              className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition ${
                confirmClear
                  ? "border-danger bg-danger text-cream hover:bg-danger"
                  : "border-line bg-white text-danger hover:border-danger hover:bg-[#FCEEEC]"
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {confirmClear ? "Click to confirm clearing the log" : "Clear log"}
            </button>
          )}
          {clearing && (
            <span className="flex items-center gap-1.5 text-xs text-slate-light">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Clearing...
            </span>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-sage">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Keep the log for auditing — it reflects the most recent 300 activities.
        </p>
      )}
    </div>
  );
}

export default function TimestampPage() {
  if (!isSupabaseConfigured) return <SupabaseSetup />;
  return (
    <PageGuard page="logs">
      <TimestampApp />
    </PageGuard>
  );
}