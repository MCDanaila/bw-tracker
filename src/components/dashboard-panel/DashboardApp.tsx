import { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AthleteProvider } from './contexts/AthleteContext';
import { DashboardShell } from './layout/DashboardShell';
import { DashboardRoutes } from './routes';

export default function DashboardApp() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return (
    <AthleteProvider>
      <DashboardShell>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          }
        >
          <DashboardRoutes />
        </Suspense>
      </DashboardShell>
    </AthleteProvider>
  );
}
