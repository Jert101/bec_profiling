"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Resident, ResidentForm } from "@/lib/types";
import { getResident } from "@/lib/residents";
import { isSupabaseConfigured } from "@/lib/supabase";
import RecordForm from "@/components/RecordForm";
import PageGuard from "@/components/PageGuard";
import SupabaseSetup from "@/components/SupabaseSetup";

function toForm(r: Resident): ResidentForm {
  return {
    first_name: r.first_name,
    middle_name: r.middle_name ?? "",
    last_name: r.last_name,
    suffix: r.suffix ?? "",
    sex: r.sex ?? "",
    date_of_birth: r.date_of_birth ?? "",
    civil_status: r.civil_status ?? "",
    vicariate: r.vicariate ?? "",
    parish: r.parish ?? "",
    matrimony: r.matrimony ?? "",
    matrimony_date: r.matrimony_date ?? "",
    bec_cell_name: r.bec_cell_name ?? "",
    sacraments: r.sacraments ?? [],
    barangay: r.barangay ?? "",
    street_sitio: r.street_sitio ?? "",
    city_municipality: r.city_municipality ?? "",
    province: r.province ?? "",
    contact_number: r.contact_number ?? "",
    occupation: r.occupation ?? "",
    notes: r.notes ?? "",
    recorded_by: r.recorded_by ?? "",
  };
}

function ResidentDetail() {
  const params = useParams<{ id: string }>();
  const [resident, setResident] = useState<Resident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let alive = true;
    getResident(Number(params.id))
      .then((r) => {
        if (!alive) return;
        if (r) setResident(r);
        else setError(new Error("not_found"));
      })
      .catch((e: Error) => alive && setError(e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-7 sm:px-6 lg:px-10">
        <div className="px-5 py-20 text-center text-slate-light">Loading record...</div>
      </div>
    );
  }

  if (error || !resident) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-7 sm:px-6 lg:px-10">
        <div className="rounded-md border border-line bg-white px-8 py-16 text-center text-slate-light">
          <h1 className="mb-2 font-serif text-xl text-slate-light">Record not found</h1>
          <p className="text-sm">
            The record you are looking for does not exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-7 sm:px-6 lg:px-10">
      <RecordForm id={resident.id} initial={toForm(resident)} isNew={false} />
    </div>
  );
}

export default function ResidentDetailPage() {
  if (!isSupabaseConfigured) return <SupabaseSetup />;
  return (
    <PageGuard page="records">
      <ResidentDetail />
    </PageGuard>
  );
}