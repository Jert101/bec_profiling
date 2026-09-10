export default function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 rounded-md border border-line bg-white p-6">
      <h3 className="mb-4 flex items-center gap-2 font-serif text-base font-bold text-teal-dark">
        <span className="inline-block h-2 w-2 rounded-sm bg-sage" />
        {title}
      </h3>
      {children}
    </div>
  );
}