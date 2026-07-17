"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, description, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="animate-modal-backdrop absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      {/* Card window */}
      <div className="animate-modal-card relative w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 bg-gray-50/60 px-6 py-4">
          <div>
            <h3 id="modal-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
            {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
