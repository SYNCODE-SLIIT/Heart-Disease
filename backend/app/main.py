import json
import joblib
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .schemas import PredictIn, PredictOut, MetaOut
from .settings import MODEL_PATH, THRESHOLD_PATH, API_V1_PREFIX, MODEL_VERSION, ALLOWED_ORIGINS


# Global variables to store loaded model and configuration
model = None
threshold_config = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model and configuration on startup."""
    global model, threshold_config
    
    try:
        # Load the trained pipeline
        model = joblib.load(MODEL_PATH)
        print(f"✅ Model loaded from {MODEL_PATH}")
        
        # Load threshold configuration
        with open(THRESHOLD_PATH, 'r') as f:
            threshold_config = json.load(f)
        print(f"✅ Threshold config loaded: {threshold_config}")
        
    except Exception as e:
        print(f"❌ Error loading model or config: {e}")
        raise
    
    yield
    
    # Cleanup on shutdown
    model = None
    threshold_config = None


# Create FastAPI app with lifespan
app = FastAPI(
    title="CHD Risk Prediction API",
    description="API for 10-year Coronary Heart Disease risk prediction using Random Forest model",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Expected columns for the model (in order)
EXPECTED_COLUMNS = [
    'age', 'gender', 'sysBP', 'pulsePressure', 'BMI', 
    'totChol', 'glucose', 'heartRate', 'cigsPerDay',
    'currentSmoker', 'BPMeds', 'prevalentStroke', 'prevalentHyp', 'diabetes'
]


def convert_yes_no_to_binary(value: str) -> int:
    """Convert Yes/No strings to 1/0."""
    if isinstance(value, str):
        return 1 if value.lower() == "yes" else 0
    return value


def convert_gender_to_binary(gender: str) -> int:
    """Convert Male/Female to 1/0 (Male=1, Female=0)."""
    if isinstance(gender, str):
        return 1 if gender.lower() == "male" else 0
    return gender


def prepare_input_data(input_data: PredictIn) -> pd.DataFrame:
    """Convert input data to pandas DataFrame with proper column order and types."""
    
    # Convert input to dict
    data_dict = input_data.model_dump()
    
    # Convert categorical variables to binary
    if 'gender' in data_dict:
        data_dict['gender'] = convert_gender_to_binary(data_dict['gender'])
    
    for col in ['currentSmoker', 'BPMeds', 'prevalentStroke', 'prevalentHyp', 'diabetes']:
        if col in data_dict and data_dict[col] is not None:
            data_dict[col] = convert_yes_no_to_binary(data_dict[col])
    
    # Create DataFrame with expected columns in order
    row_data = []
    for col in EXPECTED_COLUMNS:
        value = data_dict.get(col, np.nan)
        row_data.append(value)
    
    df = pd.DataFrame([row_data], columns=EXPECTED_COLUMNS)
    
    return df


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "CHD Risk Prediction API is running", "status": "healthy"}


@app.get(f"{API_V1_PREFIX}/meta", response_model=MetaOut)
async def get_meta():
    """Get metadata about the model and expected input format."""
    if threshold_config is None:
        raise HTTPException(status_code=500, detail="Threshold configuration not loaded")
    
    return MetaOut(
        expected_columns=EXPECTED_COLUMNS,
        threshold=threshold_config["threshold"],
        model_version=MODEL_VERSION
    )


@app.post(f"{API_V1_PREFIX}/predict", response_model=PredictOut)
async def predict_chd_risk(input_data: PredictIn):
    """Predict 10-year CHD risk for given patient data."""
    
    if model is None or threshold_config is None:
        raise HTTPException(status_code=500, detail="Model or configuration not loaded")
    
    try:
        # Prepare input data
        df = prepare_input_data(input_data)
        
        # Make prediction
        probabilities = model.predict_proba(df)
        
        # Get probability for positive class (CHD risk = 1)
        probability = float(probabilities[0][1])  # Second column is positive class
        
        # Apply threshold to get binary prediction
        threshold = threshold_config["threshold"]
        prediction = 1 if probability >= threshold else 0
        
        return PredictOut(
            probability=round(probability, 4),
            prediction=prediction,
            threshold=threshold,
            model_version=MODEL_VERSION
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)