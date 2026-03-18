/**
 * LogWorkoutView - Tab 1: Log a new workout session
 *
 * Work In Progress
 *
 * Planned features:
 * - Select or create a workout program
 * - Log exercises with sets, reps, weight, and RPE
 * - Auto-save to offline queue (Dexie)
 * - Sync to backend when online
 * - Voice notes for exercise comments
 */

export default function LogWorkoutView() {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Log Workout</h2>
        <p className="text-muted-foreground mb-4">
          Log your training session with exercises, sets, reps, and RPE
        </p>
        <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-lg font-medium">
          🚧 Work In Progress
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-amber-900 dark:text-amber-100 text-sm">
          <strong>Planned:</strong> Form to log exercises with sets/reps/weight/RPE, offline queue integration, and syncing
        </p>
      </div>
    </div>
  );
}
