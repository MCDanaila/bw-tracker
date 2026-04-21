import { Dumbbell, Clock, BookOpen, BarChart3, LogOut, Loader2, Activity, LayoutDashboard } from 'lucide-react';
import LogWorkoutView from './components/log/LogWorkoutView';
import WorkoutHistoryView from './components/history/WorkoutHistoryView';
import ProgramsView from './components/programs/ProgramsView';
import WorkoutStatsView from './components/stats/WorkoutStatsView';
import { useAuth } from '@/core/contexts/AuthContext';
import { useRole } from '@/core/contexts/RoleContext';
import { useState } from 'react';

type Tab = 'log' | 'history' | 'programs' | 'stats';

function WorkoutApp() {
  const [currentTab, setCurrentTab] = useState<Tab>('log');
  const { session, loading, signOut } = useAuth();
  const { capabilities } = useRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">Not authenticated. Please log in via the main tracker app.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <div className="bg-card border-b border-border flex justify-between items-center px-4 py-3">
        <span className="font-bold text-foreground text-lg">Workout Log</span>
        <button
          onClick={signOut}
          className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Main Content Area */}
      <main className="p-4 pb-24">
        {currentTab === 'log' && <LogWorkoutView />}
        {currentTab === 'history' && <WorkoutHistoryView />}
        {currentTab === 'programs' && <ProgramsView />}
        {currentTab === 'stats' && <WorkoutStatsView />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-card border-t border-border flex justify-around p-3 pb-safe z-10">
        <button
          onClick={() => setCurrentTab('log')}
          className={`flex flex-col items-center gap-1 ${
            currentTab === 'log' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Log Workout"
        >
          <Dumbbell size={24} />
          <span className="text-xs font-medium">Log</span>
        </button>
        <button
          onClick={() => setCurrentTab('history')}
          className={`flex flex-col items-center gap-1 ${
            currentTab === 'history' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Workout History"
        >
          <Clock size={24} />
          <span className="text-xs font-medium">History</span>
        </button>
        <button
          onClick={() => setCurrentTab('programs')}
          className={`flex flex-col items-center gap-1 ${
            currentTab === 'programs' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Programs"
        >
          <BookOpen size={24} />
          <span className="text-xs font-medium">Programs</span>
        </button>
        <button
          onClick={() => setCurrentTab('stats')}
          className={`flex flex-col items-center gap-1 ${
            currentTab === 'stats' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Stats"
        >
          <BarChart3 size={24} />
          <span className="text-xs font-medium">Stats</span>
        </button>
        {capabilities.canLog && (
          <a
            href="/tracker"
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors duration-150"
            title="Go to Tracker"
          >
            <Activity size={24} />
            <span className="text-xs font-medium">Tracker</span>
          </a>
        )}
        {capabilities.canViewDashboard && (
          <a
            href="/dashboard"
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors duration-150"
            title="Go to Dashboard"
          >
            <LayoutDashboard size={24} />
            <span className="text-xs font-medium">Dashboard</span>
          </a>
        )}
      </nav>
    </div>
  );
}

export default WorkoutApp;
