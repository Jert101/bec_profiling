"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, ShieldCheck, SlidersHorizontal, Users } from "lucide-react";
import type { FormFieldConfig, PageKey, Role } from "@/lib/types";
import { getFormFields, updateFormFields } from "@/lib/residents";
import { DEFAULT_FORM_FIELDS, groupBySection, isLocked, parseOptions } from "@/lib/formConfig";
import { ALL_PAGES, getRolePages, setRolePages } from "@/lib/permissions";
import { useApp } from "@/components/AppProvider";
import RoleGuard from "@/components/RoleGuard";
import Section from "@/components/ui/Section";
import VicariateManager from "@/components/VicariateManager";

function CodesSection() {
  const { changeCode, showToast } = useApp();
  const [adminNew, setAdminNew] = useState("");
  const [modNew, setModNew] = useState("");
  const [adminAuth, setAdminAuth] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const reset = () => {
    setAdminNew("");
    setModNew("");
    setAdminAuth("");
  };

  const saveCode = async (target: "admin" | "moderator", newPin: string) => {
    const label = target === "admin" ? "Admin" : "Moderator";
    if (!newPin.trim()) {
      showToast(`Enter a new ${label} access code.`, true);
      return;
    }
    if (!adminAuth.trim()) {
      showToast("Enter your admin access code to authorize.", true);
      return;
    }
    setBusy(target);
    const { result, message } = await changeCode(target, newPin.trim(), adminAuth.trim());
    setBusy(null);
    if (result === "ok") {
      showToast(message);
      reset();
    } else {
      showToast(message, true);
    }
  };

  const fieldClass =
    "w-full rounded-md border border-line bg-white px-3 py-2 font-mono text-sm tracking-widest text-slate outline-none transition focus:border-sage focus:ring-3 focus:ring-sage-light";

  return (
    <Section title="User access codes">
      <p className="mb-4 text-sm text-slate-light">
        Set or reset the access codes for each user. Seed defaults: Admin{" "}
        <span className="font-mono">0000</span> · Moderator{" "}
        <span className="font-mono">1111</span>. Codes are stored hashed.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(
          [
            { key: "admin" as const, label: "Admin", newVal: adminNew, setNew: setAdminNew },
            { key: "moderator" as const, label: "Moderator", newVal: modNew, setNew: setModNew },
          ]
        ).map(({ key, label, newVal, setNew }) => (
          <div key={key} className="rounded-md border border-line bg-cream/50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-teal-dark">
              <ShieldCheck className="h-4 w-4 text-sage" />
              {label}
            </div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-light">
              New access code
            </label>
            <input
              type="password"
              inputMode="numeric"
              value={newVal}
              onChange={(e) => setNew(e.target.value)}
              placeholder="Enter new code"
              className={fieldClass}
            />
            <button
              onClick={() => saveCode(key, newVal)}
              disabled={busy !== null}
              className="mt-3 w-full cursor-pointer rounded-md bg-teal px-4 py-2 text-sm font-semibold text-cream transition hover:bg-teal-dark disabled:opacity-60"
            >
              {busy === key ? "Saving..." : `Update ${label} code`}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-light">
          Your admin access code (to authorize changes)
        </label>
        <input
          type="password"
          inputMode="numeric"
          value={adminAuth}
          onChange={(e) => setAdminAuth(e.target.value)}
          placeholder="Admin code"
          className={`${fieldClass} max-w-xs`}
        />
      </div>
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

function PageAccessSection() {
  const { showToast } = useApp();
  const [pages, setPages] = useState<PageKey[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const role: Role = "moderator";

  useEffect(() => {
    let alive = true;
    getRolePages(role)
      .then((p) => alive && setPages(p))
      .catch(() => {})
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [role]);

  const toggle = (page: PageKey) =>
    setPages((prev) => (prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page]));

  const label = (page: PageKey) =>
    page === "dashboard" ? "Dashboard" : page === "records" ? "Records" : "Stats";

  const save = async () => {
    setSaving(true);
    try {
      await setRolePages(role, pages);
      showToast("Moderator page access saved");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not save page access", true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title="User page access">
      <p className="mb-4 text-sm text-slate-light">
        Choose which pages each user can open. All users can fully use every function inside the
        pages they are granted. Admin always has access to everything.
      </p>

      {!loaded ? (
        <p className="text-sm text-slate-light">Loading page access...</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-line bg-cream/50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-teal-dark">
              <Users className="h-4 w-4 text-sage" />
              Moderator
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_PAGES.map((page) => {
                const enabled = pages.includes(page);
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => toggle(page)}
                    className={`cursor-pointer rounded-md border px-4 py-2 text-sm font-semibold transition ${
                      enabled
                        ? "border-teal bg-teal text-cream hover:bg-teal-dark"
                        : "border-line bg-white text-slate-light hover:border-teal"
                    }`}
                  >
                    {label(page)}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <button
              onClick={save}
              disabled={saving}
              className="flex cursor-pointer items-center gap-2 rounded-md bg-teal px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-teal-dark disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save page access"}
            </button>
          </div>
        </div>
      )}
    </Section>
  );
}

function DashboardApp() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-7 sm:px-6 lg:px-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sage-light text-teal-dark">
          <SlidersHorizontal className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-serif text-[26px] text-teal-dark">Dashboard</h1>
          <p className="text-sm text-slate-light">
            Manage access codes, page access, vicariates, and form fields
          </p>
        </div>
      </div>

      <CodesSection />
      <PageAccessSection />
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