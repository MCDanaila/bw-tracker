import { Dumbbell, Clock, BookOpen, Loader2, Activity, LayoutDashboard, Library } from 'lucide-react';
import LogWorkoutView from './components/log/LogWorkoutView';
import WorkoutHistoryView from './components/history/WorkoutHistoryView';
import ProgramsView from './components/programs/ProgramsView';
import ExercisesView from './components/exercises/ExercisesView';
import { AppHeader } from '@/core/components/AppHeader';
import { useAuth } from '@/core/contexts/AuthContext';
import { useRole } from '@/core/contexts/RoleContext';
import { useState } from 'react';

type Tab = 'log' | 'history' | 'programs' | 'exercises';

function WorkoutApp() {
  const [currentTab, setCurrentTab] = useState<Tab>('log');
  const { session, loading } = useAuth();
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

  const tabs = [
    { tab: 'log' as Tab, icon: <Dumbbell size={22} />, label: 'Log' },
    { tab: 'history' as Tab, icon: <Clock size={22} />, label: 'History' },
    { tab: 'programs' as Tab, icon: <BookOpen size={22} />, label: 'Programs' },
    { tab: 'exercises' as Tab, icon: <Library size={22} />, label: 'Exercises' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Workout" />

      {/* Main Content Area */}
      <main className="p-4 pb-24">
        {currentTab === 'log'       && <LogWorkoutView />}
        {currentTab === 'history'   && <WorkoutHistoryView />}
        {currentTab === 'programs'  && <ProgramsView />}
        {currentTab === 'exercises' && <ExercisesView />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-card/95 backdrop-blur border-t border-border flex justify-around z-10" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        {tabs.map(({ tab, icon, label }) => {
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
          href="/tracker"
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] flex-1 pt-2 pb-1 text-muted-foreground hover:text-foreground transition-colors duration-150"
          title="Go to Tracker"
        >
          <Activity size={22} />
          <span className="text-xs mt-0.5 font-medium">Tracker</span>
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

export default WorkoutApp;
