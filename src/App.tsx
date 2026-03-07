import { Activity, Apple, LayoutDashboard, Loader2, LogOut, Bell, BellOff } from "lucide-react";
import DailyLogForm from "@/components/DailyLogForm";
import SyncHeader from "@/components/SyncHeader";
import PendingLogs from "@/components/PendingLogs";
import Auth from "@/components/Auth";
import DietView from "@/components/diet/DietView";
import DashboardView from "@/components/dashboard/DashboardView";
import { useAuth } from "@/contexts/AuthContext";
import { type SyncAction } from "@/lib/db";
import { useState } from "react";
import { useNotifications } from '@/hooks/useNotifications';

type Tab = 'tracker' | 'diet' | 'stats';

function App() {
  const [currentTab, setCurrentTab] = useState<Tab>('tracker');
  const [editingLog, setEditingLog] = useState<SyncAction | null>(null);
  const { session, loading, signOut, user } = useAuth(); // Added 'user' to destructuring
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // New state for settings menu

  // Notification setup
  const { permission, requestPermission, scheduleDailyReminder } = useNotifications();
  const [remindersEnabled, setRemindersEnabled] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header & Settings Menu */}
      <div className="bg-white border-b border-gray-100 flex justify-between items-center px-4 py-2">
        <span className="font-bold text-gray-800">BW Tracker</span>

        <div className="relative">
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center hover:bg-blue-200 transition-colors text-sm" // Adjusted size for better fit
          >
            {user?.email?.charAt(0).toUpperCase()}
          </button>

          {isSettingsOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-200 flex flex-col">
                <span className="text-sm font-medium text-gray-900 truncate">{user?.email}</span>
                <span className="text-xs text-gray-500">Settings</span>
              </div>

              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    {remindersEnabled ? <Bell size={16} className="text-blue-500" /> : <BellOff size={16} className="text-gray-400" />}
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
                    className={`relative inline - flex h - 5 w - 9 items - center rounded - full transition - colors ${remindersEnabled ? 'bg-blue-500' : 'bg-gray-200'} `}
                  >
                    <span className={`inline - block h - 4 w - 4 transform rounded - full bg - white transition - transform ${remindersEnabled ? 'translate-x-4' : 'translate-x-1'} `} />
                  </button>
                </div>
                {/* Test notification button */}
                {remindersEnabled && (
                  <button
                    onClick={() => scheduleDailyReminder(true)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Send Test Notification
                  </button>
                )}
              </div>

              <button
                onClick={signOut}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
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
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-3 pb-safe z-10">
        <button
          onClick={() => setCurrentTab('tracker')}
          className={`flex flex - col items - center ${currentTab === 'tracker' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-900'} `}
        >
          <Activity size={24} />
          <span className="text-xs mt-1 font-medium">Tracker</span>
        </button>
        <button
          onClick={() => setCurrentTab('diet')}
          className={`flex flex - col items - center ${currentTab === 'diet' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-900'} `}
        >
          <Apple size={24} />
          <span className="text-xs mt-1 font-medium">Diet</span>
        </button>
        <button
          onClick={() => setCurrentTab('stats')}
          className={`flex flex - col items - center ${currentTab === 'stats' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-900'} `}
        >
          <LayoutDashboard size={24} />
          <span className="text-xs mt-1 font-medium">Stats</span>
        </button>
      </nav>
    </div>
  );
}

export default App;