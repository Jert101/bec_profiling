"use client";

import { useState } from "react";
import Image from "next/image";
import { KeyRound } from "lucide-react";
import { useApp } from "@/components/AppProvider";

export default function LoginScreen() {
  const { login } = useApp();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!pin.trim()) {
      setError("Please enter your access code.");
      return;
    }
    setLoading(true);
    try {
      const s = await login(pin.trim());
      if (!s) setError("Access code not recognized.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-md border border-line bg-white p-8 shadow-[0_4px_20px_rgba(27,77,74,0.08)]"
      >
        <div className="mb-6 flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Resident Profiling Database logo"
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover"
            priority
          />
          <div>
            <h1 className="font-serif text-xl text-teal-dark">
              Resident Profiling Database
            </h1>
            <p className="text-xs text-slate-light">Sign in with your access code</p>
          </div>
        </div>

        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-light">
          Access code
        </label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-light" />
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter your code"
            className="w-full rounded-md border border-line bg-white py-2.5 pl-9 pr-4 font-mono text-sm tracking-widest text-slate outline-none transition focus:border-sage focus:ring-3 focus:ring-sage-light"
          />
        </div>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full cursor-pointer rounded-md bg-teal px-5 py-3 text-sm font-semibold text-cream transition hover:bg-teal-dark disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="mt-5 text-center text-xs text-slate-light">
          Default codes — Admin: <span className="font-mono">0000</span> · Moderator:{" "}
          <span className="font-mono">1111</span>
          <br />
          <span className="opacity-80">Change them from the Dashboard after signing in.</span>
        </p>
      </form>
    </div>
  );
}