import streamlit as st
from pathlib import Path
from src.inference import predict_proba

st.set_page_config(page_title="Heart Attack Risk", page_icon="❤️")
st.title("Heart Attack Risk Predictor")

model_found = Path("models/model.joblib").exists()
st.sidebar.write("Model Status:", "✅" if model_found else "❌")

with st.form("risk_form"):
    age = st.number_input("Age", 1, 120, 54)
    trestbps = st.number_input("Resting BP", 60, 250, 130)
    chol = st.number_input("Cholesterol", 100, 700, 246)
    thalach = st.number_input("Max Heart Rate", 60, 240, 150)
    oldpeak = st.number_input("Oldpeak", 0.0, 10.0, 1.0)
    sex = st.selectbox("Sex", [0,1])
    cp = st.selectbox("Chest Pain Type", [0,1,2,3])
    fbs = st.selectbox("Fasting Blood Sugar >120mg/dl", [0,1])
    restecg = st.selectbox("Resting ECG", [0,1,2])
    exang = st.selectbox("Exercise Induced Angina", [0,1])
    slope = st.selectbox("ST Slope", [0,1,2])
    ca = st.selectbox("No. of Major Vessels", [0,1,2,3])
    thal = st.selectbox("Thal", [0,1,2,3])
    submitted = st.form_submit_button("Predict")

if submitted:
    if not model_found:
        st.error("Model not trained yet.")
    else:
        values = {"age":age,"trestbps":trestbps,"chol":chol,"thalach":thalach,"oldpeak":oldpeak,
                  "sex":sex,"cp":cp,"fbs":fbs,"restecg":restecg,"exang":exang,"slope":slope,"ca":ca,"thal":thal}
        prob, label = predict_proba(values)
        st.write("Risk Probability:", round(prob*100,2), "%")
        st.write("Prediction:", "High Risk" if label==1 else "Low Risk")
