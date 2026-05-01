"""Mock exercise catalog seeded from schede_rhino.md."""

from datetime import datetime, timezone

_NOW = datetime(2026, 4, 30, tzinfo=timezone.utc).isoformat()

EXERCISES: list[dict] = [
    # ── CHEST ──────────────────────────────────────────────────────────────
    {
        "id": "11111111-0001-0000-0000-000000000000",
        "name": "Bench Press",
        "alternatives": ["Incline Bench Press"],
        "category": "meccanico",
        "primary_muscles":   ["pectoralis_major", "chest_sternal"],
        "secondary_muscles": ["triceps_brachii"],
        "auxiliary_muscles": ["deltoid_anterior"],
        "equipment": ["barbell"],
        "instructions": (
            "Lower bar under control, hold tension briefly at bottom, explode concentrically. "
            "Incline variant shifts emphasis to chest_clavicular head."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "11111111-0002-0000-0000-000000000000",
        "name": "Smith Machine Chest Press",
        "alternatives": ["Smith Machine Incline Press", "Smith Machine Decline Press"],
        "category": "meccanico",
        "primary_muscles":   ["pectoralis_major", "chest_clavicular"],
        "secondary_muscles": ["triceps_brachii"],
        "auxiliary_muscles": ["deltoid_anterior"],
        "equipment": ["smith_machine"],
        "instructions": (
            "Set incline 15–45° depending on target area. "
            "2'' eccentric, explode concentrically. Record load and reps each session."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "11111111-0003-0000-0000-000000000000",
        "name": "Machine Chest Flyes",
        "alternatives": ["Cable Chest Flyes", "Dumbbell Flyes"],
        "category": "metabolico",
        "primary_muscles":   ["pectoralis_major"],
        "secondary_muscles": [],
        "auxiliary_muscles": ["deltoid_anterior", "biceps_brachii"],
        "equipment": ["machine", "cable", "dumbbell"],
        "instructions": (
            "3'' eccentric on every rep. Lower all the way, stretch fully, "
            "drive concentrically. Focus on chest contraction at peak."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "11111111-0004-0000-0000-000000000000",
        "name": "Dips",
        "alternatives": ["Dips Machine"],
        "category": "meccanico",
        "primary_muscles":   ["pectoralis_major", "chest_sternal"],
        "secondary_muscles": ["triceps_brachii"],
        "auxiliary_muscles": ["deltoid_anterior"],
        "equipment": ["bodyweight", "machine"],
        "instructions": (
            "3'' eccentric, control at bottom. "
            "Add bands or chains for resistance if bodyweight is insufficient. "
            "Lean forward slightly to bias chest over triceps."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },

    # ── BACK ───────────────────────────────────────────────────────────────
    {
        "id": "22222222-0001-0000-0000-000000000000",
        "name": "Low Cable Row",
        "alternatives": ["Pulley Low Row"],
        "category": "meccanico",
        "primary_muscles":   ["latissimus_dorsi", "teres_major", "rhomboid_major"],
        "secondary_muscles": ["biceps_brachii", "brachialis"],
        "auxiliary_muscles": ["deltoid_posterior"],
        "equipment": ["cable"],
        "instructions": (
            "Use close-grip attachment. Squeeze the back hard at end of concentric. "
            "Do not cross the torso line — attachment stops 2–3 fingers from body."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "22222222-0002-0000-0000-000000000000",
        "name": "T-Bar Row",
        "alternatives": ["Chest-Supported T-Bar Row"],
        "category": "meccanico",
        "primary_muscles":   ["latissimus_dorsi", "teres_major", "rhomboid_major"],
        "secondary_muscles": ["biceps_brachii", "brachialis"],
        "auxiliary_muscles": ["deltoid_posterior", "erector_spinae"],
        "equipment": ["t_bar"],
        "instructions": (
            "Squeeze the back hard at end of concentric. Do not exceed the torso line. "
            "Prefer chest-supported version if the machine is available."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "22222222-0003-0000-0000-000000000000",
        "name": "Lat Pulldown",
        "alternatives": ["Lat Machine Pronated Grip"],
        "category": "meccanico",
        "primary_muscles":   ["latissimus_dorsi", "teres_major"],
        "secondary_muscles": ["biceps_brachii", "brachialis"],
        "auxiliary_muscles": ["deltoid_posterior", "rhomboid_major"],
        "equipment": ["cable"],
        "instructions": (
            "Pronated grip. Squeeze the back hard at the end of the concentric. "
            "Do not pull past the torso line."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "22222222-0004-0000-0000-000000000000",
        "name": "Unilateral Cable Pulldown",
        "alternatives": ["One-Arm Supinated Pulldown"],
        "category": "pre_attivazione",
        "primary_muscles":   ["latissimus_dorsi"],
        "secondary_muscles": ["biceps_brachii"],
        "auxiliary_muscles": [],
        "equipment": ["cable"],
        "instructions": (
            "Ramp up sets of 8 increasing load until you can no longer complete all 8 reps. "
            "Stop there — used as neural warm-up before heavy back work."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "22222222-0005-0000-0000-000000000000",
        "name": "Straight-Arm Pulldown",
        "alternatives": ["Pulldown Braccia Tese"],
        "category": "metabolico",
        "primary_muscles":   ["latissimus_dorsi"],
        "secondary_muscles": [],
        "auxiliary_muscles": ["triceps_brachii", "serratus_anterior"],
        "equipment": ["cable"],
        "instructions": "Keep arms nearly straight throughout. Goal is maximum lat pump.",
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "22222222-0006-0000-0000-000000000000",
        "name": "Pullover Machine",
        "alternatives": [],
        "category": "metabolico",
        "primary_muscles":   ["latissimus_dorsi", "teres_major"],
        "secondary_muscles": ["pectoralis_minor", "serratus_anterior"],
        "auxiliary_muscles": ["triceps_brachii"],
        "equipment": ["machine"],
        "instructions": "Full ROM, goal is maximum lat pump across all sets.",
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "22222222-0007-0000-0000-000000000000",
        "name": "Smith Machine Row",
        "alternatives": ["Pronated Grip Pulldown"],
        "category": "metabolico",
        "primary_muscles":   ["latissimus_dorsi", "rhomboid_major"],
        "secondary_muscles": ["biceps_brachii"],
        "auxiliary_muscles": ["deltoid_posterior"],
        "equipment": ["smith_machine", "cable"],
        "instructions": (
            "Squeeze the back hard at end of concentric on every rep. "
            "Can alternate with pronated pulldown."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "22222222-0008-0000-0000-000000000000",
        "name": "Unilateral Barbell Row",
        "alternatives": ["Rematore Unilaterale Bilanciere"],
        "category": "meccanico",
        "primary_muscles":   ["latissimus_dorsi", "teres_major", "rhomboid_major"],
        "secondary_muscles": ["biceps_brachii"],
        "auxiliary_muscles": ["erector_spinae"],
        "equipment": ["barbell"],
        "instructions": "Brace with free hand. Drive elbow back, squeeze at top.",
        "created_at": _NOW,
        "updated_at": _NOW,
    },

    # ── SHOULDERS ──────────────────────────────────────────────────────────
    {
        "id": "33333333-0001-0000-0000-000000000000",
        "name": "Lateral Raises",
        "alternatives": ["Cable Lateral Raises", "Cross Laterals"],
        "category": "metabolico",
        "primary_muscles":   ["deltoid_lateral"],
        "secondary_muscles": [],
        "auxiliary_muscles": ["trapezius", "brachialis"],
        "equipment": ["dumbbell", "cable"],
        "instructions": (
            "Controlled execution. Do not go below 15° of humeral abduction. "
            "Keep constant tension throughout. 40'' rest between sets."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "33333333-0002-0000-0000-000000000000",
        "name": "Shoulder Press",
        "alternatives": ["Smith Machine Shoulder Press", "Dumbbell Shoulder Press", "Military Press"],
        "category": "meccanico",
        "primary_muscles":   ["deltoid_anterior", "deltoid_lateral"],
        "secondary_muscles": ["triceps_brachii"],
        "auxiliary_muscles": ["erector_spinae", "trapezius"],
        "equipment": ["barbell", "dumbbell", "smith_machine"],
        "instructions": (
            "2–3'' eccentric. Lower controlled, drive explosively. "
            "Record load each session and beat it the following week."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "33333333-0003-0000-0000-000000000000",
        "name": "Rear Delt Machine",
        "alternatives": ["Posterior Raises", "Alzate Posteriori"],
        "category": "metabolico",
        "primary_muscles":   ["deltoid_posterior"],
        "secondary_muscles": ["rhomboid_major", "rhomboid_minor", "trapezius"],
        "auxiliary_muscles": [],
        "equipment": ["machine", "dumbbell"],
        "instructions": (
            "Squeeze the posterior delts hard at every rep. "
            "Must feel them actively working throughout."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "33333333-0004-0000-0000-000000000000",
        "name": "Front Raises",
        "alternatives": ["Alzate Frontali"],
        "category": "metabolico",
        "primary_muscles":   ["deltoid_anterior"],
        "secondary_muscles": [],
        "auxiliary_muscles": ["chest_clavicular"],
        "equipment": ["dumbbell", "barbell"],
        "instructions": "Controlled execution. 40'' rest between sets.",
        "created_at": _NOW,
        "updated_at": _NOW,
    },

    # ── ARMS ───────────────────────────────────────────────────────────────
    {
        "id": "44444444-0001-0000-0000-000000000000",
        "name": "Dumbbell Curl",
        "alternatives": ["Incline Dumbbell Curl"],
        "category": "metabolico",
        "primary_muscles":   ["biceps_brachii"],
        "secondary_muscles": ["brachialis"],
        "auxiliary_muscles": ["deltoid_anterior"],
        "equipment": ["dumbbell"],
        "instructions": (
            "Squeeze biceps hard at the top. 2'' eccentric maintaining tension. "
            "Incline variant increases stretch at bottom."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "44444444-0002-0000-0000-000000000000",
        "name": "Barbell Curl",
        "alternatives": ["EZ Bar Curl"],
        "category": "metabolico",
        "primary_muscles":   ["biceps_brachii"],
        "secondary_muscles": ["brachialis"],
        "auxiliary_muscles": ["deltoid_anterior", "forearms"],
        "equipment": ["barbell", "ez_bar"],
        "instructions": "Squeeze biceps at top. Full stretch at bottom. Keep elbows fixed.",
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "44444444-0003-0000-0000-000000000000",
        "name": "Cable Curl",
        "alternatives": ["Low Cable Curl", "High Cable Curl"],
        "category": "metabolico",
        "primary_muscles":   ["biceps_brachii"],
        "secondary_muscles": ["brachialis"],
        "auxiliary_muscles": ["deltoid_anterior"],
        "equipment": ["cable"],
        "instructions": "Squeeze biceps hard at every rep. Keep tension through full ROM.",
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "44444444-0004-0000-0000-000000000000",
        "name": "Unilateral Scott Curl",
        "alternatives": ["Preacher Curl"],
        "category": "metabolico",
        "primary_muscles":   ["biceps_brachii", "brachialis"],
        "secondary_muscles": [],
        "auxiliary_muscles": [],
        "equipment": ["dumbbell"],
        "instructions": "5'' eccentric on every rep. Squeeze hard at the top.",
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "44444444-0005-0000-0000-000000000000",
        "name": "Hammer Curl",
        "alternatives": [],
        "category": "metabolico",
        "primary_muscles":   ["brachialis", "brachioradialis"],
        "secondary_muscles": ["biceps_brachii"],
        "auxiliary_muscles": ["deltoid_anterior"],
        "equipment": ["dumbbell"],
        "instructions": "Neutral grip. Squeeze at the top and feel the brachialis engage.",
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "44444444-0006-0000-0000-000000000000",
        "name": "Rope Pushdown",
        "alternatives": ["Cable Pushdown Rope"],
        "category": "metabolico",
        "primary_muscles":   ["triceps_brachii"],
        "secondary_muscles": [],
        "auxiliary_muscles": ["deltoid_anterior"],
        "equipment": ["cable"],
        "instructions": (
            "Squeeze triceps hard at the bottom. "
            "Spread the rope apart at the bottom for a more physiological arc."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "44444444-0007-0000-0000-000000000000",
        "name": "V-Bar Pushdown",
        "alternatives": ["Straight Bar Pushdown"],
        "category": "metabolico",
        "primary_muscles":   ["triceps_brachii"],
        "secondary_muscles": [],
        "auxiliary_muscles": ["deltoid_anterior"],
        "equipment": ["cable"],
        "instructions": "Squeeze triceps hard at the bottom on every rep.",
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "44444444-0008-0000-0000-000000000000",
        "name": "Overhead Triceps Extension",
        "alternatives": ["Single-Arm Overhead Extension", "French Press"],
        "category": "meccanico",
        "primary_muscles":   ["triceps_brachii"],
        "secondary_muscles": [],
        "auxiliary_muscles": ["deltoid_anterior", "erector_spinae"],
        "equipment": ["cable", "dumbbell", "barbell", "ez_bar"],
        "instructions": (
            "Stretch as far as possible at the bottom (2'' hold), "
            "then drive concentrically with controlled movement."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "44444444-0009-0000-0000-000000000000",
        "name": "Dips Machine Triceps",
        "alternatives": [],
        "category": "metabolico",
        "primary_muscles":   ["triceps_brachii"],
        "secondary_muscles": ["pectoralis_major"],
        "auxiliary_muscles": ["deltoid_anterior"],
        "equipment": ["machine"],
        "instructions": (
            "10 reps + 10'' ISO hold at mid-ROM as finisher. "
            "Scale load to always complete 10 reps."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "44444444-0010-0000-0000-000000000000",
        "name": "Reverse Curl",
        "alternatives": [],
        "category": "metabolico",
        "primary_muscles":   ["brachioradialis", "brachialis"],
        "secondary_muscles": [],
        "auxiliary_muscles": ["forearms"],
        "equipment": ["barbell", "ez_bar"],
        "instructions": "Pronated grip. Full ROM. Targets brachioradialis and brachialis.",
        "created_at": _NOW,
        "updated_at": _NOW,
    },

    # ── LEGS ───────────────────────────────────────────────────────────────
    {
        "id": "55555555-0001-0000-0000-000000000000",
        "name": "Hack Squat",
        "alternatives": ["Banded Hack Squat"],
        "category": "madre",
        "primary_muscles":   ["quadriceps", "rectus_femoris", "vastus_lateralis", "vastus_medialis"],
        "secondary_muscles": [],
        "auxiliary_muscles": ["gluteus_maximus"],
        "equipment": ["machine"],
        "instructions": (
            "Warm up to target load. 3'' eccentric, hold briefly at bottom, "
            "explode concentrically. If exceeding rep range, increase load next session."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "55555555-0002-0000-0000-000000000000",
        "name": "Squat",
        "alternatives": ["Smith Machine Squat"],
        "category": "madre",
        "primary_muscles":   ["quadriceps", "gluteus_maximus"],
        "secondary_muscles": ["erector_spinae"],
        "auxiliary_muscles": ["hamstrings", "adductors"],
        "equipment": ["barbell", "smith_machine"],
        "instructions": (
            "Controlled descent, hold tension briefly at bottom, explode concentrically. "
            "Use bands on Smith for unloading at the bottom if needed."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "55555555-0003-0000-0000-000000000000",
        "name": "Leg Press",
        "alternatives": ["Single-Leg Press"],
        "category": "meccanico",
        "primary_muscles":   ["quadriceps", "gluteus_maximus"],
        "secondary_muscles": [],
        "auxiliary_muscles": ["hamstrings", "adductors"],
        "equipment": ["machine"],
        "instructions": (
            "1'' pause at the bottom on each rep. Precise and controlled. "
            "Single-leg variant: one side at a time, rest 2'' then switch."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "55555555-0004-0000-0000-000000000000",
        "name": "Leg Extension",
        "alternatives": [],
        "category": "metabolico",
        "primary_muscles":   ["quadriceps", "rectus_femoris", "vastus_lateralis", "vastus_medialis"],
        "secondary_muscles": [],
        "auxiliary_muscles": [],
        "equipment": ["machine"],
        "instructions": (
            "Ramp up sets of 10 increasing load each time. "
            "60'' rest only between sets. Focus on quad contraction at the top."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "55555555-0005-0000-0000-000000000000",
        "name": "Lying Leg Curl",
        "alternatives": ["Seated Leg Curl"],
        "category": "metabolico",
        "primary_muscles":   ["hamstrings", "biceps_femoris", "semitendinosus"],
        "secondary_muscles": [],
        "auxiliary_muscles": ["gastrocnemius"],
        "equipment": ["machine"],
        "instructions": (
            "Squeeze hamstrings hard at every rep. "
            "Seated variant offers greater stretch at the hip."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "55555555-0006-0000-0000-000000000000",
        "name": "RDL",
        "alternatives": ["SLDL", "Stiff-Leg Deadlift", "Trap Bar Deadlift"],
        "category": "madre",
        "primary_muscles":   ["hamstrings", "gluteus_maximus"],
        "secondary_muscles": ["erector_spinae"],
        "auxiliary_muscles": ["adductors", "gastrocnemius"],
        "equipment": ["barbell", "dumbbell", "trap_bar"],
        "instructions": (
            "Touch at the bottom, release tension slightly, then explode up. "
            "Focus on hamstring stretch. "
            "3'' squeeze variant: hold at top for 3'' each rep — use lighter load."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "55555555-0007-0000-0000-000000000000",
        "name": "Bulgarian Split Squat",
        "alternatives": ["Smith Machine Lunges"],
        "category": "metabolico",
        "primary_muscles":   ["quadriceps", "gluteus_maximus"],
        "secondary_muscles": [],
        "auxiliary_muscles": ["adductors", "erector_spinae"],
        "equipment": ["dumbbell", "barbell", "smith_machine"],
        "instructions": (
            "Ramp up sets of 12 per leg. Rest between legs. "
            "Controlled descent, keep tension at the bottom."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "55555555-0008-0000-0000-000000000000",
        "name": "Lunges",
        "alternatives": ["Walking Lunges"],
        "category": "metabolico",
        "primary_muscles":   ["quadriceps", "gluteus_maximus"],
        "secondary_muscles": [],
        "auxiliary_muscles": ["hamstrings", "adductors"],
        "equipment": ["barbell", "dumbbell", "bodyweight"],
        "instructions": "Slow and controlled, like walking in slow motion. 20 total steps.",
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "55555555-0009-0000-0000-000000000000",
        "name": "Adductor Machine",
        "alternatives": [],
        "category": "metabolico",
        "primary_muscles":   ["adductors"],
        "secondary_muscles": [],
        "auxiliary_muscles": [],
        "equipment": ["machine"],
        "instructions": "1'' squeeze at peak contraction on every rep.",
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "55555555-0010-0000-0000-000000000000",
        "name": "Seated Calf Raises",
        "alternatives": ["Standing Calf Raises"],
        "category": "metabolico",
        "primary_muscles":   ["soleus"],
        "secondary_muscles": ["gastrocnemius"],
        "auxiliary_muscles": [],
        "equipment": ["machine"],
        "instructions": (
            "Squeeze hard at the top. Full stretch at the bottom. "
            "Muscle Round: 4+4+4+4+4+4 with 10'' rest, failure only on the last mini-set. "
            "Standing variant: gastrocnemius becomes primary."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },
    {
        "id": "55555555-0011-0000-0000-000000000000",
        "name": "Hip Thrust",
        "alternatives": [],
        "category": "meccanico",
        "primary_muscles":   ["gluteus_maximus"],
        "secondary_muscles": ["gluteus_medius"],
        "auxiliary_muscles": ["hamstrings", "erector_spinae"],
        "equipment": ["barbell", "machine"],
        "instructions": (
            "Squeeze glutes at the top. "
            "Advanced variant: 5 reps with 4'' squeeze, 5 reps with 2'' squeeze, "
            "then max partials at the top."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },

    # ── TRAPS / UPPER BACK ─────────────────────────────────────────────────
    {
        "id": "66666666-0001-0000-0000-000000000000",
        "name": "Shrugs",
        "alternatives": ["Hyperextensions"],
        "category": "metabolico",
        "primary_muscles":   ["trapezius"],
        "secondary_muscles": [],
        "auxiliary_muscles": ["deltoid_posterior", "rhomboid_major"],
        "equipment": ["barbell", "dumbbell", "machine"],
        "instructions": (
            "First set high reps for pump. Second set heavier for 12–15 reps. "
            "Full ROM, squeeze at the top."
        ),
        "created_at": _NOW,
        "updated_at": _NOW,
    },
]

# O(1) lookup by id
EXERCISES_BY_ID: dict[str, dict] = {e["id"]: e for e in EXERCISES}
