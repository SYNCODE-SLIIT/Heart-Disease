from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple

# Canonical columns expected by the pipeline
CANONICAL_COLUMNS: List[str] = [
    # Match the trained pipeline's expected fields
    'age', 'gender', 'sysBP', 'pulsePressure', 'BMI',
    'totChol', 'glucose', 'heartRate', 'cigsPerDay',
    'currentSmoker', 'BPMeds', 'prevalentStroke', 'prevalentHyp', 'diabetes'
]

# Synonym mapping for headers -> canonical
SYNONYMS: Dict[str, str] = {
    # gender
    'sex': 'gender', 'gndr': 'gender',
    # sysBP
    'bp': 'sysBP', 'blood_pressure': 'sysBP', 'resting_bp': 'sysBP', 'systolic_bp': 'sysBP', 'sbp': 'sysBP',
    # pulsePressure
    'pulse_pressure': 'pulsePressure', 'pp': 'pulsePressure',
    # BMI
    'bmi_kg_m2': 'BMI',
    # total cholesterol
    'chol': 'totChol', 'total_cholesterol': 'totChol',
    # glucose / fasting blood sugar
    'fbs': 'glucose', 'fasting_glucose': 'glucose', 'fpg': 'glucose',
    # heart rate
    'hr': 'heartRate', 'resting_hr': 'heartRate',
    # cigs per day
    'cigarettes_per_day': 'cigsPerDay', 'cigs_per_day': 'cigsPerDay',
    # current smoker
    'smoker': 'currentSmoker', 'smoking_status': 'currentSmoker', 'current_smoker': 'currentSmoker',
    # BP meds
    'bpmeds': 'BPMeds', 'bp_meds': 'BPMeds', 'blood_pressure_meds': 'BPMeds',
    # stroke
    'stroke': 'prevalentStroke', 'prev_stroke': 'prevalentStroke',
    # hypertension
    'hypertension': 'prevalentHyp', 'htn': 'prevalentHyp',
    # diabetes
    'dm': 'diabetes', 't2d': 'diabetes', 'type2_diabetes': 'diabetes',
}

# Ranges
RANGES: Dict[str, Tuple[float, float]] = {
    'age': (0, 120),
    'BMI': (10, 60),
    'sysBP': (70, 300),
    'pulsePressure': (10, 200),
    'totChol': (80, 400),
    'glucose': (50, 500),
    'heartRate': (30, 220),
    'cigsPerDay': (0, 100),
}

# Normalization maps
BINARY_TRUE = {'yes', 'y', 'true', 't', '1'}
BINARY_FALSE = {'no', 'n', 'false', 'f', '0'}

# Gender string normalization target is training labels: 'Male'/'Female'
GENDER_STR = {'male': 'Male', 'm': 'Male', 'female': 'Female', 'f': 'Female'}

# Risk band thresholds
RISK_LOW_MAX = 0.33
RISK_MED_MAX = 0.66

DEFAULT_THRESHOLD = 0.30
