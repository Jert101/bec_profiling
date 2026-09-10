"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

interface ToastState {
  message: string;
  isError: boolean;
}

interface ConfirmState {
  message: string;
  resolve: (ok: boolean) => void;
}

interface AppContextValue {
  showToast: (message: string, isError?: boolean) => void;
  confirmDelete: (name?: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextValue>({
  showToast: () => {},
  confirmDelete: async () => false,
});

export function useApp() {
  return useContext(AppContext);
}

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, isError = false) => {
    setToast({ message, isError });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const confirmDelete = useCallback((name?: string) => {
    return new Promise<boolean>((resolve) => {
      setConfirm({
        message: name
          ? `This action permanently removes the record for ${name}. It cannot be undone.`
          : "This action permanently removes the record. It cannot be undone.",
        resolve,
      });
    });
  }, []);

  return (
    <AppContext.Provider value={{ showToast, confirmDelete }}>
      {children}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[999] rounded-md px-5 py-3 text-sm font-medium text-cream shadow-lg transition-all ${
            toast.isError ? "bg-danger" : "bg-teal-dark"
          }`}
          role="status"
        >
          {toast.message}
        </div>
      )}

      {confirm && (
        <div
          className="fixed inset-0 z-[998] flex items-center justify-center bg-teal/25"
          onClick={() => {
            confirm.resolve(false);
            setConfirm(null);
          }}
        >
          <div
            className="max-w-xs rounded-md bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 font-serif text-lg font-bold text-teal-dark">
              Delete this record?
            </h3>
            <p className="mb-5 text-sm text-slate-light">{confirm.message}</p>
            <div className="flex justify-end gap-2">
              <button
                className="cursor-pointer rounded-md border border-line px-3 py-1.5 text-sm font-semibold text-teal transition hover:border-teal"
                onClick={() => {
                  confirm.resolve(false);
                  setConfirm(null);
                }}
              >
                Cancel
              </button>
              <button
                className="cursor-pointer rounded-md border border-line bg-white px-3 py-1.5 text-sm font-semibold text-danger transition hover:border-danger hover:bg-[#FCEEEC]"
                onClick={() => {
                  confirm.resolve(true);
                  setConfirm(null);
                }}
              >
                Delete record
              </button>
            </div>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
}