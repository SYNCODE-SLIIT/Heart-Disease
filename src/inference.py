import pandas as pd
from pathlib import Path
from joblib import load
from schema import ALL_FEATURES

EXPECTED_COLUMNS = ALL_FEATURES  # from schema

MODEL_PATH = Path("models/model.joblib")
_model = None

def load_model():
    global _model
    if _model is None:
        _model = load(MODEL_PATH)
    return _model

def predict_proba(input_dict):
    model = load_model()
    # Build a DataFrame with the expected training columns; add any missing columns as NaN
    X = pd.DataFrame([input_dict])
    for col in EXPECTED_COLUMNS:
        if col not in X.columns:
            X[col] = pd.NA
    X = X[EXPECTED_COLUMNS]
    prob = float(model.predict_proba(X)[0, 1])
    label = int(prob >= 0.5)
    return prob, label
