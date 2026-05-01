"""Workout app Pydantic schemas."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal, Union
from uuid import UUID

from pydantic import BaseModel, Field


# ── High-level muscle group (mirrors TS NormalizedMuscleGroup) ─────────────

class MuscleGroup(str, Enum):
    CHEST      = "Chest"
    BACK       = "Back"
    SHOULDERS  = "Shoulders"
    ARMS       = "Arms"
    LEGS       = "Legs"
    CORE       = "Core"
    CARDIO     = "Cardio"
    FULL_BODY  = "Full Body"
    OTHER      = "Other"


# ── Granular specific muscles (mirrors MUSCLE_GROUP_PATTERNS keys) ─────────

class SpecificMuscle(str, Enum):
    # Chest
    PECTORALIS_MAJOR  = "pectoralis_major"
    PECTORALIS_MINOR  = "pectoralis_minor"
    CHEST_CLAVICULAR  = "chest_clavicular"   # upper / incline head
    CHEST_STERNAL     = "chest_sternal"      # mid / flat head

    # Back
    LATISSIMUS_DORSI  = "latissimus_dorsi"
    UPPER_BACK        = "upper_back"
    LOWER_BACK        = "lower_back"
    TRAPEZIUS         = "trapezius"
    RHOMBOID_MAJOR    = "rhomboid_major"
    RHOMBOID_MINOR    = "rhomboid_minor"
    ERECTOR_SPINAE    = "erector_spinae"
    TERES_MAJOR       = "teres_major"
    TERES_MINOR       = "teres_minor"
    INFRASPINATUS     = "infraspinatus"
    SUPRASPINATUS     = "supraspinatus"

    # Shoulders
    DELTOID_ANTERIOR  = "deltoid_anterior"
    DELTOID_LATERAL   = "deltoid_lateral"
    DELTOID_POSTERIOR = "deltoid_posterior"
    ROTATOR_CUFF      = "rotator_cuff"

    # Arms
    BICEPS_BRACHII    = "biceps_brachii"
    TRICEPS_BRACHII   = "triceps_brachii"
    BRACHIALIS        = "brachialis"
    BRACHIORADIALIS   = "brachioradialis"
    FOREARMS          = "forearms"

    # Legs
    QUADRICEPS        = "quadriceps"
    RECTUS_FEMORIS    = "rectus_femoris"
    VASTUS_LATERALIS  = "vastus_lateralis"
    VASTUS_MEDIALIS   = "vastus_medialis"
    HAMSTRINGS        = "hamstrings"
    BICEPS_FEMORIS    = "biceps_femoris"
    SEMITENDINOSUS    = "semitendinosus"
    GLUTEUS_MAXIMUS   = "gluteus_maximus"
    GLUTEUS_MEDIUS    = "gluteus_medius"
    GLUTEUS_MINIMUS   = "gluteus_minimus"
    GASTROCNEMIUS     = "gastrocnemius"
    SOLEUS            = "soleus"
    TIBIALIS_ANTERIOR = "tibialis_anterior"
    HIP_FLEXORS       = "hip_flexors"
    ADDUCTORS         = "adductors"
    ABDUCTORS         = "abductors"

    # Core
    RECTUS_ABDOMINIS     = "rectus_abdominis"
    TRANSVERSE_ABDOMINIS = "transverse_abdominis"
    OBLIQUES             = "obliques"
    SERRATUS_ANTERIOR    = "serratus_anterior"


# ── Normalization: specific → high-level group ─────────────────────────────

SPECIFIC_TO_GROUP: dict[SpecificMuscle, MuscleGroup] = {
    # Chest
    SpecificMuscle.PECTORALIS_MAJOR:  MuscleGroup.CHEST,
    SpecificMuscle.PECTORALIS_MINOR:  MuscleGroup.CHEST,
    SpecificMuscle.CHEST_CLAVICULAR:  MuscleGroup.CHEST,
    SpecificMuscle.CHEST_STERNAL:     MuscleGroup.CHEST,

    # Back
    SpecificMuscle.LATISSIMUS_DORSI:  MuscleGroup.BACK,
    SpecificMuscle.UPPER_BACK:        MuscleGroup.BACK,
    SpecificMuscle.LOWER_BACK:        MuscleGroup.BACK,
    SpecificMuscle.TRAPEZIUS:         MuscleGroup.BACK,
    SpecificMuscle.RHOMBOID_MAJOR:    MuscleGroup.BACK,
    SpecificMuscle.RHOMBOID_MINOR:    MuscleGroup.BACK,
    SpecificMuscle.ERECTOR_SPINAE:    MuscleGroup.BACK,
    SpecificMuscle.TERES_MAJOR:       MuscleGroup.BACK,
    SpecificMuscle.TERES_MINOR:       MuscleGroup.BACK,
    SpecificMuscle.INFRASPINATUS:     MuscleGroup.BACK,
    SpecificMuscle.SUPRASPINATUS:     MuscleGroup.BACK,

    # Shoulders
    SpecificMuscle.DELTOID_ANTERIOR:  MuscleGroup.SHOULDERS,
    SpecificMuscle.DELTOID_LATERAL:   MuscleGroup.SHOULDERS,
    SpecificMuscle.DELTOID_POSTERIOR: MuscleGroup.SHOULDERS,  # rear delt → Shoulders
    SpecificMuscle.ROTATOR_CUFF:      MuscleGroup.SHOULDERS,

    # Arms
    SpecificMuscle.BICEPS_BRACHII:    MuscleGroup.ARMS,
    SpecificMuscle.TRICEPS_BRACHII:   MuscleGroup.ARMS,
    SpecificMuscle.BRACHIALIS:        MuscleGroup.ARMS,
    SpecificMuscle.BRACHIORADIALIS:   MuscleGroup.ARMS,
    SpecificMuscle.FOREARMS:          MuscleGroup.ARMS,

    # Legs
    SpecificMuscle.QUADRICEPS:        MuscleGroup.LEGS,
    SpecificMuscle.RECTUS_FEMORIS:    MuscleGroup.LEGS,
    SpecificMuscle.VASTUS_LATERALIS:  MuscleGroup.LEGS,
    SpecificMuscle.VASTUS_MEDIALIS:   MuscleGroup.LEGS,
    SpecificMuscle.HAMSTRINGS:        MuscleGroup.LEGS,
    SpecificMuscle.BICEPS_FEMORIS:    MuscleGroup.LEGS,
    SpecificMuscle.SEMITENDINOSUS:    MuscleGroup.LEGS,
    SpecificMuscle.GLUTEUS_MAXIMUS:   MuscleGroup.LEGS,
    SpecificMuscle.GLUTEUS_MEDIUS:    MuscleGroup.LEGS,
    SpecificMuscle.GLUTEUS_MINIMUS:   MuscleGroup.LEGS,
    SpecificMuscle.GASTROCNEMIUS:     MuscleGroup.LEGS,
    SpecificMuscle.SOLEUS:            MuscleGroup.LEGS,
    SpecificMuscle.TIBIALIS_ANTERIOR: MuscleGroup.LEGS,
    SpecificMuscle.HIP_FLEXORS:       MuscleGroup.LEGS,
    SpecificMuscle.ADDUCTORS:         MuscleGroup.LEGS,
    SpecificMuscle.ABDUCTORS:         MuscleGroup.LEGS,

    # Core
    SpecificMuscle.RECTUS_ABDOMINIS:     MuscleGroup.CORE,
    SpecificMuscle.TRANSVERSE_ABDOMINIS: MuscleGroup.CORE,
    SpecificMuscle.OBLIQUES:             MuscleGroup.CORE,
    SpecificMuscle.SERRATUS_ANTERIOR:    MuscleGroup.CORE,
}


def normalize_muscles(muscles: list[SpecificMuscle]) -> list[MuscleGroup]:
    """Deduplicated list of MuscleGroup values for the given specific muscles."""
    seen: set[MuscleGroup] = set()
    result: list[MuscleGroup] = []
    for m in muscles:
        group = SPECIFIC_TO_GROUP.get(m)
        if group and group not in seen:
            seen.add(group)
            result.append(group)
    return result


# ── Other enums ────────────────────────────────────────────────────────────

class ExerciseCategory(str, Enum):
    MADRE             = "madre"
    MECCANICO         = "meccanico"
    METABOLICO        = "metabolico"
    PRE_ATTIVAZIONE   = "pre_attivazione"
    PRE_AFFATICAMENTO = "pre_affaticamento"
    ALL_OUT           = "all_out"


class Equipment(str, Enum):
    BARBELL          = "barbell"
    EZ_BAR           = "ez_bar"
    DUMBBELL         = "dumbbell"
    CABLE            = "cable"
    SMITH_MACHINE    = "smith_machine"
    MACHINE          = "machine"
    T_BAR            = "t_bar"
    TRAP_BAR         = "trap_bar"
    RESISTANCE_BAND  = "resistance_band"
    BODYWEIGHT       = "bodyweight"
    OTHER            = "other"


# ── Set Schemes ────────────────────────────────────────────────────────────

class FixedScheme(BaseModel):
    type: Literal["fixed"] = "fixed"
    reps: int | str


class RangeScheme(BaseModel):
    type: Literal["range"] = "range"
    min: int
    max: int


class RampingScheme(BaseModel):
    type: Literal["ramping"] = "ramping"
    target_reps: int
    working_sets: int


class PyramidScheme(BaseModel):
    type: Literal["pyramid"] = "pyramid"
    sequence: list[int | str]


class ClusterScheme(BaseModel):
    type: Literal["cluster"] = "cluster"
    reps_per_cluster: int
    clusters: int | Literal["to_failure"]
    intra_rest_seconds: int


class RestPauseScheme(BaseModel):
    type: Literal["rest_pause"] = "rest_pause"
    target_reps: int
    mini_rest_seconds: int


class DropsetScheme(BaseModel):
    type: Literal["dropset"] = "dropset"
    initial_scheme: RangeScheme | FixedScheme
    drop_percent: int


class MuscleRoundScheme(BaseModel):
    type: Literal["muscle_round"] = "muscle_round"
    reps_per_mini: int
    mini_sets: int
    intra_rest_seconds: int


class MaxRepsScheme(BaseModel):
    type: Literal["max_reps"] = "max_reps"


SetScheme = Union[
    FixedScheme,
    RangeScheme,
    RampingScheme,
    PyramidScheme,
    ClusterScheme,
    RestPauseScheme,
    DropsetScheme,
    MuscleRoundScheme,
    MaxRepsScheme,
]


# ── Per-rep modifiers ──────────────────────────────────────────────────────

class Modifiers(BaseModel):
    eccentric_seconds: int | None = None
    iso_hold_seconds:  int | None = None
    squeeze_seconds:   int | None = None
    stretch_seconds:   int | None = None
    stop_reps:         bool = False
    partial_reps:      bool = False


# ── Set Group ─────────────────────────────────────────────────────────────

class SetGroup(BaseModel):
    sets:         int
    scheme:       SetScheme = Field(discriminator="type")
    rest_seconds: int
    modifiers:    Modifiers | None = None
    notes:        str | None = None


# ── Exercise (catalog) ─────────────────────────────────────────────────────

class Exercise(BaseModel):
    id:                UUID
    name:              str
    alternatives:      list[str] = []
    category:          ExerciseCategory
    primary_muscles:   list[SpecificMuscle]           # agonists
    secondary_muscles: list[SpecificMuscle] = []      # synergists
    auxiliary_muscles: list[SpecificMuscle] = []      # stabilizers
    equipment:         list[Equipment]
    instructions:      str
    created_at:        datetime
    updated_at:        datetime

    @property
    def primary_groups(self) -> list[MuscleGroup]:
        return normalize_muscles(self.primary_muscles)

    @property
    def secondary_groups(self) -> list[MuscleGroup]:
        return normalize_muscles(self.secondary_muscles)

    @property
    def auxiliary_groups(self) -> list[MuscleGroup]:
        return normalize_muscles(self.auxiliary_muscles)


class ExerciseCreate(BaseModel):
    name:              str
    alternatives:      list[str] = []
    category:          ExerciseCategory
    primary_muscles:   list[SpecificMuscle]
    secondary_muscles: list[SpecificMuscle] = []
    auxiliary_muscles: list[SpecificMuscle] = []
    equipment:         list[Equipment]
    instructions:      str


class ExerciseUpdate(BaseModel):
    name:              str | None = None
    alternatives:      list[str] | None = None
    category:          ExerciseCategory | None = None
    primary_muscles:   list[SpecificMuscle] | None = None
    secondary_muscles: list[SpecificMuscle] | None = None
    auxiliary_muscles: list[SpecificMuscle] | None = None
    equipment:         list[Equipment] | None = None
    instructions:      str | None = None
