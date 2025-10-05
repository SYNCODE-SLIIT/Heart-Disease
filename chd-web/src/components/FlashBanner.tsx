import { useEffect, useState } from 'react';

type Flash = { message: string; type?: 'info' | 'success' | 'warning' | 'error' } | null;

export default function FlashBanner() {
  const [flash, setFlash] = useState<Flash>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('heartsense_flash');
      if (raw) {
        const parsed = JSON.parse(raw) as Flash;
        if (parsed && parsed.message) {
          setFlash(parsed);
          setOpen(true);
        }
        localStorage.removeItem('heartsense_flash');
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setOpen(false), 6000);
    return () => clearTimeout(t);
  }, [open]);

  if (!open || !flash) return null;

  const color =
    flash.type === 'success' ? 'bg-green-50 border-green-200 text-green-800'
    : flash.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800'
    : flash.type === 'error' ? 'bg-red-50 border-red-200 text-red-800'
    : 'bg-blue-50 border-blue-200 text-blue-800';

  return (
    <div className={`fixed top-0 inset-x-0 z-50 px-4 py-3 ${color} border-b`}
         role="status" aria-live="polite">
      <div className="max-w-5xl mx-auto flex items-start gap-3">
        <span className="mt-0.5">📧</span>
        <div className="text-sm">
          {flash.message}
        </div>
        <button
          onClick={() => setOpen(false)}
          className="ml-auto text-sm text-gray-500 hover:text-gray-700"
          aria-label="Dismiss"
        >
          Close
        </button>
      </div>
    </div>
  );
}
