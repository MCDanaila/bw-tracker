"""Workout app router — backed by mock data until Supabase tables are created."""

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from .mock_data import EXERCISES, EXERCISES_BY_ID
from .schemas import (
    Exercise,
    ExerciseCategory,
    Equipment,
    MuscleGroup,
    SpecificMuscle,
    SPECIFIC_TO_GROUP,
)

router = APIRouter(prefix="/workout", tags=["workout"])


@router.get("/exercises", response_model=list[Exercise])
def list_exercises(
    category:        ExerciseCategory | None = Query(None),
    muscle_group:    MuscleGroup | None      = Query(None),   # high-level filter
    specific_muscle: SpecificMuscle | None   = Query(None),   # granular filter
    equipment:       Equipment | None        = Query(None),
):
    """Return the exercise catalog with optional filters."""
    results = EXERCISES

    if category:
        results = [e for e in results if e["category"] == category.value]

    if specific_muscle:
        v = specific_muscle.value
        results = [
            e for e in results
            if v in e["primary_muscles"]
            or v in e["secondary_muscles"]
            or v in e["auxiliary_muscles"]
        ]

    if muscle_group:
        # collect all SpecificMuscle values that normalize to this group
        group_muscles = {
            sm.value for sm, mg in SPECIFIC_TO_GROUP.items() if mg == muscle_group
        }
        results = [
            e for e in results
            if group_muscles & (
                set(e["primary_muscles"])
                | set(e["secondary_muscles"])
                | set(e["auxiliary_muscles"])
            )
        ]

    if equipment:
        results = [e for e in results if equipment.value in e["equipment"]]

    return results


@router.get("/exercises/{exercise_id}", response_model=Exercise)
def get_exercise(exercise_id: UUID):
    """Return a single exercise by id."""
    exercise = EXERCISES_BY_ID.get(str(exercise_id))
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return exercise
