import { Activity, Apple, LayoutDashboard, Loader2, LogOut } from "lucide-react";
import DailyLogForm from "./components/DailyLogForm";
import SyncHeader from "./components/SyncHeader";
import PendingLogs from "./components/PendingLogs";
import Auth from "./components/Auth";
import DietView from "./components/diet/DietView";
import DashboardView from "./components/dashboard/DashboardView";
import { useAuth } from "./contexts/AuthContext";
import { type SyncAction } from "./lib/db";
import { useState } from "react";
import { Button } from "./components/ui/Button";

type Tab = 'tracker' | 'diet' | 'stats';

function App() {
  const [currentTab, setCurrentTab] = useState<Tab>('tracker');
  const [editingLog, setEditingLog] = useState<SyncAction | null>(null);
  const { session, loading, signOut } = useAuth();

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
      {/* Top Header */}
      <div className="bg-white border-b border-gray-100 flex justify-between items-center px-4 py-2">
        <span className="font-bold text-gray-800">BW Tracker</span>
        <Button
          onClick={signOut}
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-red-600 px-2"
        >
          <LogOut size={18} />
        </Button>
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
          className={`flex flex-col items-center ${currentTab === 'tracker' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-900'}`}
        >
          <Activity size={24} />
          <span className="text-xs mt-1 font-medium">Tracker</span>
        </button>
        <button
          onClick={() => setCurrentTab('diet')}
          className={`flex flex-col items-center ${currentTab === 'diet' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-900'}`}
        >
          <Apple size={24} />
          <span className="text-xs mt-1 font-medium">Diet</span>
        </button>
        <button
          onClick={() => setCurrentTab('stats')}
          className={`flex flex-col items-center ${currentTab === 'stats' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-900'}`}
        >
          <LayoutDashboard size={24} />
          <span className="text-xs mt-1 font-medium">Stats</span>
        </button>
      </nav>
    </div>
  );
}

export default App;