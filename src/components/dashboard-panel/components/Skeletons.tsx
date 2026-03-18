import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col justify-center min-h-[104px]" aria-busy="true" aria-label="Loading statistic...">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ChartSkeleton({ className = "h-[300px]" }: { className?: string }) {
  return (
    <div className={`w-full ${className} flex items-center justify-center`} aria-busy="true" aria-label="Loading chart...">
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4 w-full" aria-busy="true" aria-label="Loading table...">
      <Skeleton className="h-10 w-full rounded-lg" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-md" />
      ))}
    </div>
  );
}

export function RadarSkeleton() {
  return (
    <div className="w-full h-full min-h-[250px] flex items-center justify-center p-4" aria-busy="true" aria-label="Loading radar chart...">
      <Skeleton className="h-48 w-48 rounded-full" />
    </div>
  );
}

export function GaugeSkeleton() {
  return (
    <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center gap-6" aria-busy="true" aria-label="Loading gauge chart...">
      <Skeleton className="h-32 w-32 rounded-full" />
      <Skeleton className="h-6 w-16" />
    </div>
  );
}

export function RingsSkeleton() {
  return (
    <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center p-4 gap-6" aria-busy="true" aria-label="Loading compliance rings...">
      <div className="relative h-32 w-32 flex items-center justify-center">
        <Skeleton className="absolute h-32 w-32 rounded-full opacity-40 border-8 border-transparent" />
        <Skeleton className="absolute h-24 w-24 rounded-full opacity-60 border-8 border-transparent" />
        <Skeleton className="absolute h-16 w-16 rounded-full opacity-80 border-8 border-transparent" />
      </div>
      <div className="flex justify-center gap-4 w-full px-4">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}
