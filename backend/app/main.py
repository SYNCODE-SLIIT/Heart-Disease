import json
import joblib
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .schemas import PredictIn, PredictOut, MetaOut, BatchRequest, BatchResponse, BatchResultItem, TopFactor
from .settings import MODEL_PATH, THRESHOLD_PATH, API_V1_PREFIX, MODEL_VERSION, ALLOWED_ORIGINS
from .prepare import prepare_for_model
from .schema_specs import CANONICAL_COLUMNS, DEFAULT_THRESHOLD, RISK_LOW_MAX, RISK_MED_MAX
from .batch_cache import CACHE
from typing import Any
import io
from datetime import datetime
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    _HAS_REPORTLAB = True
except Exception:
    _HAS_REPORTLAB = False


# Global variables to store loaded model and configuration
model = None
threshold_config = None
# Will be populated from the loaded pipeline so API uses the exact same raw input order
MODEL_EXPECTED_COLUMNS = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model and configuration on startup."""
    global model, threshold_config
    
    try:
        # Load the trained pipeline
        model = joblib.load(MODEL_PATH)
        print(f"✅ Model loaded from {MODEL_PATH}")

        # Infer expected raw input columns from the preprocessor used at training time
        global MODEL_EXPECTED_COLUMNS
        try:
            MODEL_EXPECTED_COLUMNS = (
                model.named_steps["preprocessor"].feature_names_in_.tolist()
            )
            print(f"✅ Input columns inferred from model: {MODEL_EXPECTED_COLUMNS}")
        except Exception as e:
            print(f"⚠️ Could not infer expected columns from model: {e}")
            MODEL_EXPECTED_COLUMNS = None

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
    description="API for 10-year Coronary Heart Disease risk prediction using a scikit-learn pipeline",
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


def _normalize_gender(value: str):
    """Normalize gender string to the same representation used in training (Male/Female)."""
    if isinstance(value, str):
        v = value.strip().lower()
        if v.startswith("m"):
            return "Male"
        elif v.startswith("f"):
            return "Female"
    return value


def _normalize_yes_no(value: str):
    """Normalize Yes/No string casing to match training (Yes/No)."""
    if isinstance(value, str):
        v = value.strip().lower()
        return "Yes" if v == "yes" else "No"
    return value


def prepare_input_data(input_data: PredictIn) -> pd.DataFrame:
    """Convert input data to pandas DataFrame with proper column order and types,
    keeping categorical variables as strings so they are encoded exactly like training.
    """

    # Convert input to dict
    data_dict = input_data.model_dump()

    # Normalize categorical strings (do NOT convert to 0/1)
    if 'gender' in data_dict and data_dict['gender'] is not None:
        data_dict['gender'] = _normalize_gender(data_dict['gender'])

    for col in ['currentSmoker', 'BPMeds', 'prevalentStroke', 'prevalentHyp', 'diabetes']:
        if col in data_dict and data_dict[col] is not None:
            data_dict[col] = _normalize_yes_no(data_dict[col])

    # Build DataFrame with same input columns as the model's preprocessor
    cols = MODEL_EXPECTED_COLUMNS or [
        'age', 'gender', 'sysBP', 'pulsePressure', 'BMI',
        'totChol', 'glucose', 'heartRate', 'cigsPerDay',
        'currentSmoker', 'BPMeds', 'prevalentStroke', 'prevalentHyp', 'diabetes'
    ]

    row = []
    for col in cols:
        row.append(data_dict.get(col, np.nan))

    df = pd.DataFrame([row], columns=cols)
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

    expected = MODEL_EXPECTED_COLUMNS or [
        'age', 'gender', 'sysBP', 'pulsePressure', 'BMI',
        'totChol', 'glucose', 'heartRate', 'cigsPerDay',
        'currentSmoker', 'BPMeds', 'prevalentStroke', 'prevalentHyp', 'diabetes'
    ]

    return MetaOut(
        expected_columns=expected,
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


def _escape_for_csv(val: Any) -> Any:
    if isinstance(val, str) and val.startswith(tuple(['=', '+', '-', '@'])):
        return "'" + val
    return val


@app.post(f"/batch/predict")
async def batch_predict(
    file: UploadFile = File(...),
    threshold: float = Query(DEFAULT_THRESHOLD, ge=0.0, le=1.0),
    preview: bool = Query(True),
    preview_limit: int = Query(100, ge=1, le=1000),
):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    # Read input file into DataFrame
    try:
        content = await file.read()
        if file.filename.lower().endswith('.csv'):
            df_input = pd.read_csv(io.BytesIO(content))
        elif file.filename.lower().endswith(('.xls', '.xlsx')):
            df_input = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload CSV or XLSX.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {e}")

    # Prepare
    df_ready, meta = prepare_for_model(df_input)

    # Predict probabilities
    try:
        probs = model.predict_proba(df_ready[CANONICAL_COLUMNS])[:, 1]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {e}")

    # Risk helpers
    def risk_band(p: float) -> str:
        if p < RISK_LOW_MAX:
            return 'Low'
        if p < RISK_MED_MAX:
            return 'Medium'
        return 'High'

    # Build output DataFrame with appended columns
    out = df_ready.copy()
    out['probability'] = np.round(probs, 4)
    out['risk_level'] = [risk_band(p) for p in out['probability']]
    out['prediction'] = (out['probability'] >= threshold).astype(int)

    # Cache payload
    payload = {
        'df': out,
        'meta': meta,
        'threshold': threshold,
        'model_version': MODEL_VERSION,
        'required_columns': CANONICAL_COLUMNS,
    }
    batch_id = CACHE.put(payload)

    total = len(out)
    resp = {
        'batch_id': batch_id,
        'total': int(total),
        'threshold': threshold,
        'model_version': MODEL_VERSION,
        'required_columns': CANONICAL_COLUMNS,
        'extras_dropped': meta.get('extras_dropped', []),
        'missing_inserted': meta.get('missing_inserted', []),
        'warnings': meta.get('warnings', []),
        'mapping_summary': meta.get('mapping_summary', {}),
    }
    if preview or total <= 100:
        limit = min(10 if total > 100 else total, preview_limit)
        rows = out.head(limit).to_dict(orient='records')
        key = 'preview_rows' if total > 100 else 'rows'
        resp[key] = rows

    return JSONResponse(content=resp)


def _fast_top_factors(df_ready: pd.DataFrame, proba: np.ndarray, n_top: int = 3) -> list[list[dict]]:
    """Fast, model-agnostic per-row factor approximation.
    Heuristic: compute absolute z-score of numeric features per row relative to column mean/std
    (on the incoming batch) and map higher magnitude to higher impact; use sign based on
    standardized value sign. Categorical flags contribute a fixed unit if 'Yes'.
    This is not SHAP but provides quick directional hints.
    """
    numeric_cols = [c for c in CANONICAL_COLUMNS if c not in {'gender','currentSmoker','BPMeds','prevalentStroke','prevalentHyp','diabetes'}]
    cat_cols = ['gender','currentSmoker','BPMeds','prevalentStroke','prevalentHyp','diabetes']
    # Stats for numeric
    means = df_ready[numeric_cols].mean(numeric_only=True)
    stds = df_ready[numeric_cols].std(numeric_only=True).replace({0: 1.0}).fillna(1.0)
    results: list[list[dict]] = []
    for i in range(len(df_ready)):
        row = df_ready.iloc[i]
        scores: list[tuple[str, float, str]] = []
        for c in numeric_cols:
            val = row[c]
            if pd.isna(val):
                continue
            z = (float(val) - float(means.get(c, 0.0))) / float(stds.get(c, 1.0))
            scores.append((c, abs(z), '+' if z >= 0 else '-'))
        for c in cat_cols:
            v = str(row[c]) if c in row else ''
            if c == 'gender':
                # Slight weight for Male vs Female differences as placeholder
                if v == 'Male':
                    scores.append((c, 0.4, '+'))
                elif v == 'Female':
                    scores.append((c, 0.3, '-'))
            else:
                if v == 'Yes':
                    scores.append((c, 0.8, '+'))
        # sort and pick top
        scores.sort(key=lambda x: x[1], reverse=True)
        top = [{ 'feature': f, 'direction': d, 'impact': round(float(s), 3) } for f, s, d in scores[:n_top]]
        results.append(top)
    return results


@app.post(f"/batch", response_model=BatchResponse)
async def batch_json(req: BatchRequest):
    """JSON-based batch prediction endpoint.
    Expects canonical rows already normalized on the client. Returns per-row probabilities,
    labels ("Yes"/"No") based on threshold, and quick top factor hints.
    """
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    if not req.rows:
        raise HTTPException(status_code=400, detail="No rows provided")

    # Build DataFrame in canonical order
    try:
        df_ready = pd.DataFrame([r.model_dump() for r in req.rows], columns=CANONICAL_COLUMNS)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid rows payload: {e}")

    # Predict probabilities
    try:
        probs = model.predict_proba(df_ready[CANONICAL_COLUMNS])[:, 1]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {e}")

    # Compute fast top factors
    top_lists = _fast_top_factors(df_ready, probs, n_top=3)

    # Build results
    results: list[BatchResultItem] = []
    thr = req.threshold if req.threshold is not None else DEFAULT_THRESHOLD
    for i, p in enumerate(probs):
        label = 'Yes' if float(p) >= float(thr) else 'No'
        item = BatchResultItem(
            rowIndex=i,
            probability=round(float(p), 4),
            label=label,
            topFactors=[TopFactor(**tf) for tf in top_lists[i]],
            messages=[],
        )
        results.append(item)

    return BatchResponse(
        count=len(results),
        results=results,
        warnings=[],
        errors=[],
    )


@app.post(f"{API_V1_PREFIX}/batch", response_model=BatchResponse)
async def batch_json_v1(req: BatchRequest):
    # Delegate to the same logic as /batch
    return await batch_json(req)


@app.get(f"/batch/export")
async def batch_export(batch_id: str, fmt: str = Query('csv')):
    cached = CACHE.get(batch_id)
    if not cached:
        raise HTTPException(status_code=404, detail="Batch ID not found or expired")

    df: pd.DataFrame = cached['df']
    meta = cached['meta']
    threshold = cached['threshold']
    model_version = cached['model_version']

    if fmt == 'csv':
        buf = io.StringIO()
        # Escape dangerous prefixes
        safe_df = df.applymap(_escape_for_csv)
        safe_df.to_csv(buf, index=False)
        buf.seek(0)
        return StreamingResponse(iter([buf.getvalue()]), media_type='text/csv', headers={
            'Content-Disposition': f'attachment; filename="heartsense_batch_{batch_id}.csv"'
        })

    if fmt == 'xlsx':
        out = io.BytesIO()
        with pd.ExcelWriter(out, engine='xlsxwriter') as writer:
            df.to_excel(writer, index=False, sheet_name='Predictions')
            # Metadata sheet
            meta_ws = writer.book.add_worksheet('Metadata')
            items = [
                ('model_version', model_version),
                ('threshold', threshold),
                ('generated_at', datetime.utcnow().isoformat() + 'Z'),
                ('warnings', '\n'.join(meta.get('warnings', []))),
                ('extras_dropped', ', '.join(meta.get('extras_dropped', []))),
                ('missing_inserted', ', '.join(meta.get('missing_inserted', []))),
                ('mapping_summary', json.dumps(meta.get('mapping_summary', {}), indent=2)),
            ]
            for r, (k, v) in enumerate(items):
                meta_ws.write(r, 0, k)
                meta_ws.write(r, 1, str(v))
        out.seek(0)
        return StreamingResponse(out, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', headers={
            'Content-Disposition': f'attachment; filename="heartsense_batch_{batch_id}.xlsx"'
        })

    if fmt == 'pdf':
        if not _HAS_REPORTLAB:
            raise HTTPException(status_code=400, detail="PDF export is not available because 'reportlab' is not installed. Install reportlab or use csv/xlsx.")
        out = io.BytesIO()
        c = canvas.Canvas(out, pagesize=letter)
        width, height = letter
        y = height - 50
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, y, f"HeartSense Batch Predictions — Threshold {threshold} — {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")
        y -= 20
        c.setFont("Helvetica", 9)
        # Simple header
        headers = list(df.columns)
        c.drawString(50, y, ' | '.join(headers[:6]) + (' ...' if len(headers) > 6 else ''))
        y -= 15
        # Rows (basic pagination)
        for _, row in df.head(200).iterrows():
            if y < 50:
                c.showPage()
                y = height - 50
            line = ' | '.join([str(row[h]) for h in headers[:6]]) + (' ...' if len(headers) > 6 else '')
            c.drawString(50, y, line[:110])
            y -= 12
        c.save()
        out.seek(0)
        return StreamingResponse(out, media_type='application/pdf', headers={
            'Content-Disposition': f'attachment; filename="heartsense_batch_{batch_id}.pdf"'
        })

    raise HTTPException(status_code=400, detail="Unsupported export format. Use csv|xlsx|pdf")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)