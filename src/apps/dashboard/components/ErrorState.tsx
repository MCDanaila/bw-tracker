import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/core/components/ui/button';

interface ErrorStateProps {
  error?: Error;
  onReset?: () => void;
  title?: string;
  description?: string;
}

export function ErrorState({ 
  error, 
  onReset,
  title = "Something went wrong",
  description = "An unexpected error occurred while loading this page."
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 text-status-danger opacity-80">
        <AlertTriangle size={48} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground mb-8">
        {error?.message || description}
      </p>
      <div className="flex gap-3">
        {onReset && (
          <Button onClick={onReset} variant="default" className="gap-2">
            <RefreshCw size={16} />
            Try again
          </Button>
        )}
        <Button onClick={() => window.location.href = '/dashboard'} variant="outline" className="gap-2">
          <Home size={16} />
          Dashboard Home
        </Button>
      </div>
    </div>
  );
}
