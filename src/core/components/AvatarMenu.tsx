import { type ReactNode, useState, useRef, useEffect } from 'react';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/core/contexts/AuthContext';
import { useTheme } from '@/core/hooks/useTheme';

interface AvatarMenuProps {
  extraMenuItems?: ReactNode;
}

export function AvatarMenu({ extraMenuItems }: AvatarMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const { isDark, toggle } = useTheme();

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open settings"
        aria-expanded={isOpen}
        className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center hover:bg-primary/30 transition-colors text-sm"
      >
        {user?.email?.charAt(0).toUpperCase()}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 bg-popover text-popover-foreground rounded-xl shadow-xl border border-border py-2 z-50"
        >
          <div className="px-4 py-2 border-b border-border/50 flex flex-col">
            <span className="text-sm font-medium text-foreground truncate">{user?.email}</span>
            <span className="text-xs text-muted-foreground">Settings</span>
          </div>

          <div className="px-4 py-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-foreground">
                {isDark ? <Moon size={16} className="text-primary" /> : <Sun size={16} className="text-primary" />}
                <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
              </div>
              <button
                onClick={toggle}
                className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors bg-muted hover:bg-muted/80"
                aria-label="Toggle theme"
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-primary transition-transform ${isDark ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {extraMenuItems && (
            <div className="border-b border-border/50">
              {extraMenuItems}
            </div>
          )}

          <button
            onClick={signOut}
            className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
