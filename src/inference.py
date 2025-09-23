import pandas as pd
from pathlib import Path
from joblib import load
from schema import ALL_FEATURES

MODEL_PATH = Path("models/model.joblib")
_model = None

def load_model():
    global _model
    if _model is None:
        _model = load(MODEL_PATH)
    return _model

def predict_proba(input_dict):
    model = load_model()
    X = pd.DataFrame([input_dict], columns=ALL_FEATURES)
    prob = float(model.predict_proba(X)[0, 1])
    label = int(prob >= 0.5)
    return prob, label
