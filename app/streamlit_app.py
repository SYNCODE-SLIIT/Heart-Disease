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
import altair as alt
from pathlib import Path
from datetime import datetime


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


# Simple file logger to help diagnose client-side blank page issues
LOG_PATH = Path("app/streamlit_debug.log")
def log_debug(msg: str) -> None:
    try:
        LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with LOG_PATH.open("a", encoding="utf-8") as f:
            f.write(f"{datetime.utcnow().isoformat()}Z - {msg}\n")
    except Exception:
        # Best-effort logging only
        pass


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
st.success("App loaded and model is ready.")
expected_cols = get_expected_columns(model)
if expected_cols is None:
    st.warning("Couldn't determine expected input columns from the pipeline. We'll align inputs best-effort.")

with st.sidebar:
    st.header("Prediction Settings")
    threshold = st.slider("Decision threshold (positive if P ≥ threshold)", 0.0, 1.0, 0.35, 0.01)
    debug = st.checkbox("Show debug details", value=False)


st.subheader("Enter Patient Details")
st.write("Fields mirror the training dataset used in the notebook.")
st.info("Fill the form below and click Predict.")

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

result_container = st.container()

if submitted:
    log_debug("Form submitted")
    # Collect input, then normalize to likely training schema/types
    row: Dict[str, object] = {
        "gender": gender,
        "age": int(age),
        "currentSmoker": 1 if currentSmoker == "Yes" else 0,
        "cigsPerDay": int(cigsPerDay),
        "BPMeds": 1 if BPMeds == "Yes" else 0,
        "prevalentStroke": 1 if prevalentStroke == "Yes" else 0,
        "prevalentHyp": 1 if prevalentHyp == "Yes" else 0,
        "diabetes": 1 if diabetes == "Yes" else 0,
        "totChol": float(totChol),
        "sysBP": float(sysBP),
        "BMI": float(BMI),
        "heartRate": float(heartRate),
        "glucose": float(glucose),
        "pulsePressure": float(pulsePressure),
    }

    # Map gender to 'male' if that's what the model expects
    if expected_cols is not None and "male" in expected_cols:
        row["male"] = 1 if gender == "Male" else 0
        row.pop("gender", None)

    df_in = pd.DataFrame([row])
    log_debug(f"Prepared input df shape={df_in.shape} cols={list(df_in.columns)}")

    # If the model expects a specific set of columns, add any missing ones as NaN
    if expected_cols is not None:
        for col in expected_cols:
            if col not in df_in.columns:
                df_in[col] = np.nan
        # Reorder to match the training order
        df_in = df_in[expected_cols]

    # Predict
    with st.spinner("Computing prediction..."):
        try:
            log_debug("Calling model.predict_proba")
            proba = float(model.predict_proba(df_in)[0, 1])
            pred_default = int(model.predict(df_in)[0])
            log_debug(f"Model returned proba={proba} pred_default={pred_default}")
        except Exception as e:
            log_debug(f"Prediction exception: {e}")
            st.error("Prediction failed. See details below.")
            st.exception(e)
            if debug:
                with st.expander("Debug — inputs and expected columns"):
                    st.write({"expected_cols": expected_cols})
                    st.dataframe(df_in, width="stretch")
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
        st.progress(min(max(proba, 0.0), 1.0))

    if pred_thresh == 1:
        st.error("High Risk: Predicted TenYearCHD = Yes")
    else:
        st.success("Low Risk: Predicted TenYearCHD = No")

    with st.expander("Input sent to the model"):
        st.dataframe(df_in, width="stretch")
    if debug:
        with st.expander("Debug — inputs and expected columns"):
            st.write({"expected_cols": expected_cols})
            st.dataframe(df_in, width="stretch")

    # ---------------------------
    # Visuals after submission
    # ---------------------------
    st.markdown("## Visuals")
    vis_col1, vis_col2 = st.columns(2)

    # Probability donut
    try:
        donut_df = pd.DataFrame({
            "label": ["Risk", "No Risk"],
            "value": [proba, 1 - proba],
        })
        donut = alt.Chart(donut_df).mark_arc(innerRadius=60).encode(
            theta=alt.Theta("value:Q"),
            color=alt.Color("label:N", scale=alt.Scale(range=["#d62728", "#2ca02c"])),
            tooltip=[alt.Tooltip("value:Q", format=".1%"), "label"],
        ).properties(height=300)
        with vis_col1:
            st.altair_chart(donut, use_container_width=True)
    except Exception as e:
        if debug:
            st.write("Donut error:", e)

    # Numeric features bar (scaled to 0-1 for quick visual)
    try:
        numeric_keys = [k for k, v in row.items() if isinstance(v, (int, float))]
        num_df = pd.DataFrame({
            "feature": numeric_keys,
            "value": [float(row[k]) for k in numeric_keys],
        })
        # Simple normalization for display (min-max across shown values)
        if not num_df.empty:
            vmin, vmax = float(num_df.value.min()), float(num_df.value.max())
            denom = (vmax - vmin) or 1.0
            num_df["norm"] = (num_df.value - vmin) / denom
            bars = alt.Chart(num_df).mark_bar().encode(
                x=alt.X("norm:Q", title="Normalized value (0-1)"),
                y=alt.Y("feature:N", sort='-x'),
                tooltip=["feature", alt.Tooltip("value:Q")],
            ).properties(height=380)
            with vis_col2:
                st.altair_chart(bars, use_container_width=True)
    except Exception as e:
        if debug:
            st.write("Numeric bar error:", e)

    # Binary flags visual intentionally removed per request

    # Feature importance (if available)
    try:
        clf = None
        if hasattr(model, "named_steps"):
            for name, step in reversed(list(model.named_steps.items())):
                if hasattr(step, "feature_importances_"):
                    clf = step
                    break
        if clf is not None and hasattr(clf, "feature_importances_"):
            feat_names = None
            pre = model.named_steps.get("preprocessor") if hasattr(model, "named_steps") else None
            if pre is not None and hasattr(pre, "get_feature_names_out"):
                try:
                    feat_names = pre.get_feature_names_out()
                except Exception:
                    feat_names = None
            if feat_names is None:
                feat_names = expected_cols or [f"f{i}" for i in range(len(clf.feature_importances_))]
            imp_df = pd.DataFrame({
                "feature": list(feat_names)[: len(clf.feature_importances_)],
                "importance": clf.feature_importances_,
            }).sort_values("importance", ascending=False).head(20)
            bar = alt.Chart(imp_df).mark_bar().encode(
                x=alt.X("importance:Q", title="Importance"),
                y=alt.Y("feature:N", sort='-x', title="Feature"),
                tooltip=["feature", alt.Tooltip("importance:Q", format=".4f")],
            ).properties(height=400)
            st.altair_chart(bar, use_container_width=True)
    except Exception as e:
        if debug:
            st.write("Importance bar error:", e)
else:
    st.caption("Awaiting input. Submit the form to see predictions.")


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
        st.dataframe(out.head(50), width="stretch")
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
