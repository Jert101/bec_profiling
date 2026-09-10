import type { Resident, ResidentForm } from "@/lib/types";
import { getResident } from "@/lib/residents";
import RecordForm from "@/components/RecordForm";

function toForm(r: Resident): ResidentForm {
  return {
    first_name: r.first_name,
    middle_name: r.middle_name ?? "",
    last_name: r.last_name,
    suffix: r.suffix ?? "",
    sex: r.sex ?? "",
    date_of_birth: r.date_of_birth ?? "",
    civil_status: r.civil_status ?? "",
    religion: r.religion ?? "",
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

export default async function ResidentDetailPage(props: PageProps<"/records/[id]">) {
  const { id } = await props.params;
  const resident = await getResident(Number(id));

  if (!resident) {
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