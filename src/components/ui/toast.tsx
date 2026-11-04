"use client";

import { useSyncExternalStore } from "react";
import { UI } from "@/config/ui";

/** Message bref en bas d'écran, avec une action facultative (« Annuler »). Une seule à la fois. */
type Toast = { id: number; text: string; action?: { label: string; run: () => void } };

let current: Toast | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function showToast(text: string, action?: Toast["action"]) {
  current = { id: Date.now(), text, action };
  clearTimeout(timer);
  timer = setTimeout(hideToast, UI.toastMs);
  emit();
}

export function hideToast() {
  current = null;
  emit();
}

export function Toaster() {
  const toast = useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => current,
    () => null,
  );
  if (!toast) return null;
  return (
    <div role="status" className="fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md justify-center px-4">
      <div key={toast.id} className="toast flex min-h-11 w-full items-center justify-between gap-3 rounded-base bg-texte px-4 text-petit text-fond">
        <span className="min-w-0 flex-1">{toast.text}</span>
        {toast.action && (
          <button
            className="-mr-2 min-h-11 px-2 font-medium"
            onClick={() => {
              toast.action!.run();
              hideToast();
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
    </div>
  );
}
