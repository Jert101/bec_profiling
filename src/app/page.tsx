"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";

export default function HomePage() {
  const router = useRouter();
  const { session, pages, pagesReady } = useApp();

  useEffect(() => {
    if (!session || !pagesReady) return;
    const first =
      pages.includes("dashboard") && session?.role !== "admin"
        ? "/home"
        : pages.includes("dashboard")
          ? "/dashboard"
          : pages.includes("records")
            ? "/records"
            : pages.includes("stats")
              ? "/stats"
              : "/records";
    router.replace(first);
  }, [session, pages, pagesReady, router]);

  return null;
}