import { Activity, Apple, LayoutDashboard, Loader2, LogOut, Bell, BellOff } from "lucide-react";
import DailyLogForm from "@/components/DailyLogForm";
import SyncHeader from "@/components/SyncHeader";
import PendingLogs from "@/components/PendingLogs";
import Auth from "@/components/Auth";
import DietView from "@/components/diet/DietView";
import DashboardView from "@/components/dashboard/DashboardView";
import Onboarding from "@/components/Onboarding";
import { useAuth } from "@/contexts/AuthContext";
import { type SyncAction } from "@/lib/db";
import { useState, useEffect } from "react";
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from "@/lib/supabase";

type Tab = 'tracker' | 'diet' | 'stats';

function App() {
  const [currentTab, setCurrentTab] = useState<Tab>('tracker');
  const [editingLog, setEditingLog] = useState<SyncAction | null>(null);
  const { session, loading, signOut, user } = useAuth(); // Added 'user' to destructuring
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // New state for settings menu

  // Notification setup
  const { permission, requestPermission, scheduleDailyReminder } = useNotifications();
  const [remindersEnabled, setRemindersEnabled] = useState(false);

  // Onboarding state
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkProfile() {
      if (!session?.user) {
        setNeedsOnboarding(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('height, initial_weight')
          .eq('id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
          console.error('Error fetching profile:', error);
          setNeedsOnboarding(false); // Fallback to main app on error rather than blocking
        } else if (!data || !data.height || !data.initial_weight) {
          // If no data, or missing key fields, they need onboarding
          setNeedsOnboarding(true);
        } else {
          setNeedsOnboarding(false);
        }
      } catch (err) {
        console.error('Unexpected error checking profile:', err);
        setNeedsOnboarding(false);
      }
    }

    if (!loading) {
      checkProfile();
    }
  }, [session, loading]);

  if (loading || (session && needsOnboarding === null)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  if (needsOnboarding) {
    return <Onboarding onComplete={() => setNeedsOnboarding(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header & Settings Menu */}
      <div className="bg-card border-b border-border flex justify-between items-center px-4 py-2">
        <span className="font-bold text-foreground">BW Tracker</span>

        <div className="relative">
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center hover:bg-primary/30 transition-colors text-sm" // Adjusted size for better fit
          >
            {user?.email?.charAt(0).toUpperCase()}
          </button>

          {isSettingsOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-popover text-popover-foreground rounded-xl shadow-xl border border-border py-2 z-50">
              <div className="px-4 py-2 border-b border-border/50 flex flex-col">
                <span className="text-sm font-medium text-foreground truncate">{user?.email}</span>
                <span className="text-xs text-muted-foreground">Settings</span>
              </div>

              <div className="px-4 py-3 border-b border-border/50">
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
        {currentTab === 'tracker' && (
          <>
            <DailyLogForm editItem={editingLog} onClearEdit={() => setEditingLog(null)} />
            <PendingLogs onEdit={setEditingLog} />
          </>
        )}

        {currentTab === 'diet' && (
          <DietView />
        )}

        {currentTab === 'stats' && (
          <DashboardView />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-card border-t border-border flex justify-around p-3 pb-safe z-10">
        <button
          onClick={() => setCurrentTab('tracker')}
          className={`flex flex-col items-center ${currentTab === 'tracker' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} `}
        >
          <Activity size={24} />
          <span className="text-xs mt-1 font-medium">Tracker</span>
        </button>
        <button
          onClick={() => setCurrentTab('diet')}
          className={`flex flex-col items-center ${currentTab === 'diet' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} `}
        >
          <Apple size={24} />
          <span className="text-xs mt-1 font-medium">Diet</span>
        </button>
        <button
          onClick={() => setCurrentTab('stats')}
          className={`flex flex-col items-center ${currentTab === 'stats' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} `}
        >
          <LayoutDashboard size={24} />
          <span className="text-xs mt-1 font-medium">Stats</span>
        </button>
      </nav>
    </div>
  );
}

export default App;