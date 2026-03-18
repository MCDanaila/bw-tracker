/**
 * WorkoutHistoryView - Tab 2: View past workouts
 *
 * Work In Progress
 *
 * Planned features:
 * - Timeline view of past workouts (most recent first)
 * - Expandable workout cards showing all exercises
 * - Edit/delete past workouts
 * - Filter by program or date range
 * - Search by exercise name
 */

export default function WorkoutHistoryView() {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Workout History</h2>
        <p className="text-muted-foreground mb-4">
          View and manage your past training sessions
        </p>
        <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-lg font-medium">
          🚧 Work In Progress
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-amber-900 dark:text-amber-100 text-sm">
          <strong>Planned:</strong> Timeline of workouts, expandable cards, edit/delete, filters, and search
        </p>
      </div>
    </div>
  );
}
