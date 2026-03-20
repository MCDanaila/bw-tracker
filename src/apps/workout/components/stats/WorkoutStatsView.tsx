/**
 * WorkoutStatsView - Tab 4: Analytics and progress tracking
 *
 * Work In Progress
 *
 * Planned features:
 * - Total volume (tonnage) by time period
 * - One-rep max (1RM) estimates per lift
 * - Exercise frequency heatmap
 * - Progress tracking for key lifts (squat, bench, deadlift, etc.)
 * - Workout consistency streaks
 * - Charts: volume trend, 1RM trend, frequency
 */

export default function WorkoutStatsView() {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Workout Stats</h2>
        <p className="text-muted-foreground mb-4">
          Track your training progress and analytics
        </p>
        <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-lg font-medium">
          🚧 Work In Progress
        </div>
      </div>

      <div className="bg-status-warning/10 border border-status-warning/20 rounded-lg p-4">
        <p className="text-status-warning text-sm">
          <strong>Planned:</strong> Volume tracking, 1RM estimates, frequency heatmap, progress charts, and streaks
        </p>
      </div>
    </div>
  );
}
