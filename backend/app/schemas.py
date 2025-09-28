from pydantic import BaseModel, Field
from typing import Optional


class PredictIn(BaseModel):
    """Input schema for CHD risk prediction."""
    
    # Demographics
    age: int = Field(..., ge=18, le=120, description="Age in years")
    gender: str = Field(..., description="Gender (Male/Female)")
    
    # Vital signs
    sysBP: float = Field(..., ge=70, le=300, description="Systolic blood pressure (mmHg)")
    pulsePressure: Optional[float] = Field(None, ge=10, le=200, description="Pulse pressure (mmHg)")
    BMI: float = Field(..., ge=10, le=60, description="Body Mass Index (kg/m²)")
    heartRate: Optional[float] = Field(None, ge=30, le=220, description="Heart rate (bpm)")
    
    # Lab values
    totChol: Optional[float] = Field(None, ge=100, le=600, description="Total cholesterol (mg/dL)")
    glucose: Optional[float] = Field(None, ge=50, le=500, description="Glucose (mg/dL)")
    
    # Lifestyle
    cigsPerDay: Optional[float] = Field(None, ge=0, le=100, description="Cigarettes per day")
    currentSmoker: Optional[str] = Field(None, description="Current smoker (Yes/No)")
    
    # Medical history
    BPMeds: Optional[str] = Field(None, description="On BP medication (Yes/No)")
    prevalentStroke: Optional[str] = Field(None, description="Previous stroke (Yes/No)")
    prevalentHyp: Optional[str] = Field(None, description="Hypertension (Yes/No)")
    diabetes: Optional[str] = Field(None, description="Diabetes (Yes/No)")

    class Config:
        json_schema_extra = {
            "example": {
                "age": 45,
                "gender": "Male",
                "sysBP": 130.0,
                "pulsePressure": 40.0,
                "BMI": 25.5,
                "heartRate": 75.0,
                "totChol": 200.0,
                "glucose": 90.0,
                "cigsPerDay": 0.0,
                "currentSmoker": "No",
                "BPMeds": "No",
                "prevalentStroke": "No",
                "prevalentHyp": "No",
                "diabetes": "No"
            }
        }


class PredictOut(BaseModel):
    """Output schema for CHD risk prediction."""
    
    probability: float = Field(..., description="Predicted probability of CHD in next 10 years")
    prediction: int = Field(..., description="Binary prediction (1 = high risk, 0 = low risk)")
    threshold: float = Field(..., description="Decision threshold used")
    model_version: str = Field(..., description="Model version")

    class Config:
        json_schema_extra = {
            "example": {
                "probability": 0.15,
                "prediction": 0,
                "threshold": 0.30,
                "model_version": "local-dev"
            }
        }


class MetaOut(BaseModel):
    """Metadata about the model and API."""
    
    expected_columns: list[str] = Field(..., description="Expected input columns in order")
    threshold: float = Field(..., description="Current decision threshold")
    model_version: str = Field(..., description="Model version")

    class Config:
        json_schema_extra = {
            "example": {
                "expected_columns": ["age", "gender", "sysBP", "pulsePressure", "BMI", "totChol", "glucose", "heartRate", "cigsPerDay", "currentSmoker", "BPMeds", "prevalentStroke", "prevalentHyp", "diabetes"],
                "threshold": 0.30,
                "model_version": "local-dev"
            }
        }