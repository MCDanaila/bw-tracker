import { lazy } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';

const OverviewPage = lazy(() => import('./pages/OverviewPage'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const AthletesPage = lazy(() => import('./pages/AthletesPage'));
const AthleteDetailPage = lazy(() => import('./pages/AthleteDetailPage'));
const DietEditorPage = lazy(() => import('./pages/DietEditorPage'));
const FoodDatabasePage = lazy(() => import('./pages/FoodDatabasePage'));
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'));
const GoalsPage = lazy(() => import('./pages/GoalsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <h2 className="text-2xl font-semibold mb-2">404</h2>
      <p>Page not found</p>
    </div>
  );
}

function BoundaryLayout() {
  const location = useLocation();
  return (
    <ErrorBoundary key={location.pathname}>
      <Outlet />
    </ErrorBoundary>
  );
}

export function DashboardRoutes() {
  return (
    <Routes>
      <Route element={<BoundaryLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="athletes" element={<AthletesPage />} />
        <Route path="athletes/:id" element={<AthleteDetailPage />} />
        <Route path="athletes/:id/progress" element={<AthleteDetailPage />} />
        <Route path="athletes/:id/diet" element={<AthleteDetailPage />} />
        <Route path="athletes/:id/goals" element={<AthleteDetailPage />} />
        <Route path="diet" element={<DietEditorPage />} />
        <Route path="diet/foods" element={<FoodDatabasePage />} />
        <Route path="diet/templates" element={<TemplatesPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
