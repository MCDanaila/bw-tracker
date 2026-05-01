export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Arms'
  | 'Legs'
  | 'Core'
  | 'Cardio'
  | 'Full Body'
  | 'Other';

export type SpecificMuscle =
  // Chest
  | 'pectoralis_major' | 'pectoralis_minor' | 'chest_clavicular' | 'chest_sternal'
  // Back
  | 'latissimus_dorsi' | 'upper_back' | 'lower_back' | 'trapezius'
  | 'rhomboid_major' | 'rhomboid_minor' | 'erector_spinae'
  | 'teres_major' | 'teres_minor' | 'infraspinatus' | 'supraspinatus'
  // Shoulders
  | 'deltoid_anterior' | 'deltoid_lateral' | 'deltoid_posterior' | 'rotator_cuff'
  // Arms
  | 'biceps_brachii' | 'triceps_brachii' | 'brachialis' | 'brachioradialis' | 'forearms'
  // Legs
  | 'quadriceps' | 'rectus_femoris' | 'vastus_lateralis' | 'vastus_medialis'
  | 'hamstrings' | 'biceps_femoris' | 'semitendinosus'
  | 'gluteus_maximus' | 'gluteus_medius' | 'gluteus_minimus'
  | 'gastrocnemius' | 'soleus' | 'tibialis_anterior'
  | 'hip_flexors' | 'adductors' | 'abductors'
  // Core
  | 'rectus_abdominis' | 'transverse_abdominis' | 'obliques' | 'serratus_anterior';

export type ExerciseCategory =
  | 'madre'
  | 'meccanico'
  | 'metabolico'
  | 'pre_attivazione'
  | 'pre_affaticamento'
  | 'all_out';

export type Equipment =
  | 'barbell' | 'ez_bar' | 'dumbbell' | 'cable'
  | 'smith_machine' | 'machine' | 't_bar' | 'trap_bar'
  | 'resistance_band' | 'bodyweight' | 'other';

export interface Exercise {
  id: string;
  name: string;
  alternatives: string[];
  category: ExerciseCategory;
  primary_muscles: SpecificMuscle[];
  secondary_muscles: SpecificMuscle[];
  auxiliary_muscles: SpecificMuscle[];
  equipment: Equipment[];
  instructions: string;
  created_at: string;
  updated_at: string;
}

// ── Display helpers ────────────────────────────────────────────────────────

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  'Chest': 'Chest',
  'Back': 'Back',
  'Shoulders': 'Shoulders',
  'Arms': 'Arms',
  'Legs': 'Legs',
  'Core': 'Core',
  'Cardio': 'Cardio',
  'Full Body': 'Full Body',
  'Other': 'Other',
};

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  madre:             'Mother',
  meccanico:         'Mechanical',
  metabolico:        'Metabolic',
  pre_attivazione:   'Pre-Activation',
  pre_affaticamento: 'Pre-Fatigue',
  all_out:           'All-Out',
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell:        'Barbell',
  ez_bar:         'EZ Bar',
  dumbbell:       'Dumbbell',
  cable:          'Cable',
  smith_machine:  'Smith Machine',
  machine:        'Machine',
  t_bar:          'T-Bar',
  trap_bar:       'Trap Bar',
  resistance_band:'Bands',
  bodyweight:     'Bodyweight',
  other:          'Other',
};

export const SPECIFIC_MUSCLE_LABELS: Record<SpecificMuscle, string> = {
  pectoralis_major:    'Pec Major',
  pectoralis_minor:    'Pec Minor',
  chest_clavicular:    'Upper Chest',
  chest_sternal:       'Mid Chest',
  latissimus_dorsi:    'Lats',
  upper_back:          'Upper Back',
  lower_back:          'Lower Back',
  trapezius:           'Traps',
  rhomboid_major:      'Rhomboids',
  rhomboid_minor:      'Rhomboid Minor',
  erector_spinae:      'Erectors',
  teres_major:         'Teres Major',
  teres_minor:         'Teres Minor',
  infraspinatus:       'Infraspinatus',
  supraspinatus:       'Supraspinatus',
  deltoid_anterior:    'Front Delt',
  deltoid_lateral:     'Side Delt',
  deltoid_posterior:   'Rear Delt',
  rotator_cuff:        'Rotator Cuff',
  biceps_brachii:      'Biceps',
  triceps_brachii:     'Triceps',
  brachialis:          'Brachialis',
  brachioradialis:     'Brachioradialis',
  forearms:            'Forearms',
  quadriceps:          'Quads',
  rectus_femoris:      'Rectus Femoris',
  vastus_lateralis:    'Vastus Lateralis',
  vastus_medialis:     'Vastus Medialis',
  hamstrings:          'Hamstrings',
  biceps_femoris:      'Biceps Femoris',
  semitendinosus:      'Semitendinosus',
  gluteus_maximus:     'Glutes',
  gluteus_medius:      'Glute Med',
  gluteus_minimus:     'Glute Min',
  gastrocnemius:       'Gastrocnemius',
  soleus:              'Soleus',
  tibialis_anterior:   'Tibialis',
  hip_flexors:         'Hip Flexors',
  adductors:           'Adductors',
  abductors:           'Abductors',
  rectus_abdominis:    'Abs',
  transverse_abdominis:'TVA',
  obliques:            'Obliques',
  serratus_anterior:   'Serratus',
};

// Maps each SpecificMuscle to its MuscleGroup
export const SPECIFIC_TO_GROUP: Record<SpecificMuscle, MuscleGroup> = {
  pectoralis_major: 'Chest', pectoralis_minor: 'Chest',
  chest_clavicular: 'Chest', chest_sternal: 'Chest',
  latissimus_dorsi: 'Back',  upper_back: 'Back', lower_back: 'Back',
  trapezius: 'Back', rhomboid_major: 'Back', rhomboid_minor: 'Back',
  erector_spinae: 'Back', teres_major: 'Back', teres_minor: 'Back',
  infraspinatus: 'Back', supraspinatus: 'Back',
  deltoid_anterior: 'Shoulders', deltoid_lateral: 'Shoulders',
  deltoid_posterior: 'Shoulders', rotator_cuff: 'Shoulders',
  biceps_brachii: 'Arms', triceps_brachii: 'Arms',
  brachialis: 'Arms', brachioradialis: 'Arms', forearms: 'Arms',
  quadriceps: 'Legs', rectus_femoris: 'Legs', vastus_lateralis: 'Legs',
  vastus_medialis: 'Legs', hamstrings: 'Legs', biceps_femoris: 'Legs',
  semitendinosus: 'Legs', gluteus_maximus: 'Legs', gluteus_medius: 'Legs',
  gluteus_minimus: 'Legs', gastrocnemius: 'Legs', soleus: 'Legs',
  tibialis_anterior: 'Legs', hip_flexors: 'Legs', adductors: 'Legs', abductors: 'Legs',
  rectus_abdominis: 'Core', transverse_abdominis: 'Core',
  obliques: 'Core', serratus_anterior: 'Core',
};

export const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core',
];

export const ALL_EQUIPMENT: Equipment[] = [
  'barbell', 'dumbbell', 'cable', 'machine', 'smith_machine',
  'bodyweight', 'ez_bar', 't_bar', 'trap_bar', 'resistance_band',
];
