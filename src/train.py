import pandas as pd
from pathlib import Path
from joblib import dump
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.metrics import roc_auc_score, accuracy_score
from sklearn.linear_model import LogisticRegression
from sklearn.impute import SimpleImputer

from schema import TARGET, NUMERIC_FEATURES, CATEGORICAL_FEATURES, ALL_FEATURES

DATA_PATH = Path("data/heart.csv")
MODELS_DIR = Path("models")
MODELS_DIR.mkdir(parents=True, exist_ok=True)

def build_preprocessor():
    num = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])
    cat = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("ohe", OneHotEncoder(handle_unknown="ignore", drop="if_binary", sparse=False))
    ])
    return ColumnTransformer(
        transformers=[
            ("num", num, NUMERIC_FEATURES),
            ("cat", cat, CATEGORICAL_FEATURES),
        ],
        remainder="drop"
    )

def main():
    df = pd.read_csv(DATA_PATH)

    # Ensure pulsePressure exists; if not, create it from sysBP - diaBP when available
    if "pulsePressure" not in df.columns:
        if {"sysBP", "diaBP"}.issubset(df.columns):
            df["pulsePressure"] = df["sysBP"] - df["diaBP"]

    # Drop redundant/unwanted columns if present
    cols_to_drop = []
    if "diaBP" in df.columns:
        cols_to_drop.append("diaBP")
    if "education" in df.columns:
        cols_to_drop.append("education")
    if cols_to_drop:
        df = df.drop(columns=cols_to_drop)

    # Keep only the features used for training + target, then drop rows missing the target
    df = df[ALL_FEATURES + [TARGET]].dropna(subset=[TARGET])
    X, y = df[ALL_FEATURES], df[TARGET].astype(int)
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    preproc = build_preprocessor()
    clf = LogisticRegression(max_iter=500, class_weight="balanced")
    pipe = Pipeline([("pre", preproc), ("clf", clf)])
    pipe.fit(X_train, y_train)
    val_proba = pipe.predict_proba(X_val)[:,1]
    val_pred = (val_proba >= 0.5).astype(int)
    print("Validation AUC:", roc_auc_score(y_val, val_proba), "ACC:", accuracy_score(y_val, val_pred))
    dump(pipe, MODELS_DIR / "model.joblib")

if __name__ == "__main__":
    main()
