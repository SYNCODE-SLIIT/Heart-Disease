#!/usr/bin/env python3
import requests
import json

# Test data
test_data = {
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

def test_meta_endpoint():
    """Test the /meta endpoint"""
    try:
        response = requests.get("http://localhost:8000/api/v1/meta")
        if response.status_code == 200:
            print("✅ /api/v1/meta endpoint working")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ /meta endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing /meta endpoint: {e}")

def test_predict_endpoint():
    """Test the /predict endpoint"""
    try:
        response = requests.post(
            "http://localhost:8000/api/v1/predict",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            print("✅ /api/v1/predict endpoint working")
            result = response.json()
            print(f"Prediction: {result}")
            print(f"Risk probability: {result['probability']:.1%}")
            print(f"Decision: {'High Risk' if result['prediction'] == 1 else 'Low Risk'}")
        else:
            print(f"❌ /predict endpoint failed: {response.status_code}")
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"❌ Error testing /predict endpoint: {e}")

if __name__ == "__main__":
    print("Testing CHD Risk Predictor API endpoints...")
    print("=" * 50)
    test_meta_endpoint()
    print()
    test_predict_endpoint()