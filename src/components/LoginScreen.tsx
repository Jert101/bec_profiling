"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, KeyRound, LayoutGrid, LogIn, MapPin, ShieldCheck } from "lucide-react";
import { useApp } from "@/components/AppProvider";

const FEATURES = [
  { icon: MapPin, text: "Vicariate and parish records at a glance" },
  { icon: LayoutGrid, text: "Statistics dashboard for every level" },
  { icon: ShieldCheck, text: "Role-based access for your team" },
];

export default function LoginScreen() {
  const { login } = useApp();
  const [pin, setPin] = useState("");
  const [show, setShow] = useState(false);
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
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-md border border-line bg-white shadow-[0_12px_48px_rgba(18,53,51,0.14)] lg:grid-cols-2">
        {/* Brand panel */}
        <div className="relative bg-teal px-7 py-10 text-cream sm:px-10 lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
            <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-gold" />
            <div className="absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-gold" />
          </div>

          <div className="relative">
            <div className="mb-8 flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Resident Profiling Database logo"
                width={52}
                height={52}
                className="h-[52px] w-[52px] rounded-full border-2 border-cream/40 object-cover"
                priority
              />
              <div>
                <h1 className="font-serif text-xl leading-tight text-cream">
                  BEC Baseline
                  <br />
                  Resident Profiling
                </h1>
              </div>
            </div>

            <p className="font-serif text-[28px] leading-snug text-cream">
              Every member of the community, accounted for.
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-cream/75">
              One secure place to record, browse, and understand the members of every
              Basic Ecclesial Community across the vicariates.
            </p>

            <ul className="mt-8 space-y-3">
              {FEATURES.map((f) => (
                <li key={f.text} className="flex items-center gap-3 text-sm text-cream/90">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cream/10 text-gold-light">
                    <f.icon className="h-4 w-4" />
                  </span>
                  {f.text}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative mt-10 hidden text-xs text-cream/50 lg:block">
            Made for the Basic Ecclesial Communities · Diocese of Iligan
          </p>
        </div>

        {/* Sign-in panel */}
        <form onSubmit={handleSubmit} className="bg-white p-7 sm:p-10" noValidate>
          <h2 className="font-serif text-2xl text-teal-dark">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-light">Sign in with your access code to continue.</p>

          <div className="mt-7">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-light">
              Access code
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-light" />
              <input
                type={show ? "text" : "password"}
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter your code"
                className="w-full rounded-md border border-line bg-white py-3 pl-9 pr-11 font-mono text-sm tracking-[0.3em] text-slate outline-none transition focus:border-sage focus:ring-3 focus:ring-sage-light"
              />
              <button
                type="button"
                aria-label={show ? "Hide access code" : "Show access code"}
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded p-1.5 text-slate-light transition hover:text-teal"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-3 rounded-md border border-danger/25 bg-[#FCEEEC] px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-teal px-5 py-3.5 text-sm font-semibold text-cream transition hover:bg-teal-dark disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="mt-6 rounded-md border border-dashed border-gold bg-gold-light/50 px-4 py-3 text-xs text-slate">
            <span className="font-semibold">New here?</span> Default codes — Admin:{" "}
            <span className="font-mono font-semibold">0000</span> · Moderator:{" "}
            <span className="font-mono font-semibold">1111</span>
            <br />
            <span className="text-slate-light">
              Change them from the Dashboard after signing in.
            </span>
          </div>

          <p className="mt-6 text-center text-xs text-slate-light">
            Installable on your phone — add this page to your home screen.
          </p>
        </form>
      </div>
    </div>
  );
}