import pandas as pd
from pathlib import Path
from joblib import dump
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.metrics import roc_auc_score, accuracy_score
from sklearn.linear_model import LogisticRegression

from schema import TARGET, NUMERIC_FEATURES, CATEGORICAL_FEATURES, ALL_FEATURES

DATA_PATH = Path("data/heart_disease.csv")
MODELS_DIR = Path("models")
MODELS_DIR.mkdir(parents=True, exist_ok=True)

def build_preprocessor():
    num = Pipeline([("scaler", StandardScaler())])
    cat = Pipeline([("ohe", OneHotEncoder(handle_unknown="ignore"))])
    return ColumnTransformer([("num", num, NUMERIC_FEATURES),("cat", cat, CATEGORICAL_FEATURES)], remainder="drop")

def main():
    df = pd.read_csv(DATA_PATH)
    df = df[ALL_FEATURES + [TARGET]].dropna()
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
