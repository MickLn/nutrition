"use client";

import { useEffect, useRef } from "react";

/**
 * Panneau qui monte depuis le bas (bottom sheet). Basé sur <dialog> : la page derrière devient inactive,
 * Échap et le tap sur le voile le ferment.
 */
export function Sheet({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="sheet fixed inset-x-0 bottom-0 top-auto m-0 mx-auto max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-base bg-fond px-[22px] pb-[calc(24px+env(safe-area-inset-bottom))] pt-2.5 text-texte"
    >
      <div className="mx-auto mb-3.5 h-1 w-9 rounded-base bg-trait" aria-hidden />
      {open && children}
    </dialog>
  );
}
