"""
Streamlit Demo App — Heart Disease Prediction

Purpose: Simple interactive UI to test the trained Random Forest pipeline
saved from `notebook/model.ipynb` as `notebook/heart_rf_pipeline.pkl`.

Notes
- This is a demo for educational purposes (not medical advice).
- The saved pipeline is expected to include the preprocessor and classifier.
  We read its expected input columns and align the user inputs accordingly.
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, List

import joblib
import numpy as np
import pandas as pd
import streamlit as st


# ---------------------------
# Utilities
# ---------------------------

@st.cache_resource(show_spinner=True)
def load_model():
    """Load the trained pipeline saved in notebook/heart_rf_pipeline.pkl."""
    model_path = Path("notebook/heart_rf_pipeline.pkl")
    if not model_path.exists():
        st.error(
            "Model file not found at 'notebook/heart_rf_pipeline.pkl'.\n"
            "Please run the training notebook to create it."
        )
        st.stop()
    try:
        model = joblib.load(model_path)
    except Exception as e:
        st.exception(e)
        st.stop()
    return model


def get_expected_columns(model) -> List[str] | None:
    """Try to retrieve the expected input columns for the pipeline."""
    # Most scikit-learn ColumnTransformer pipelines expose feature_names_in_
    # via the preprocessor or the pipeline itself.
    try:
        return model.named_steps["preprocessor"].feature_names_in_.tolist()
    except Exception:
        pass
    if hasattr(model, "feature_names_in_"):
        try:
            return list(model.feature_names_in_)
        except Exception:
            return None
    return None


def yes_no(label: str, default: str = "No") -> str:
    return st.selectbox(label, ["No", "Yes"], index=0 if default == "No" else 1)


# ---------------------------
# App UI
# ---------------------------

st.set_page_config(page_title="Heart Disease Demo", page_icon="❤️", layout="centered")
st.title("Heart Disease Prediction — Streamlit Demo")
st.caption("Educational demo. Not medical advice.")

with st.expander("About this app", expanded=False):
    st.write(
        """
        This app loads the trained Random Forest pipeline from `model.ipynb` and
        lets you test predictions interactively. The pipeline includes preprocessing
        (imputation/encoding/scaling) and the classifier, so inputs can be raw values.
        """
    )

model = load_model()
expected_cols = get_expected_columns(model)

with st.sidebar:
    st.header("Prediction Settings")
    threshold = st.slider("Decision threshold (positive if P ≥ threshold)", 0.0, 1.0, 0.35, 0.01)


st.subheader("Enter Patient Details")
st.write("Fields mirror the training dataset used in the notebook.")

with st.form("patient_form"):
    col1, col2 = st.columns(2)

    with col1:
        gender = st.selectbox("Gender", ["Male", "Female"], index=0)
        age = st.slider("Age (years)", 18, 100, 58)
        currentSmoker = yes_no("Current Smoker", default="Yes")
        cigsPerDay = st.slider("Cigarettes per Day", 0, 70, 12)
        BPMeds = yes_no("On BP Meds", default="No")
        prevalentStroke = yes_no("Prevalent Stroke", default="No")
        prevalentHyp = yes_no("Prevalent Hypertension", default="Yes")
        diabetes = yes_no("Diabetes", default="No")

    with col2:
        totChol = st.slider("Total Cholesterol (mg/dL)", 100, 400, 240)
        sysBP = st.slider("Systolic BP (mmHg)", 80, 250, 138)
        pulsePressure = st.slider("Pulse Pressure (mmHg)", 0, 120, 50)
        BMI = st.slider("BMI", 15.0, 45.0, 28.5, step=0.1)
        heartRate = st.slider("Heart Rate (bpm)", 40, 200, 78)
        glucose = st.slider("Glucose (mg/dL)", 40, 250, 95)

    submitted = st.form_submit_button("Predict")

if submitted:
    # Collect input as a single-row DataFrame matching the training feature names
    row: Dict[str, object] = {
        "gender": gender,
        "age": age,
        "currentSmoker": currentSmoker,
        "cigsPerDay": cigsPerDay,
        "BPMeds": BPMeds,
        "prevalentStroke": prevalentStroke,
        "prevalentHyp": prevalentHyp,
        "diabetes": diabetes,
        "totChol": totChol,
        "sysBP": sysBP,
        "BMI": BMI,
        "heartRate": heartRate,
        "glucose": glucose,
        "pulsePressure": pulsePressure,
        # Note: 'education' and 'diaBP' were dropped in preprocessing.
    }

    df_in = pd.DataFrame([row])

    # If the model expects a specific set of columns, add any missing ones as NaN
    if expected_cols is not None:
        for col in expected_cols:
            if col not in df_in.columns:
                df_in[col] = np.nan
        # Reorder to match the training order
        df_in = df_in[expected_cols]

    # Predict
    try:
        proba = float(model.predict_proba(df_in)[0, 1])
        pred_default = int(model.predict(df_in)[0])
    except Exception as e:
        st.error("Prediction failed. See details below.")
        st.exception(e)
        st.stop()

    # Apply user threshold
    pred_thresh = int(proba >= threshold)

    st.subheader("Prediction Result")
    colA, colB = st.columns([1, 2])
    with colA:
        st.metric("Probability of CHD (10y)", f"{proba*100:.1f}%")
        st.write(f"Model default decision: {'Yes' if pred_default==1 else 'No'} @ 0.50")
        st.write(f"Decision @ threshold {threshold:.2f}: {'Yes' if pred_thresh==1 else 'No'}")
    with colB:
        st.progress(min(max(proba, 0.0), 1.0), text="Risk probability")

    if pred_thresh == 1:
        st.error("High Risk: Predicted TenYearCHD = Yes")
    else:
        st.success("Low Risk: Predicted TenYearCHD = No")

    with st.expander("Input sent to the model"):
        st.dataframe(df_in, use_container_width=True)


st.divider()
st.subheader("Batch Test (optional)")
st.write("Upload a CSV with columns similar to the training data to score multiple rows.")
uploaded = st.file_uploader("CSV file", type=["csv"]) 
if uploaded is not None:
    try:
        df_batch = pd.read_csv(uploaded)
        df_score = df_batch.copy()
        if expected_cols is not None:
            for col in expected_cols:
                if col not in df_score.columns:
                    df_score[col] = np.nan
            df_score = df_score[expected_cols]
        probs = model.predict_proba(df_score)[:, 1]
        preds = (probs >= threshold).astype(int)
        out = df_batch.copy()
        out["proba"] = probs
        out["pred@thr"] = preds
        st.dataframe(out.head(50), use_container_width=True)
        st.download_button(
            label="Download predictions as CSV",
            data=out.to_csv(index=False).encode("utf-8"),
            file_name="predictions.csv",
            mime="text/csv",
        )
    except Exception as e:
        st.error("Failed to score the uploaded file.")
        st.exception(e)


st.caption("Built with Streamlit • Pipeline from model.ipynb • RandomForestClassifier")
