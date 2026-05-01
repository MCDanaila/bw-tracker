import { Activity, Apple, LayoutDashboard, Loader2, Bell, BellOff, CalendarRange, UserCircle, Dumbbell } from "lucide-react";
import { useRole } from "@/core/contexts/RoleContext";
import DailyLogHub from "./components/daily-flow/DailyLogHub";
import PendingLogs from "./components/PendingLogs";
import DietView from "./components/diet/DietView";
import DashboardView from "./components/stats/DashboardView";
import HistoryView from "./components/history/HistoryView";
import ProfileView from "./components/ProfileView";
import { AppHeader } from "@/core/components/AppHeader";
import { useAuth } from "@/core/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useNotifications } from '@/core/hooks/useNotifications';
import { supabase } from "@/core/lib/supabase";
import { localDB } from "@/core/lib/db";
import { getLocalDateStr } from "@/core/lib/utils";

type Tab = 'tracker' | 'diet' | 'stats' | 'history';

function App() {
  const [currentTab, setCurrentTab] = useState<Tab>('tracker');
  const { session, loading } = useAuth();
  const { capabilities } = useRole();
  const [showProfile, setShowProfile] = useState(false);

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

  const extraMenuItems = (
    <>
      <div className="px-4 py-3">
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
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${remindersEnabled ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${remindersEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
          </button>
        </div>
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
        onClick={() => setShowProfile(true)}
        className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted/50 flex items-center gap-2"
      >
        <UserCircle size={18} />
        Edit Profile
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Leonida" showSync extraMenuItems={extraMenuItems} />

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
        {capabilities.canViewDashboard && (
          <a
            href="/dashboard"
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] flex-1 pt-2 pb-1 text-muted-foreground hover:text-foreground transition-colors duration-150"
            title="Go to Dashboard"
          >
            <LayoutDashboard size={22} />
            <span className="text-xs mt-0.5 font-medium">Dashboard</span>
          </a>
        )}
      </nav>
    </div>
  );
}

export default App;