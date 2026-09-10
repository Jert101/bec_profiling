"use client";

import { useApp } from "@/components/AppProvider";
import LedgerSidebar from "@/components/LedgerSidebar";
import LoginScreen from "@/components/LoginScreen";
import SupabaseSetup from "@/components/SupabaseSetup";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function RootGate({ children }: { children: React.ReactNode }) {
  const { session, ready } = useApp();

  if (!ready) return <div className="h-full bg-cream" />;
  if (!isSupabaseConfigured) return <SupabaseSetup />;
  if (!session) return <LoginScreen />;

  return (
    <div className="grid h-full grid-cols-[52px_1fr] sm:grid-cols-[64px_1fr]">
      <LedgerSidebar />
      <main className="h-full min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}