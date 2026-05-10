import type { Program } from '../types/program';

// ── Exercise ID reference ──────────────────────────────────────────────────
// Chest
// Bench Press                  → 11111111-0001
// Smith Machine Chest Press    → 11111111-0002
// Machine Chest Flyes          → 11111111-0003
// Dips                         → 11111111-0004
// Back
// Low Cable Row                → 22222222-0001
// T-Bar Row                    → 22222222-0002
// Lat Pulldown                 → 22222222-0003
// Unilateral Cable Pulldown    → 22222222-0004
// Straight-Arm Pulldown        → 22222222-0005
// Pullover Machine             → 22222222-0006
// Smith Machine Row            → 22222222-0007
// Unilateral Barbell Row       → 22222222-0008
// Shoulders
// Lateral Raises               → 33333333-0001
// Shoulder Press               → 33333333-0002
// Rear Delt Machine            → 33333333-0003
// Front Raises                 → 33333333-0004
// Arms
// Dumbbell Curl                → 44444444-0001
// Barbell Curl                 → 44444444-0002
// Cable Curl                   → 44444444-0003
// Unilateral Scott Curl        → 44444444-0004
// Hammer Curl                  → 44444444-0005
// Rope Pushdown                → 44444444-0006
// V-Bar Pushdown               → 44444444-0007
// Overhead Triceps Extension   → 44444444-0008
// Dips Machine Triceps         → 44444444-0009
// Reverse Curl                 → 44444444-0010
// Legs
// Hack Squat                   → 55555555-0001
// Squat                        → 55555555-0002
// Leg Press                    → 55555555-0003
// Leg Extension                → 55555555-0004
// Lying Leg Curl               → 55555555-0005
// RDL                          → 55555555-0006
// Bulgarian Split Squat        → 55555555-0007
// Lunges                       → 55555555-0008
// Adductor Machine             → 55555555-0009
// Seated Calf Raises           → 55555555-0010
// Hip Thrust                   → 55555555-0011
// Other
// Shrugs                       → 66666666-0001

const E = {
  benchPress:           '11111111-0001-0000-0000-000000000000',
  smithChestPress:      '11111111-0002-0000-0000-000000000000',
  machineChestFlyes:    '11111111-0003-0000-0000-000000000000',
  dips:                 '11111111-0004-0000-0000-000000000000',
  lowCableRow:          '22222222-0001-0000-0000-000000000000',
  tBarRow:              '22222222-0002-0000-0000-000000000000',
  latPulldown:          '22222222-0003-0000-0000-000000000000',
  unilateralCablePulldown: '22222222-0004-0000-0000-000000000000',
  straightArmPulldown:  '22222222-0005-0000-0000-000000000000',
  pulloverMachine:      '22222222-0006-0000-0000-000000000000',
  smithMachineRow:      '22222222-0007-0000-0000-000000000000',
  unilateralBarbellRow: '22222222-0008-0000-0000-000000000000',
  lateralRaises:        '33333333-0001-0000-0000-000000000000',
  shoulderPress:        '33333333-0002-0000-0000-000000000000',
  rearDeltMachine:      '33333333-0003-0000-0000-000000000000',
  frontRaises:          '33333333-0004-0000-0000-000000000000',
  dumbbellCurl:         '44444444-0001-0000-0000-000000000000',
  barbellCurl:          '44444444-0002-0000-0000-000000000000',
  cableCurl:            '44444444-0003-0000-0000-000000000000',
  scottCurl:            '44444444-0004-0000-0000-000000000000',
  hammerCurl:           '44444444-0005-0000-0000-000000000000',
  ropePushdown:         '44444444-0006-0000-0000-000000000000',
  vBarPushdown:         '44444444-0007-0000-0000-000000000000',
  overheadExtension:    '44444444-0008-0000-0000-000000000000',
  dipsMachineTriceps:   '44444444-0009-0000-0000-000000000000',
  reverseCurl:          '44444444-0010-0000-0000-000000000000',
  hackSquat:            '55555555-0001-0000-0000-000000000000',
  squat:                '55555555-0002-0000-0000-000000000000',
  legPress:             '55555555-0003-0000-0000-000000000000',
  legExtension:         '55555555-0004-0000-0000-000000000000',
  lyingLegCurl:         '55555555-0005-0000-0000-000000000000',
  rdl:                  '55555555-0006-0000-0000-000000000000',
  bulgarianSplitSquat:  '55555555-0007-0000-0000-000000000000',
  lunges:               '55555555-0008-0000-0000-000000000000',
  adductorMachine:      '55555555-0009-0000-0000-000000000000',
  seatedCalfRaises:     '55555555-0010-0000-0000-000000000000',
  hipThrust:            '55555555-0011-0000-0000-000000000000',
  shrugs:               '66666666-0001-0000-0000-000000000000',
};

export const MOCK_PROGRAMS: Program[] = [
  // ── FULL BODY ────────────────────────────────────────────────────────────
  {
    id: 'rhino-full-body',
    name: 'SCHEDE RHINO',
    split: 'Full Body',
    sessions: [
      {
        id: 'fb1',
        name: 'Full Body #1',
        exercises: [
          {
            exerciseId: E.benchPress,
            sets: 3,
            repScheme: 'Ramping × 8',
            category: 'meccanico',
            coachNotes: 'Start light, 8 reps per set. Increase load each set until you can\'t complete 8. Last 3 sets count. Slow eccentric, hold tension at bottom, explode up. Rest 60″ early sets, up to 120″ for the heavy ones.',
          },
          {
            exerciseId: E.lowCableRow,
            sets: 3,
            repScheme: 'Ramping × 8',
            category: 'meccanico',
            coachNotes: 'Start light, 8 reps per set. Increase load each set until you can\'t complete 8. Last 3 sets count. Squeeze the back hard at end of concentric. Don\'t cross the torso line — attachment stops 2–3 fingers from body.',
          },
          {
            exerciseId: E.legExtension,
            sets: 3,
            repScheme: 'Ramping × 10',
            category: 'metabolico',
            coachNotes: 'Increase load each set until you can\'t complete all 10 reps. Only 60″ rest between sets.',
          },
          {
            exerciseId: E.lateralRaises,
            sets: 3,
            repScheme: '10',
            category: 'metabolico',
            coachNotes: '3 sets of 10. Choose a load that brings you to failure on the last set. If you complete the scheme, increase load next time. Controlled execution — don\'t drop below 15° of humeral abduction, keep tension throughout. 40″ rest between sets.',
          },
          {
            exerciseId: E.dumbbellCurl,
            sets: 3,
            repScheme: '10',
            category: 'metabolico',
            coachNotes: '3 sets of 10. Choose a load that brings you to failure on the last set. If you complete the scheme, increase load next time. Hard squeeze at the top, 2″ eccentric keeping tension throughout.',
          },
          {
            exerciseId: E.ropePushdown,
            sets: 3,
            repScheme: '10',
            category: 'metabolico',
            coachNotes: '3 sets of 10. Choose a load that brings you to failure on the last set. If you complete the scheme, increase load next time. Squeeze hard at the bottom and try to spread the rope open for a more physiological movement.',
          },
        ],
      },
    ],
  },

  // ── PUSH - PULL - LEGS ───────────────────────────────────────────────────
  {
    id: 'rhino-ppl',
    name: 'SCHEDE RHINO',
    split: 'Push · Pull · Legs',
    sessions: [
      // ── PUSH #1 ──────────────────────────────────────────────────────────
      {
        id: 'push1',
        name: 'Push #1',
        exercises: [
          {
            exerciseId: E.smithChestPress,
            sets: 2,
            repScheme: '5/7 | 12/15',
            category: 'meccanico',
            coachNotes: 'Warm up well. First set is a loading set at 5–7 reps. Back off to 12–15 reps. Keep 2″ eccentric and 45° incline.',
          },
          {
            exerciseId: E.benchPress,
            sets: 2,
            repScheme: '12/15 | 6/8',
            category: 'meccanico',
            coachNotes: 'Two working sets. First at 12–15 reps, then increase 20% for 6–8 reps.',
          },
          {
            exerciseId: E.shoulderPress,
            sets: 1,
            repScheme: '8/10',
            category: 'meccanico',
            coachNotes: 'Single all-out set to failure at 8–10 reps. 3″ eccentric on every rep — descend under control, explode up.',
          },
          {
            exerciseId: E.machineChestFlyes,
            sets: 3,
            repScheme: '10 - 6 - 15+',
            category: 'metabolico',
            coachNotes: '3 different sets: 10, 6, then 15+ reps. 3″ eccentric on every rep. Slow and controlled, lower all the way, stretch fully, drive concentrically.',
          },
          {
            exerciseId: E.lateralRaises,
            sets: 3,
            repScheme: '10 - 8 - 15+',
            category: 'metabolico',
            coachNotes: 'First set 10 reps, second 8 reps, third aim for 15+. Adjust load to match target reps each set.',
          },
          {
            exerciseId: E.ropePushdown,
            sets: 3,
            repScheme: '10 - 8 - 15+',
            category: 'metabolico',
            coachNotes: 'First set 10 reps, second 8 reps, third aim for 15+. Adjust load each set.',
          },
          {
            exerciseId: E.overheadExtension,
            sets: 3,
            repScheme: '15/20',
            category: 'meccanico',
            coachNotes: '3 sets of 15–20 reps. Stretch as far as possible at the bottom each rep, feel quality contractions. 2′ rest between sets, same load throughout.',
          },
        ],
      },

      // ── PULL #1 ──────────────────────────────────────────────────────────
      {
        id: 'pull1',
        name: 'Pull #1',
        exercises: [
          {
            exerciseId: E.unilateralCablePulldown,
            sets: 1,
            repScheme: 'Ramping × 8',
            category: 'pre_attivazione',
            coachNotes: '3–4 warm-up sets. Start at 8 reps and increase load each set. Stop when you can\'t complete 8 reps.',
          },
          {
            exerciseId: E.tBarRow,
            sets: 2,
            repScheme: '8/10 | 12/15',
            category: 'madre',
            coachNotes: 'Warm up to an 8/10RM. First set 8–10 reps to failure. Back off and do 12–15 reps. Use chest-supported machine if available.',
          },
          {
            exerciseId: E.lowCableRow,
            sets: 2,
            repScheme: '12/15 | 8/10',
            category: 'metabolico',
            coachNotes: 'First set 12–15 reps, then increase load for 8–10 reps. Squeeze the back at the end of each concentric. Use a close/triangle grip.',
          },
          {
            exerciseId: E.straightArmPulldown,
            sets: 3,
            repScheme: '10/12',
            category: 'metabolico',
            coachNotes: '3 sets of 10–12 reps. Goal is pure pump.',
          },
          {
            exerciseId: E.rearDeltMachine,
            sets: 3,
            repScheme: '10/12',
            category: 'metabolico',
            coachNotes: '3 sets of 10–12 reps. Squeeze the rear delts at the end of each rep — feel them active.',
          },
          {
            exerciseId: E.shrugs,
            sets: 2,
            repScheme: '20 | 12/15',
            category: 'metabolico',
            coachNotes: 'First set 20 reps, then increase load for 12–15 reps.',
          },
          {
            exerciseId: E.cableCurl,
            sets: 3,
            repScheme: '10 - 8 - 15',
            category: 'metabolico',
            coachNotes: 'First set 10 reps, increase load for 8 reps, drop load for 15 reps. Squeeze the biceps hard each rep.',
          },
          {
            exerciseId: E.dumbbellCurl,
            sets: 3,
            repScheme: '12/15',
            category: 'metabolico',
            coachNotes: '3 sets of 12–15 reps on incline bench. Hard squeeze at top, 2″ eccentric with constant tension.',
          },
        ],
      },

      // ── LEGS #1 ──────────────────────────────────────────────────────────
      {
        id: 'legs1',
        name: 'Legs #1',
        exercises: [
          {
            exerciseId: E.lyingLegCurl,
            sets: 3,
            repScheme: '15 - 12 - 10',
            category: 'pre_attivazione',
            coachNotes: '3–4 warm-up sets. First working set 15 reps, increase load for 12, increase again for 10.',
          },
          {
            exerciseId: E.hackSquat,
            sets: 2,
            repScheme: '6/8 | 12/15',
            category: 'madre',
            coachNotes: 'Warm-up sets to reach load. First set loading at 6–8 reps, then back off to 12–15 reps.',
          },
          {
            exerciseId: E.legPress,
            sets: 2,
            repScheme: '12/15 | 20+',
            category: 'meccanico',
            coachNotes: 'First set 12–15 reps, then drop load and aim for 20+ reps. If needed, pause 5″ at top (without re-racking) to finish last reps.',
          },
          {
            exerciseId: E.lunges,
            sets: 1,
            repScheme: '20 steps',
            category: 'metabolico',
            coachNotes: 'Single set of 20 walking steps. Slow and controlled — like walking on the Moon.',
          },
          {
            exerciseId: E.adductorMachine,
            sets: 2,
            repScheme: '20 | 12/15',
            category: 'metabolico',
            coachNotes: 'First set 20 reps, increase load and aim for 12–15 reps.',
          },
          {
            exerciseId: E.seatedCalfRaises,
            sets: 1,
            repScheme: 'Muscle Round',
            category: 'metabolico',
            coachNotes: 'Muscle Round: 4+4+4+4+4+4 with 10″ rest between clusters. Failure only on the last cluster.',
          },
        ],
      },

      // ── PUSH #2 ──────────────────────────────────────────────────────────
      {
        id: 'push2',
        name: 'Push #2',
        exercises: [
          {
            exerciseId: E.benchPress,
            sets: 2,
            repScheme: '5/7 | 12/15',
            category: 'meccanico',
            coachNotes: 'Warm up well. Loading set at 5–7 reps, then back off to 12–15. 2″ eccentric every rep.',
          },
          {
            exerciseId: E.dips,
            sets: 2,
            repScheme: '10/12 | 20+',
            category: 'meccanico',
            coachNotes: 'First set 10–12 reps. Drop to bodyweight (or machine) and hit 20+ reps. 3″ eccentric, control at bottom. Add bands or chains if available.',
          },
          {
            exerciseId: E.shoulderPress,
            sets: 1,
            repScheme: '8/10',
            category: 'meccanico',
            coachNotes: 'Single all-out set, 8–10 reps. 3″ eccentric — descend controlled, explode up.',
          },
          {
            exerciseId: E.machineChestFlyes,
            sets: 3,
            repScheme: '10 - 6 - 15+',
            category: 'metabolico',
            coachNotes: '3 different sets: 10, 6, then 15+ reps. 3″ eccentric each rep. Stretch fully at the bottom, drive concentrically.',
          },
          {
            exerciseId: E.lateralRaises,
            sets: 3,
            repScheme: '10 - 8 - 15+',
            category: 'metabolico',
            coachNotes: 'First set 10 reps, second 8 reps, third aim for 15+. Adjust load each set.',
          },
          {
            exerciseId: E.ropePushdown,
            sets: 3,
            repScheme: '10 - 8 - 15+',
            category: 'metabolico',
            coachNotes: 'First set 10 reps, second 8 reps, third aim for 15+. Adjust load each set.',
          },
          {
            exerciseId: E.overheadExtension,
            sets: 3,
            repScheme: '15/20',
            category: 'meccanico',
            coachNotes: '3 sets of 15–20 reps. Maximum stretch at the bottom each rep. 2′ rest, same load throughout.',
          },
        ],
      },

      // ── PULL #2 ──────────────────────────────────────────────────────────
      {
        id: 'pull2',
        name: 'Pull #2',
        exercises: [
          {
            exerciseId: E.unilateralCablePulldown,
            sets: 1,
            repScheme: 'Ramping × 8',
            category: 'pre_attivazione',
            coachNotes: '3–4 warm-up sets. Supinated grip. Increase load until you can\'t complete 8 reps. Stop there.',
          },
          {
            exerciseId: E.lowCableRow,
            sets: 2,
            repScheme: '8/10 | 12/15',
            category: 'madre',
            coachNotes: 'Warm up to 8/10RM. First set 8–10 reps to failure. Back off for 12–15 reps. Use chest-supported machine if available.',
          },
          {
            exerciseId: E.smithMachineRow,
            sets: 2,
            repScheme: '12/15 | 8/10',
            category: 'metabolico',
            coachNotes: 'First set 12–15 reps, increase load for loading set at 8–10 reps. Squeeze back at end of each concentric.',
          },
          {
            exerciseId: E.pulloverMachine,
            sets: 3,
            repScheme: '10/12',
            category: 'metabolico',
            coachNotes: '3 sets of 10–12 reps. Goal is pure pump.',
          },
          {
            exerciseId: E.rearDeltMachine,
            sets: 3,
            repScheme: '10/12',
            category: 'metabolico',
            coachNotes: '3 sets of 10–12 reps. Squeeze rear delts hard each rep.',
          },
          {
            exerciseId: E.shrugs,
            sets: 2,
            repScheme: '20 | 12/15',
            category: 'metabolico',
            coachNotes: 'First set 20 reps, then increase load for 12–15 reps.',
          },
          {
            exerciseId: E.cableCurl,
            sets: 3,
            repScheme: '10 - 8 - 15',
            category: 'metabolico',
            coachNotes: 'First set 10 reps, increase load for 8, drop for 15. Squeeze biceps at every rep.',
          },
          {
            exerciseId: E.reverseCurl,
            sets: 3,
            repScheme: '12/15',
            category: 'metabolico',
            coachNotes: '3 sets of 12–15 reps.',
          },
        ],
      },

      // ── LEGS #2 ──────────────────────────────────────────────────────────
      {
        id: 'legs2',
        name: 'Legs #2',
        exercises: [
          {
            exerciseId: E.legExtension,
            sets: 3,
            repScheme: '15 target reps',
            category: 'pre_attivazione',
            coachNotes: '3–4 warm-up sets. 3 working sets of 15 reps. Increase load slightly each set but always complete 15 — use rest-pause if needed.',
          },
          {
            exerciseId: E.legPress,
            sets: 2,
            repScheme: '8/10 | 12/15',
            category: 'madre',
            coachNotes: 'First loading set at 8–10 reps, then back off to 12–15 reps.',
          },
          {
            exerciseId: E.lyingLegCurl,
            sets: 3,
            repScheme: '12/15',
            category: 'metabolico',
            coachNotes: '3 sets of 12–15 reps with 45″ rest. Focus on pump and activating the hamstrings.',
          },
          {
            exerciseId: E.squat,
            sets: 1,
            repScheme: '20 target reps',
            category: 'metabolico',
            coachNotes: 'Single working set. Find a 12/15RM then do 20 target reps. Take 5–10″ rest each time you hit failure but don\'t re-rack. Use bands to reduce tension at the bottom.',
          },
          {
            exerciseId: E.legPress,
            sets: 1,
            repScheme: '25',
            category: 'metabolico',
            coachNotes: 'Unilateral leg press. Single set of 25 reps. Slow and controlled — keep tension throughout.',
          },
          {
            exerciseId: E.adductorMachine,
            sets: 2,
            repScheme: 'Ramping × 10',
            category: 'metabolico',
            coachNotes: 'Increase load each set until you can\'t complete all 10 reps.',
          },
          {
            exerciseId: E.seatedCalfRaises,
            sets: 1,
            repScheme: 'Muscle Round',
            category: 'metabolico',
            coachNotes: 'Standing calves. Muscle Round: 4+4+4+4+4+4 with 10″ rest. Failure only at the last cluster.',
          },
        ],
      },

      // ── PUSH #3 ──────────────────────────────────────────────────────────
      {
        id: 'push3',
        name: 'Push #3',
        exercises: [
          {
            exerciseId: E.lateralRaises,
            sets: 3,
            repScheme: '10/12 | 12/15 | 25+',
            category: 'meccanico',
            coachNotes: 'Work with a single cable. 3–4 warm-up sets. First set 10–12 reps, drop load for 12–15, drop significantly and go for 25+ reps. 3 total working sets.',
          },
          {
            exerciseId: E.shoulderPress,
            sets: 2,
            repScheme: '5/7 | 12/15',
            category: 'meccanico',
            coachNotes: 'Loading set at 5–7 reps, back off to 12–15 reps. 2″ eccentric.',
          },
          {
            exerciseId: E.smithChestPress,
            sets: 1,
            repScheme: 'Cluster: 8/10 + MAX + MAX',
            category: 'meccanico',
            coachNotes: 'Work at 15–30° incline. Single rest-pause set: 8–10 reps, rest 30″, max reps, rest 30″, max reps again. Target 15+ total reps.',
          },
          {
            exerciseId: E.machineChestFlyes,
            sets: 3,
            repScheme: '10 - 6 - 15+',
            category: 'metabolico',
            coachNotes: '3 different sets: 10, 6, then 15+ reps. 3″ eccentric each rep. Stretch fully, drive concentrically.',
          },
          {
            exerciseId: E.lateralRaises,
            sets: 3,
            repScheme: '10 - 8 - 15+',
            category: 'metabolico',
            coachNotes: 'Cross-cable laterals. First set 10 reps, second 8, third aim for 15+. Adjust load each set.',
          },
          {
            exerciseId: E.ropePushdown,
            sets: 3,
            repScheme: '10 - 8 - 15+',
            category: 'metabolico',
            coachNotes: 'First set 10 reps, second 8, third aim for 15+. Adjust load each set.',
          },
          {
            exerciseId: E.overheadExtension,
            sets: 3,
            repScheme: '15/20',
            category: 'meccanico',
            coachNotes: '3 sets of 15–20 reps. Maximum stretch at the bottom each rep. 2′ rest, same load throughout.',
          },
        ],
      },

      // ── PULL #3 ──────────────────────────────────────────────────────────
      {
        id: 'pull3',
        name: 'Pull #3',
        exercises: [
          {
            exerciseId: E.lowCableRow,
            sets: 1,
            repScheme: 'Ramping × 8',
            category: 'pre_attivazione',
            coachNotes: '3–4 warm-up sets at 8 reps. Increase load until you can\'t complete 8. Stop there.',
          },
          {
            exerciseId: E.rdl,
            sets: 2,
            repScheme: '8/10 | 15+',
            category: 'madre',
            coachNotes: 'Stiff-leg deadlift. Warm up thoroughly. First set 8–10 reps, then drop load for 15+ reps. Touch at the bottom, release slightly, explode up.',
          },
          {
            exerciseId: E.unilateralBarbellRow,
            sets: 2,
            repScheme: '8/10 | 12/15',
            category: 'meccanico',
            coachNotes: 'Warm up to 8/10RM. First set 8–10 reps, then back off for 12–15 reps.',
          },
          {
            exerciseId: E.pulloverMachine,
            sets: 3,
            repScheme: '10/12',
            category: 'metabolico',
            coachNotes: '3 sets of 10–12 reps. Goal is pure pump.',
          },
          {
            exerciseId: E.rearDeltMachine,
            sets: 3,
            repScheme: '10/12',
            category: 'metabolico',
            coachNotes: '3 sets of 10–12 reps. Squeeze rear delts at every rep.',
          },
          {
            exerciseId: E.cableCurl,
            sets: 3,
            repScheme: '10 - 8 - 15',
            category: 'metabolico',
            coachNotes: 'High cable curl. First set 10 reps, increase load for 8, drop for 15. Squeeze biceps hard each rep.',
          },
          {
            exerciseId: E.reverseCurl,
            sets: 3,
            repScheme: '12/15',
            category: 'metabolico',
            coachNotes: '3 sets of 12–15 reps.',
          },
        ],
      },

      // ── LEGS #3 ──────────────────────────────────────────────────────────
      {
        id: 'legs3',
        name: 'Legs #3',
        exercises: [
          {
            exerciseId: E.lyingLegCurl,
            sets: 3,
            repScheme: '15 - 12 - 10',
            category: 'pre_attivazione',
            coachNotes: '3–4 warm-up sets. First working set 15 reps, increase for 12, increase again for 10.',
          },
          {
            exerciseId: E.bulgarianSplitSquat,
            sets: 2,
            repScheme: '8/10 | 20 target reps',
            category: 'madre',
            coachNotes: 'First set 8–10 reps. Second set drop 20% load and hit 20 target reps in rest-pause. You should reach failure before 20 — push through.',
          },
          {
            exerciseId: E.lyingLegCurl,
            sets: 2,
            repScheme: '12/15 | 10 + 10″ ISO + MAX partials',
            category: 'meccanico',
            coachNotes: 'First set 12–15 reps. Drop load for a complex set: 10 reps, 10″ squeeze hold, then max partial reps at the bottom range.',
          },
          {
            exerciseId: E.rdl,
            sets: 2,
            repScheme: '8/10 | 15+',
            category: 'metabolico',
            coachNotes: 'Stiff-leg deadlift. First set 8–10 reps, then drop load for 15+ reps.',
          },
          {
            exerciseId: E.seatedCalfRaises,
            sets: 1,
            repScheme: 'Muscle Round',
            category: 'metabolico',
            coachNotes: 'Muscle Round: 4+4+4+4+4+4 with 10″ rest. Failure only at the last cluster.',
          },
        ],
      },
    ],
  },
];
