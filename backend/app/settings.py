import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).parent.parent

# Model and configuration file paths
MODEL_PATH = BASE_DIR / "heart_rf_pipeline.pkl"
THRESHOLD_PATH = BASE_DIR / "decision_threshold.json"

# API settings
API_V1_PREFIX = "/api/v1"
MODEL_VERSION = "local-dev"

# CORS settings
ALLOWED_ORIGINS = [
    "heart-disease-phi.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]