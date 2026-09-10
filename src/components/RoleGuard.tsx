"use client";

import { useApp } from "@/components/AppProvider";

export default function RoleGuard({
  role,
  children,
}: {
  role: "admin";
  children: React.ReactNode;
}) {
  const { session } = useApp();

  if (session?.role !== role) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-10 sm:px-6 lg:px-10">
        <div className="rounded-md border border-line bg-white px-8 py-16 text-center text-slate-light">
          <div className="mb-3 text-4xl">🔒</div>
          <h1 className="mb-2 font-serif text-xl text-slate-light">Not authorized</h1>
          <p className="text-sm">This area is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}