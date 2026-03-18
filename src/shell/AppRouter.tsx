import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import TrackerApp from '@/apps/tracker/TrackerApp';

const DashboardApp = lazy(() => import('@/apps/dashboard/DashboardApp'));
const WorkoutApp = lazy(() => import('@/apps/workout/WorkoutApp'));

/**
 * Top-level app router.
 * Routes between the different apps (tracker, dashboard, workout).
 */
export function AppRouter() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <Routes>
        <Route path="/dashboard/*" element={<DashboardApp />} />
        <Route path="/workout/*" element={<WorkoutApp />} />
        <Route path="/*" element={<TrackerApp />} />
      </Routes>
    </Suspense>
  );
}
