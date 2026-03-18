import datetime
import random

start_date = datetime.date(2026, 2, 7)
end_date = datetime.date(2026, 3, 17)
user_id = "3b8f612d-1dbf-4d3e-a7fd-473495c1ff17"

headers = "user_id,date,weight_fasting,measurement_time,sleep_hours,sleep_quality,hrv,sleep_score,steps,steps_goal,active_kcal,cardio_hiit_mins,cardio_liss_mins,workout_session,workout_start_time,workout_duration,gym_rpe,gym_energy,gym_mood,soreness_level,water_liters,salt_grams,diet_adherence,digestion_rating,digestion_comments,bathroom_visits,stress_level,daily_energy,hunger_level,libido,mood,cycle_day,blood_glucose,sys_bp,dia_bp,general_notes"
lines = [headers]

workout_sessions = ["Push", "Pull", "Legs", "Cardio", "Rest"]
time = "07:30"
weight = 81.0

current_date = start_date
while current_date <= end_date:
    date_str = current_date.isoformat()
    weight += random.uniform(-0.3, 0.3)
    sleep_hours = round(random.uniform(6.0, 9.0), 1)
    sleep_quality = random.randint(1, 5)
    hrv = random.randint(40, 90)
    sleep_score = random.randint(60, 95)
    steps = random.randint(3000, 12000)
    steps_goal = 10000
    active_kcal = random.randint(400, 1200)
    
    workout = random.choice(workout_sessions)
    is_rest = workout == "Rest"
    is_cardio = workout == "Cardio"
    if not is_rest:
        workout_start = random.choice(["06:30", "07:00", "17:30", "18:00"])
        workout_dur = random.randint(45, 90)
        gym_rpe = round(random.uniform(6.5, 9.5), 1)
        gym_energy = random.randint(1, 5)
        gym_mood = random.randint(1, 5)
        cardio_hiit = random.choice([0, 15, 20]) if is_cardio else ""
        cardio_liss = random.choice([30, 45]) if is_cardio else ""
    else:
        workout_start = ""
        workout_dur = ""
        gym_rpe = ""
        gym_energy = ""
        gym_mood = ""
        cardio_hiit = ""
        cardio_liss = ""
        
    soreness = random.randint(1, 5)
    water = round(random.uniform(2.0, 4.5), 1)
    salt = round(random.uniform(3.0, 8.0), 1)
    cheat = random.choice(["perfect", "minor_deviation", "cheat_meal"])
    digestion = random.randint(1, 5)
    bathroom = random.randint(0, 3)
    stress = random.randint(1, 5)
    energy = random.randint(1, 5)
    hunger = random.randint(1, 5)
    libido = random.randint(1, 5)
    mood = random.randint(1, 5)
    cycle = random.randint(1, 28)
    bg = random.choice(["", random.randint(75, 95)])
    sys = random.choice(["", random.randint(110, 130)])
    dia = random.choice(["", random.randint(70, 85)])
    notes = ""
    
    row = f"{user_id},{date_str},{weight:.1f},{time},{sleep_hours},{sleep_quality},{hrv},{sleep_score},{steps},{steps_goal},{active_kcal},{cardio_hiit},{cardio_liss},{workout},{workout_start},{workout_dur},{gym_rpe},{gym_energy},{gym_mood},{soreness},{water},{salt},{cheat},{digestion},,{bathroom},{stress},{energy},{hunger},{libido},{mood},{cycle},{bg},{sys},{dia},{notes}"
    lines.append(row)
    current_date += datetime.timedelta(days=1)

with open('/Users/mihaid/Coding-Projects/bw-tracker/src/db/daily_logs_mock_31d.csv', 'w') as f:
    f.write('\n'.join(lines) + '\n')
