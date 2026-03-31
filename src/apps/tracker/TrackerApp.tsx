import { Activity, Apple, LayoutDashboard, Loader2, LogOut, Bell, BellOff, CalendarRange, UserCircle, Dumbbell, Sun, Moon } from "lucide-react";
import DailyLogHub from "./components/daily-flow/DailyLogHub";
import SyncHeader from "./components/SyncHeader";
import PendingLogs from "./components/PendingLogs";
import DietView from "./components/diet/DietView";
import DashboardView from "./components/stats/DashboardView";
import HistoryView from "./components/history/HistoryView";
import ProfileView from "./components/ProfileView";
import { useAuth } from "@/core/contexts/AuthContext";
import { useState, useEffect, useRef } from "react";
import { useNotifications } from '@/core/hooks/useNotifications';
import { useTheme } from "@/core/hooks/useTheme";
import { supabase } from "@/core/lib/supabase";
import { localDB } from "@/core/lib/db";
import { getLocalDateStr } from "@/core/lib/utils";

type Tab = 'tracker' | 'diet' | 'stats' | 'history';

function App() {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [currentTab, setCurrentTab] = useState<Tab>('tracker');
  const { session, loading, signOut, user } = useAuth();
  const { isDark, toggle } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Close settings dropdown on outside click or Escape key
  useEffect(() => {
    if (!isSettingsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSettingsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isSettingsOpen]);

  // Notification setup
  const { permission, requestPermission, scheduleDailyReminder } = useNotifications();
  const [remindersEnabled, setRemindersEnabled] = useState(false);

  // Default to History tab if today's log already exists
  useEffect(() => {
    if (!session?.user?.id) return;

    const userId = session.user.id;

    async function checkTodayLog() {
      const todayDate = getLocalDateStr();

      const pending = await localDB.syncQueue
        .where('mutation_type').equals('UPSERT_DAILY_LOG')
        .toArray();
      if (pending.some(a => a.payload?.date === todayDate)) {
        setCurrentTab('history');
        return;
      }

      const { data } = await supabase
        .from('daily_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('date', todayDate)
        .maybeSingle();

      if (data) setCurrentTab('history');
    }

    checkTodayLog();
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header & Settings Menu */}
      <div className="bg-card border-b border-border flex justify-end items-center px-4 py-2">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            aria-label="Open settings"
            aria-expanded={isSettingsOpen}
            className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center hover:bg-primary/30 transition-colors text-sm"
          >
            {user?.email?.charAt(0).toUpperCase()}
          </button>

          {isSettingsOpen && (
            <div role="menu" className="absolute right-0 mt-2 w-64 bg-popover text-popover-foreground rounded-xl shadow-xl border border-border py-2 z-50">
              <div className="px-4 py-2 border-b border-border/50 flex flex-col">
                <span className="text-sm font-medium text-foreground truncate">{user?.email}</span>
                <span className="text-xs text-muted-foreground">Settings</span>
              </div>

              <div className="px-4 py-3 border-b border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    {isDark ? <Moon size={16} className="text-primary" /> : <Sun size={16} className="text-primary" />}
                    <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
                  </div>
                  <button
                    onClick={toggle}
                    className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors bg-muted hover:bg-muted/80"
                    aria-label="Toggle theme"
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-primary transition-transform ${isDark ? 'translate-x-4' : 'translate-x-1'} `} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    {remindersEnabled ? <Bell size={16} className="text-primary" /> : <BellOff size={16} className="text-muted-foreground" />}
                    <span>Daily Reminders</span>
                  </div>
                  <button
                    onClick={async () => {
                      let granted = permission === 'granted';
                      if (!granted && !remindersEnabled) {
                        granted = await requestPermission();
                      }
                      if (granted) {
                        const newVal = !remindersEnabled;
                        setRemindersEnabled(newVal);
                        await scheduleDailyReminder(newVal);
                      }
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${remindersEnabled ? 'bg-primary' : 'bg-muted'} `}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${remindersEnabled ? 'translate-x-4' : 'translate-x-1'} `} />
                  </button>
                </div>
                {/* Test notification button */}
                {remindersEnabled && (
                  <button
                    onClick={() => scheduleDailyReminder(true)}
                    className="mt-2 text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    Send Test Notification
                  </button>
                )}
              </div>

              <button
                onClick={() => { setIsSettingsOpen(false); setShowProfile(true); }}
                className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted/50 flex items-center gap-2"
              >
                <UserCircle size={18} />
                Edit Profile
              </button>

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
      </div>
      <SyncHeader />

      {/* Main Content Area */}
      <main className="p-4 pb-24">
        {showProfile ? (
          <ProfileView onBack={() => setShowProfile(false)} />
        ) : (
          <>
            {currentTab === 'tracker' && (
              <>
                <DailyLogHub />
                <PendingLogs />
              </>
            )}

            {currentTab === 'diet' && (
              <DietView />
            )}

            {currentTab === 'stats' && (
              <DashboardView />
            )}

            {currentTab === 'history' && (
              <HistoryView />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-card/95 backdrop-blur border-t border-border flex justify-around z-10" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        {([
          { tab: 'tracker' as Tab, icon: <Activity size={22} />, label: 'Log' },
          { tab: 'history' as Tab, icon: <CalendarRange size={22} />, label: 'History' },
          { tab: 'diet' as Tab, icon: <Apple size={22} />, label: 'Diet' },
          { tab: 'stats' as Tab, icon: <LayoutDashboard size={22} />, label: 'Stats' },
        ] as const).map(({ tab, icon, label }) => {
          const active = currentTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setCurrentTab(tab)}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] flex-1 pt-2 pb-1 relative transition-colors duration-150 cursor-pointer ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}
              {icon}
              <span className={`text-xs mt-0.5 font-medium ${active ? 'font-semibold' : ''}`}>{label}</span>
            </button>
          );
        })}
        <a
          href="/workout"
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] flex-1 pt-2 pb-1 text-muted-foreground hover:text-foreground transition-colors duration-150"
          title="Go to Workout Log"
        >
          <Dumbbell size={22} />
          <span className="text-xs mt-0.5 font-medium">Workout</span>
        </a>
      </nav>
    </div>
  );
}

export default App;