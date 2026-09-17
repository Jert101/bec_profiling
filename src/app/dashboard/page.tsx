"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Eye, EyeOff, KeyRound, Save, ShieldCheck, ShieldOff, SlidersHorizontal, X } from "lucide-react";
import type { FormFieldConfig } from "@/lib/types";
import { getFormFields, updateFormFields } from "@/lib/residents";
import { DEFAULT_FORM_FIELDS, groupBySection, isLocked, parseOptions } from "@/lib/formConfig";
import { useApp } from "@/components/AppProvider";
import RoleGuard from "@/components/RoleGuard";
import Section from "@/components/ui/Section";
import VicariateManager from "@/components/VicariateManager";
import {
  listParishCodes,
  setParishCode,
  clearParishCode,
  type ParishCodeInfo,
} from "@/lib/parishCodes";

function CodesSection() {
  const { showToast, changeCode } = useApp();
  const [adminNew, setAdminNew] = useState("");
  const [parishes, setParishes] = useState<ParishCodeInfo[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [adminAuth, setAdminAuth] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState<number | null>(null);

  const copyCode = async (p: ParishCodeInfo) => {
    const code = p.code_plain ?? "";
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(p.parish_id);
      setTimeout(() => setCopied((prev) => (prev === p.parish_id ? null : prev)), 1500);
    } catch {
      showToast("Could not copy the access code.", true);
    }
  };

  const refresh = async () => {
    try {
      setParishes(await listParishCodes());
    } catch {
      showToast("Could not load parish access codes.", true);
    }
  };

  const changeAdmin = async () => {
    const code = adminNew.trim();
    if (code.length < 6) {
      showToast("Use at least 6 characters for the access code.", true);
      return;
    }
    if (!adminAuth.trim()) {
      showToast("Enter your admin access code to authorize.", true);
      return;
    }
    setBusy(-1);
    const { result, message } = await changeCode("admin", code, adminAuth.trim());
    setBusy(null);
    if (result === "ok") {
      showToast(message);
      setAdminNew("");
      setAdminAuth("");
    } else {
      showToast(message, true);
    }
  };

  useEffect(() => {
    let alive = true;
    listParishCodes()
      .then((p) => alive && setParishes(p))
      .catch(() => {})
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  const saveCode = async (p: ParishCodeInfo) => {
    const code = (drafts[p.parish_id] ?? "").trim();
    if (code.length < 6) {
      showToast("Use at least 6 characters for the access code.", true);
      return;
    }
    if (!adminAuth.trim()) {
      showToast("Enter your admin access code to authorize.", true);
      return;
    }
    setBusy(p.parish_id);
    const { result, message } = await setParishCode(p.parish_id, code, adminAuth.trim(), p.parish_name);
    setBusy(null);
    if (result === "ok") {
      showToast(message);
      setDrafts((prev) => ({ ...prev, [p.parish_id]: "" }));
      setAdminAuth("");
      await refresh();
    } else {
      showToast(message, true);
    }
  };

  const removeCode = async (p: ParishCodeInfo) => {
    if (!adminAuth.trim()) {
      showToast("Enter your admin access code to authorize.", true);
      return;
    }
    setBusy(p.parish_id);
    const { result, message } = await clearParishCode(p.parish_id, adminAuth.trim(), p.parish_name);
    setBusy(null);
    if (result === "ok") {
      showToast(message);
      setAdminAuth("");
      await refresh();
    } else {
      showToast(message, true);
    }
  };

  const fieldClass =
    "w-full rounded-md border border-line bg-white px-3 py-2 font-mono text-sm tracking-widest text-slate outline-none transition focus:border-sage focus:ring-3 focus:ring-sage-light";

  return (
    <Section title="Parish access codes">
      <p className="mb-4 text-sm text-slate-light">
        Give each parish its own access code. Holders can only view and manage records belonging
        to their parish. Codes must be at least 6 characters, are stored hashed (bcrypt), and are
        shown here so you can share them with each parish.
      </p>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-md border border-line bg-cream/40 p-4">
          <div className="mb-2 text-sm font-bold text-teal-dark">Your admin access code</div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="password"
              inputMode="numeric"
              value={adminNew}
              onChange={(e) => setAdminNew(e.target.value)}
              placeholder="New admin code..."
              className={`${fieldClass} max-w-[220px]`}
            />
            <button
              onClick={changeAdmin}
              disabled={busy !== null}
              className="cursor-pointer rounded-md border border-teal bg-white px-4 py-2 text-sm font-semibold text-teal transition hover:bg-teal hover:text-cream disabled:opacity-60"
            >
              {busy === -1 ? "Saving..." : "Update admin code"}
            </button>
          </div>
        </div>

        <div className="rounded-md border border-line bg-cream/40 p-4">
          <div className="mb-2 text-sm font-bold text-teal-dark">Authorize changes</div>
          <input
            type="password"
            inputMode="numeric"
            value={adminAuth}
            onChange={(e) => setAdminAuth(e.target.value)}
            placeholder="Admin code"
            className={fieldClass}
          />
        </div>
      </div>

      {!loaded ? (
        <p className="text-sm text-slate-light">Loading parishes...</p>
      ) : parishes.length === 0 ? (
        <p className="rounded-md border border-dashed border-line bg-cream/50 px-4 py-6 text-sm text-slate-light">
          No parishes have been set up yet. Add vicariates and parishes first.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {parishes.map((p) => (
            <div
              key={p.parish_id}
              className="rounded-md border border-line bg-cream/50 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-2 text-sm font-bold text-teal-dark">
                  <ShieldCheck className="h-4 w-4 text-sage" />
                  {p.parish_name}
                </span>
                <span className="text-xs text-slate-light">{p.vicariate_name}</span>
                <span
                  className={`ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    p.code_set
                      ? "bg-sage-light text-teal-dark"
                      : "bg-cream text-slate-light"
                  }`}
                >
                  {p.code_set ? (
                    <>
                      <ShieldCheck className="h-3 w-3" /> Code set
                    </>
                  ) : (
                    <>
                      <ShieldOff className="h-3 w-3" /> No code
                    </>
                  )}
                </span>
              </div>

              {p.code_set && (
                <div className="mb-3 flex items-center gap-2 rounded-md border border-sage/30 bg-white px-3 py-2">
                  <KeyRound className="h-4 w-4 shrink-0 text-sage" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-light">
                    Access code
                  </span>
                  <span className="min-w-0 flex-1 truncate font-mono text-sm tracking-[0.25em] text-teal-dark">
                    {p.code_plain
                      ? revealed[p.parish_id]
                        ? p.code_plain
                        : "••••••"
                      : "Rotate the code to reveal it"}
                  </span>
                  {p.code_plain && (
                    <button
                      type="button"
                      aria-label={revealed[p.parish_id] ? "Hide access code" : "Show access code"}
                      onClick={() =>
                        setRevealed((prev) => ({ ...prev, [p.parish_id]: !prev[p.parish_id] }))
                      }
                      className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded border border-line text-slate-light transition hover:border-teal hover:text-teal"
                    >
                      {revealed[p.parish_id] ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                  {p.code_plain && (
                    <button
                      type="button"
                      aria-label="Copy access code"
                      onClick={() => copyCode(p)}
                      className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded border border-line text-slate-light transition hover:border-teal hover:text-teal"
                    >
                      {copied === p.parish_id ? (
                        <Check className="h-3.5 w-3.5 text-sage" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="password"
                  inputMode="numeric"
                  value={drafts[p.parish_id] ?? ""}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [p.parish_id]: e.target.value }))
                  }
                  placeholder={p.code_set ? "New access code..." : "Set access code..."}
                  className={`${fieldClass} max-w-[220px]`}
                />
                <button
                  onClick={() => saveCode(p)}
                  disabled={busy !== null}
                  className="cursor-pointer rounded-md bg-teal px-4 py-2 text-sm font-semibold text-cream transition hover:bg-teal-dark disabled:opacity-60"
                >
                  {busy === p.parish_id ? "Saving..." : p.code_set ? "Rotate code" : "Set code"}
                </button>
                {p.code_set && (
                  <button
                    onClick={() => removeCode(p)}
                    disabled={busy !== null}
                    className="flex cursor-pointer items-center gap-1 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-light transition hover:border-danger hover:text-danger disabled:opacity-60"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function FieldsSection() {
  const { showToast } = useApp();
  const [draft, setDraft] = useState<FormFieldConfig[]>(() =>
    DEFAULT_FORM_FIELDS.map((f) => ({ ...f, options: [...f.options] })),
  );
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    getFormFields()
      .then((data) => {
        if (!alive || !data || data.length === 0) return;
        setDraft(data.map((f) => ({ ...f, options: [...f.options] })));
      })
      .catch(() => {})
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  const groups = useMemo(() => groupBySection(draft), [draft]);

  const patch = (name: string, patch: Partial<FormFieldConfig>) =>
    setDraft((prev) => prev.map((f) => (f.name === name ? { ...f, ...patch } : f)));

  const move = (name: string, dir: -1 | 1) => {
    setDraft((prev) => {
      const next = [...prev].sort((a, b) => a.sort_order - b.sort_order);
      const i = next.findIndex((f) => f.name === name);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= next.length || next[i].section !== next[j].section) return prev;
      const a = { ...next[i], sort_order: next[j].sort_order };
      const b = { ...next[j], sort_order: next[i].sort_order };
      next[i] = b;
      next[j] = a;
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateFormFields(
        draft.map((f) => ({ ...f, options: f.options.filter((o) => o.trim() !== "") })),
      );
      showToast("Form fields saved");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not save form fields", true);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-md border border-line bg-white px-2.5 py-1.5 font-sans text-[13px] text-slate outline-none transition focus:border-sage focus:ring-2 focus:ring-sage-light disabled:opacity-60";

  return (
    <Section title="Form fields (dynamic form)">
      <p className="mb-4 text-sm text-slate-light">
        Show or hide fields, rename labels, edit dropdown options, and set the required
        state. First and last name are always required.
      </p>

      {!loaded ? (
        <p className="text-sm text-slate-light">Loading form configuration...</p>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map(({ section, fields }) => (
            <div key={section}>
              <h4 className="mb-2 font-serif text-sm font-bold text-teal-dark">{section}</h4>
              <div className="flex flex-col gap-2">
                {fields.map((f) => {
                  const locked = isLocked(f.name);
                  return (
                    <div
                      key={f.name}
                      className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-cream/40 p-2.5"
                    >
                      <button
                        type="button"
                        onClick={() => move(f.name, -1)}
                        disabled={locked}
                        className="h-6 w-6 cursor-pointer rounded border border-line bg-white text-xs text-slate-light transition hover:border-teal hover:text-teal disabled:cursor-not-allowed disabled:opacity-40"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => move(f.name, 1)}
                        disabled={locked}
                        className="h-6 w-6 cursor-pointer rounded border border-line bg-white text-xs text-slate-light transition hover:border-teal hover:text-teal disabled:cursor-not-allowed disabled:opacity-40"
                        title="Move down"
                      >
                        ↓
                      </button>

                      <label className="flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-slate">
                        <input
                          type="checkbox"
                          checked={f.enabled}
                          disabled={locked}
                          onChange={(e) => patch(f.name, { enabled: e.target.checked })}
                        />
                        Shown
                      </label>

                      <input
                        type="text"
                        value={f.label}
                        disabled={locked}
                        onChange={(e) => patch(f.name, { label: e.target.value })}
                        className={`${inputClass} w-44`}
                      />

                      <label className="flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-slate">
                        <input
                          type="checkbox"
                          checked={f.required}
                          disabled={locked}
                          onChange={(e) => patch(f.name, { required: e.target.checked })}
                        />
                        Required
                      </label>

                      {(f.type === "select" || f.type === "multiselect") && (f.name === "vicariate" || f.name === "parish") && (
                        <span className="rounded bg-sage-light px-2 py-1 text-[11px] font-semibold text-teal-dark">
                          Options managed in Vicariates &amp; Parishes
                        </span>
                      )}
                      {(f.type === "select" || f.type === "multiselect") &&
                        f.name !== "vicariate" &&
                        f.name !== "parish" && (
                          <div className="flex-1">
                            <textarea
                              value={f.options.join("\n")}
                              onChange={(e) =>
                                patch(f.name, { options: parseOptions(e.target.value) })
                              }
                              rows={Math.max(2, Math.min(6, f.options.length + 1))}
                              className={`${inputClass} w-full min-w-[220px]`}
                              placeholder={"One option per line —\nadd or remove lines to edit choices"}
                              title="Dropdown / chip choices — one per line"
                            />
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={save}
          disabled={saving || !loaded}
          className="flex cursor-pointer items-center gap-2 rounded-md bg-teal px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-teal-dark disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save form fields"}
        </button>
      </div>
    </Section>
  );
}

function DashboardApp() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-7 sm:px-6 lg:px-10">
      <div className="sticky top-0 z-30 mb-6 flex items-center gap-3 rounded-md border border-line bg-white/95 px-4 py-3 shadow-[0_4px_16px_rgba(18,53,51,0.10)] backdrop-blur sm:px-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sage-light text-teal-dark">
          <SlidersHorizontal className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-serif text-[24px] text-teal-dark">Dashboard</h1>
          <p className="text-sm text-slate-light">
            Manage parish access codes, vicariates, and form fields
          </p>
        </div>
      </div>

      <CodesSection />
      <VicariateManager />
      <FieldsSection />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RoleGuard role="admin">
      <DashboardApp />
    </RoleGuard>
  );
}