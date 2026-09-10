"use client";

import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import type { PageKey } from "@/lib/types";

export default function PageGuard({
  page,
  children,
}: {
  page: PageKey;
  children: React.ReactNode;
}) {
  const { session, pages, pagesReady } = useApp();

  if (!session) return null;
  if (!pagesReady) return <div className="h-full bg-cream" />;
  if (!pages.includes(page)) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-10 sm:px-6 lg:px-10">
        <div className="rounded-md border border-line bg-white px-8 py-16 text-center text-slate-light">
          <div className="mb-3 text-4xl">🔒</div>
          <h1 className="mb-2 font-serif text-xl text-slate-light">Page not authorized</h1>
          <p className="mb-4 text-sm">
            The administrator has not granted your account access to this page.
          </p>
          <Link
            href={session.role === "admin" ? "/dashboard" : "/home"}
            className="inline-block cursor-pointer rounded-md bg-teal px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-teal-dark"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}