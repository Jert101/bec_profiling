"use client";

import { useEffect, useState } from "react";
import { Building2, Plus, Save, Trash2, X } from "lucide-react";
import type { Vicariate } from "@/lib/types";
import {
  getVicariates,
  addVicariate,
  renameVicariate,
  deleteVicariate,
  addParish,
  renameParish,
  deleteParish,
} from "@/lib/residents";
import { useApp } from "@/components/AppProvider";
import Section from "@/components/ui/Section";

const inputClass =
  "w-full rounded-md border border-line bg-white px-2.5 py-1.5 font-sans text-[13px] text-slate outline-none transition focus:border-sage focus:ring-2 focus:ring-sage-light";

export default function VicariateManager() {
  const { showToast, confirmDelete } = useApp();
  const [vicariates, setVicariates] = useState<Vicariate[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newVicariate, setNewVicariate] = useState("");
  const [adding, setAdding] = useState(false);
  const [parishDrafts, setParishDrafts] = useState<Record<number, string>>({});

  const reload = async () => {
    setVicariates(await getVicariates());
  };

  useEffect(() => {
    let alive = true;
    getVicariates()
      .then((data) => {
        if (alive) setVicariates(data);
      })
      .catch(() => {})
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  const handleAddVicariate = async () => {
    if (!newVicariate.trim()) {
      showToast("Enter a vicariate name.", true);
      return;
    }
    setAdding(true);
    try {
      await addVicariate(newVicariate);
      setNewVicariate("");
      await reload();
      showToast("Vicariate added");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not add vicariate", true);
    } finally {
      setAdding(false);
    }
  };

  const handleRenameVicariate = async (v: Vicariate, name: string) => {
    if (!name.trim() || name.trim() === v.name) return;
    try {
      await renameVicariate(v.id, name);
      await reload();
      showToast("Vicariate renamed");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not rename vicariate", true);
    }
  };

  const handleDeleteVicariate = async (v: Vicariate) => {
    const ok = await confirmDelete(
      v.name,
      `This action permanently removes the vicariate "${v.name}" and all of its parishes. It cannot be undone.`,
    );
    if (!ok) return;
    try {
      await deleteVicariate(v.id);
      await reload();
      showToast("Vicariate removed");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not remove vicariate", true);
    }
  };

  const handleAddParish = async (vicariateId: number) => {
    const name = parishDrafts[vicariateId] ?? "";
    if (!name.trim()) {
      showToast("Enter a parish name.", true);
      return;
    }
    try {
      await addParish(vicariateId, name);
      setParishDrafts((prev) => ({ ...prev, [vicariateId]: "" }));
      await reload();
      showToast("Parish added");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not add parish", true);
    }
  };

  const handleRenameParish = async (vicariateId: number, parishId: number, name: string) => {
    const vic = vicariates.find((v) => v.id === vicariateId);
    const current = vic?.parishes.find((p) => p.id === parishId)?.name;
    if (!name.trim() || name.trim() === current) return;
    try {
      await renameParish(parishId, name.trim());
      await reload();
      showToast("Parish renamed");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not rename parish", true);
    }
  };

  const handleDeleteParish = async (p: { id: number; name: string }) => {
    const ok = await confirmDelete(
      p.name,
      `This action permanently removes the parish "${p.name}". It cannot be undone.`,
    );
    if (!ok) return;
    try {
      await deleteParish(p.id);
      await reload();
      showToast("Parish removed");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not remove parish", true);
    }
  };

  return (
    <Section title="Vicariates & Parishes">
      <p className="mb-4 text-sm text-slate-light">
        Manage the vicariates and their parishes. These power the <strong>Vicariate</strong> and{" "}
        <strong>Parish</strong> dropdowns on the resident form.
      </p>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={newVicariate}
          onChange={(e) => setNewVicariate(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddVicariate()}
          placeholder="New vicariate name"
          className={`${inputClass} sm:max-w-sm`}
        />
        <button
          onClick={handleAddVicariate}
          disabled={adding}
          className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-teal px-4 py-2 text-sm font-semibold text-cream transition hover:bg-teal-dark disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {adding ? "Adding..." : "Add vicariate"}
        </button>
      </div>

      {!loaded ? (
        <p className="text-sm text-slate-light">Loading...</p>
      ) : vicariates.length === 0 ? (
        <p className="rounded-md border border-dashed border-line bg-cream/50 px-4 py-6 text-center text-sm text-slate-light">
          No vicariates yet. Add the first one above, then add its parishes.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {vicariates.map((v) => (
            <div key={v.id} className="rounded-md border border-line bg-cream/40 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Building2 className="h-4 w-4 text-sage" />
                <input
                  type="text"
                  key={v.id}
                  defaultValue={v.name}
                  onBlur={(e) => handleRenameVicariate(v, e.target.value)}
                  className={`${inputClass} flex-1 font-semibold`}
                  title="Rename (blur to save)"
                />
                <button
                  onClick={() => handleDeleteVicariate(v)}
                  className="flex cursor-pointer items-center gap-1 rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-danger transition hover:border-danger hover:bg-[#FCEEEC]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {v.parishes.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-sage" />
                    <input
                      type="text"
                      defaultValue={p.name}
                      onBlur={(e) => handleRenameParish(v.id, p.id, e.target.value)}
                      className={`${inputClass} flex-1`}
                      title="Rename (blur to save)"
                    />
                    <button
                      onClick={() => handleDeleteParish(p)}
                      className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border border-line bg-white text-slate-light transition hover:border-danger hover:text-danger"
                      title="Remove parish"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={parishDrafts[v.id] ?? ""}
                    onChange={(e) =>
                      setParishDrafts((prev) => ({ ...prev, [v.id]: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleAddParish(v.id)}
                    placeholder="Add a parish under this vicariate"
                    className={`${inputClass} flex-1`}
                  />
                  <button
                    onClick={() => handleAddParish(v.id)}
                    className="flex cursor-pointer items-center gap-1 rounded-md border border-teal bg-white px-2.5 py-1.5 text-xs font-semibold text-teal transition hover:bg-sage-light"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}