/**
 * ProgramsView - Tab 3: Manage workout programs
 *
 * Work In Progress
 *
 * Planned features:
 * - List user's workout programs (templates)
 * - Create new programs with weekly structure
 * - Edit program exercises (sets, reps, rest periods)
 * - Clone existing programs
 * - Activate/deactivate programs for logging
 * - Synced between coach dashboard and this app
 */

export default function ProgramsView() {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Workout Programs</h2>
        <p className="text-muted-foreground mb-4">
          Create and manage your training programs
        </p>
        <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-lg font-medium">
          🚧 Work In Progress
        </div>
      </div>

      <div className="bg-status-warning/10 border border-status-warning/20 rounded-lg p-4">
        <p className="text-status-warning text-sm">
          <strong>Planned:</strong> Program templates, weekly structure, exercise management, clone, and activate/deactivate
        </p>
      </div>
    </div>
  );
}
