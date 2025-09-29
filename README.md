# HeartSense – Heart Disease Risk Prediction

HeartSense is an end-to-end project that predicts 10‑year Coronary Heart Disease (CHD) risk. It includes:
- A FastAPI backend that serves model predictions
- A Next.js (TypeScript) web frontend (under `chd-web/`)
- Jupyter notebooks and Python scripts for data prep and model training
- Optional Streamlit app for quick exploration

This README covers setup, dependency install, how to run each part, the project structure, data and features used, preprocessing, model training, and technologies.

## Quickstart

- Python backend (FastAPI):
  - Command to run: `uvicorn app.main:app --reload --port 8000` (from `backend/`)
- Web frontend (Next.js):
  - Command to run: `npm run dev` (from `chd-web/`)

Details below.

## Project structure

- `backend/`
  - `app/`
    - `main.py`: FastAPI app, loads model/threshold, exposes `/api/v1/predict` and `/api/v1/meta`
    - `schemas.py`: Pydantic request/response schemas
    - `settings.py`: Paths and CORS settings
  - `heart_rf_pipeline.pkl`: Trained sklearn Pipeline used by the API
  - `decision_threshold.json`: JSON config, e.g. `{ "threshold": 0.30 }`
- `chd-web/` (Next.js app)
  - `src/components/*`: UI components (Navbar, Footer, etc.)
  - `src/pages/*`: Pages router (index, predictor, about, privacy)
  - `src/lib/*`: API client, types/utilities
  - `public/heart_icon.svg`: Logo and favicon
- `src/` (training code)
  - `train.py`: Trains an sklearn Pipeline and saves artifacts
  - `schema.py`: Declares features lists used in training
  - `inference.py`: Helper(s) for inference (if used in notebooks/scripts)
- `notebook/`
  - `compare_api_vs_model.ipynb`: Sanity check – compare direct model output with API output
  - Additional notebooks for EDA, preprocessing, and experiments
- `data/`
  - `heart.csv`, `framingham.csv`, `heart_disease.csv`: Source datasets (CSV)
- `model_artifacts/`
  - `heart_rf_pipeline.pkl`, `decision_threshold.json`: A copy of deployed artifacts
- `streamlit_app.py` and `app/streamlit_app.py`: Optional Streamlit UI
- `requirements.txt`: Single place for all Python dependencies

## What the system does

1. Preprocesses patient features (training uses an sklearn `ColumnTransformer` inside a `Pipeline`)
2. Predicts probability of CHD in the next 10 years using an ML classifier
3. Applies a configurable decision threshold (default 0.30) to produce a binary label
4. Serves predictions via a FastAPI endpoint for the web app

## Dataset and features

- Datasets available under `data/` include framingham-style data (e.g., Framingham Heart Study features).
- Final features used by the model (see `src/schema.py`):
  - Numeric: `age`, `totChol`, `sysBP`, `pulsePressure`, `BMI`, `heartRate`, `glucose`, `cigsPerDay`
  - Categorical: `gender`, `currentSmoker`, `BPMeds`, `prevalentStroke`, `prevalentHyp`, `diabetes`
- Target: `TenYearCHD`

Note: We keep `sysBP` and `pulsePressure` (and drop `diaBP` during training if present). Categorical values are strings as used during training: `Male`/`Female`, `Yes`/`No`.

## Preprocessing and model

- Preprocessing: `ColumnTransformer` with
  - Numeric pipeline: `SimpleImputer(strategy="median")` + `StandardScaler()`
  - Categorical pipeline: `SimpleImputer(strategy="most_frequent")` + `OneHotEncoder(handle_unknown="ignore", drop="if_binary", sparse=False)`
- Classifier: Logistic Regression (`class_weight="balanced"`, `max_iter=500`) in the current training script
- Saved as an sklearn `Pipeline` (`joblib.dump`), which bundles preprocessing + model together
- Decision threshold: 0.30 by default (stored in `backend/decision_threshold.json`)

The FastAPI backend loads the exact saved pipeline and infers the expected raw input column order from `preprocessor.feature_names_in_` to avoid drift. It preserves categorical strings (no 0/1 conversion) to match training-time encodings.

## Technologies

- Backend: FastAPI, Pydantic v2, Uvicorn
- ML/DS: scikit-learn, pandas, numpy, joblib
- Notebooks: Jupyter, ipykernel
- Optional UI: Streamlit
- Frontend: Next.js (React, TypeScript, Tailwind), React Hook Form, TanStack Query

## Set up Python environment (venv) and install dependencies

From the project root:

```bash
# 1) Create and activate a virtual environment (macOS/Linux)
python3 -m venv myenv
source myenv/bin/activate

# 2) Upgrade pip (recommended)
pip install --upgrade pip

# 3) Install all Python dependencies for backend, training, notebooks, and Streamlit
pip install -r requirements.txt
```

If you use VS Code, select the `myenv` interpreter so notebooks and debugging use the same environment.

## Run the backend (FastAPI)

From the `backend/` folder:

```bash
# Ensure your venv is active
uvicorn app.main:app --reload --port 8000
```

- Interactive docs: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/
- Prediction: POST to `/api/v1/predict`

Example request body (JSON):

```json
{
  "gender": "Male",
  "age": 58,
  "currentSmoker": "Yes",
  "cigsPerDay": 12,
  "BPMeds": "No",
  "prevalentStroke": "No",
  "prevalentHyp": "Yes",
  "diabetes": "No",
  "totChol": 240,
  "sysBP": 138,
  "BMI": 28.5,
  "heartRate": 78,
  "glucose": 95,
  "pulsePressure": 50
}
```

The API responds with probability, predicted label, threshold, and model version.

## Run the frontend (Next.js)

In a separate terminal, from the `chd-web/` folder:

```bash
npm install
npm run dev
```

- By default, the frontend expects the API at `http://localhost:8000`. You can override via `NEXT_PUBLIC_API_BASE`.
- The dev server runs at http://localhost:3000

## Optional: Run the Streamlit app

From the project root or the `app/` folder (depending on which app you prefer):

```bash
streamlit run streamlit_app.py
# or
streamlit run app/streamlit_app.py
```

Purpose: The Streamlit UI is a lightweight, test-oriented interface to quickly probe the model with sliders and dropdowns. It’s useful for local demos and manual QA separate from the Next.js site.

Tip: Ensure you’ve trained a model or placed the expected artifact (`models/model.joblib`) if `app/Home.py` relies on it, or update the app to point to your current artifact path.

## Training the model

Run `src/train.py` to train a fresh model.

```bash
python src/train.py
```

It will:
- Load data from `data/heart.csv`
- Engineer `pulsePressure` if `diaBP` is available (then drop `diaBP`)
- Fit the preprocessing + Logistic Regression pipeline
- Report validation metrics (AUC/ACC)
- Save the pipeline into `models/model.joblib`

You can then update the API’s `heart_rf_pipeline.pkl` with this new artifact (after evaluating). Ensure the API’s expected columns match the new pipeline (`feature_names_in_`).

## Notebooks

Use `notebook/compare_api_vs_model.ipynb` to validate consistency between direct model inference and the API.
- Set `THRESH = 0.30` to match the API/site
- Replace the sample JSON with your test case and run all cells

Other notebooks:
- `notebook/preprocessing.ipynb`: EDA, cleaning, imputers, encoding, and balancing (uses `imbalanced-learn` SMOTE). Requires `pandas`, `scikit-learn`, `matplotlib`, `seaborn`, and `imbalanced-learn` (already in `requirements.txt`).
- `notebook/model.ipynb`: Builds a `RandomForestClassifier` within an sklearn `Pipeline` and demonstrates thresholding at 0.30; saves `heart_rf_pipeline.pkl` with `joblib.dump`. Ensure you keep categorical string forms (Male/Female, Yes/No) at raw input before the preprocessor.

To use the notebooks with the project venv in VS Code, select the `myenv` interpreter and install the root `requirements.txt` first.

## API contract (summary)

Input JSON fields (raw, before model preprocessing):
- Required: `age`, `gender`, `sysBP`, `BMI`
- Optional but supported: `pulsePressure`, `heartRate`, `totChol`, `glucose`, `cigsPerDay`, `currentSmoker`, `BPMeds`, `prevalentStroke`, `prevalentHyp`, `diabetes`
- Categorical values must be `Male`/`Female` and `Yes`/`No`

Response JSON:
- `probability` (float in [0,1])
- `prediction` (int: 1=high risk, 0=low risk)
- `threshold` (float)
- `model_version` (string)

## Troubleshooting

- If the API probability differs from notebook probability for the same input, ensure:
  - Both use the same model file
  - Categorical inputs are strings (not 0/1) and normalized to `Male`/`Female`, `Yes`/`No`
  - The same threshold is applied (0.30 by default)
- CORS errors from the web app: verify `ALLOWED_ORIGINS` in `backend/app/settings.py`
- Frontend cannot reach API: set `NEXT_PUBLIC_API_BASE` and restart `npm run dev`

## License

For academic/demo purposes. Please verify dataset licensing and attribution before redistribution.
