import { useEffect } from 'react';
import { X, Activity } from 'lucide-react';
import { SidebarNav } from './SidebarNav';
import { Button } from '@/core/components/ui/button';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-card shadow-xl transition-transform duration-300 md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <div className="flex items-center gap-2">
              <Activity size={24} className="text-primary" />
              <span className="text-lg font-bold">BW Tracker</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <SidebarNav collapsed={false} onNavigate={onClose} />
          </div>
        </div>
      </div>
    </>
  );
}
