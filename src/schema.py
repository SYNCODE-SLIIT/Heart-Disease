TARGET = "TenYearCHD"

# Numeric features for the updated (Framingham-style) dataset.
# We keep sysBP and pulsePressure (drop diaBP as redundant), and include common lab/vitals.
NUMERIC_FEATURES = [
    "age",
    "totChol",
    "sysBP",
    "pulsePressure",
    "BMI",
    "heartRate",
    "glucose",
    "cigsPerDay",
]

# Categorical features are simple Yes/No or Male/Female strings.
CATEGORICAL_FEATURES = [
    "gender",
    "currentSmoker",
    "BPMeds",
    "prevalentStroke",
    "prevalentHyp",
    "diabetes",
]

ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES
