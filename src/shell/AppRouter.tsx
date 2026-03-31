import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TrackerApp from '@/apps/tracker/TrackerApp';
import { useAuth } from '@/core/contexts/AuthContext';
import { useRole } from '@/core/contexts/RoleContext';

const DashboardApp = lazy(() => import('@/apps/dashboard/DashboardApp'));
const WorkoutApp = lazy(() => import('@/apps/workout/WorkoutApp'));

// These pages will be created shortly
const LandingPage = lazy(() => import('@/apps/public/LandingPage'));
const LoginPage = lazy(() => import('@/apps/public/LoginPage'));
const RegistrationPage = lazy(() => import('@/apps/public/RegistrationPage'));

const SUSPENSE_FALLBACK = <div className="flex h-screen items-center justify-center">Loading...</div>;
const LOADING_DIV = <div />;

/**
 * Redirects authenticated users to their role-based home.
 * Renders children only when there is no active session.
 */
function UnauthenticatedOnly({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const { role, isLoading: roleLoading } = useRole();

  if (loading) return LOADING_DIV;

  if (session) {
    if (roleLoading || !role) return LOADING_DIV;
    if (role === 'coach') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/tracker" replace />;
  }

  return <>{children}</>;
}

/**
 * Resolves the destination for the root `/` route based on session and role.
 */
function RootRedirect() {
  const { session, loading } = useAuth();
  const { role, isLoading: roleLoading } = useRole();

  if (loading || roleLoading) return LOADING_DIV;

  if (!session) return <LandingPage />;

  // Role loaded but empty — treat as athlete (safe default for authenticated users)
  if (!role) return <Navigate to="/tracker" replace />;

  if (role === 'coach') return <Navigate to="/dashboard" replace />;

  // athlete or self_coached
  return <Navigate to="/tracker" replace />;
}

/**
 * Top-level app router.
 * Routes between the different apps (tracker, dashboard, workout, public pages).
 */
export function AppRouter() {
  return (
    <Suspense fallback={SUSPENSE_FALLBACK}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route
          path="/login"
          element={
            <UnauthenticatedOnly>
              <LoginPage />
            </UnauthenticatedOnly>
          }
        />
        <Route
          path="/register"
          element={
            <UnauthenticatedOnly>
              <RegistrationPage />
            </UnauthenticatedOnly>
          }
        />
        <Route path="/tracker/*" element={<TrackerApp />} />
        <Route path="/dashboard/*" element={<DashboardApp />} />
        <Route path="/workout/*" element={<WorkoutApp />} />
      </Routes>
    </Suspense>
  );
}
