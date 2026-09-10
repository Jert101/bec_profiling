export default function EmptyState({ searching }: { searching: boolean }) {
  return (
    <div className="px-5 py-20 text-center text-slate-light">
      <div className="mb-3 text-4xl">{searching ? "🔍" : "📁"}</div>
      <h3 className="mb-2 text-lg text-slate-light">
        {searching ? "No matches found" : "No records yet"}
      </h3>
      <p className="text-sm">
        {searching
          ? "Try a different name, barangay, or contact number."
          : "Add the first resident profile to get started."}
      </p>
    </div>
  );
}