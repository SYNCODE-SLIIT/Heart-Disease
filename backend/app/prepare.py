from __future__ import annotations

import io
import json
from typing import Dict, List, Tuple, Any

import numpy as np
import pandas as pd

from .schema_specs import (
    CANONICAL_COLUMNS,
    SYNONYMS,
    RANGES,
    BINARY_TRUE,
    BINARY_FALSE,
    GENDER_STR,
)


def _normalize_header(h: str) -> str:
    return h.strip().lower().replace(" ", "_")


def _canonicalize_headers(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, str], List[str]]:
    mapping = {}
    extras: List[str] = []
    cols = []

    # Build a case/format-insensitive lookup for canonical names
    canon_lookup = { _normalize_header(c): c for c in CANONICAL_COLUMNS }

    for c in df.columns:
        norm = _normalize_header(str(c))
        if norm in canon_lookup:
            canon = canon_lookup[norm]
            mapping[canon] = c
            cols.append(canon)
        elif norm in SYNONYMS:
            canon = SYNONYMS[norm]
            mapping[canon] = c
            cols.append(canon)
        else:
            extras.append(c)
    # Rebuild df with canonical columns where found
    out = pd.DataFrame()
    for canon in dict.fromkeys(cols):  # preserve first occurrence order
        src = mapping[canon]
        out[canon] = df[src]
    return out, {k: v for k, v in mapping.items()}, extras


def _derive_columns(df: pd.DataFrame, warnings: List[str]):
    # Derive age from dob if missing
    if 'age' not in df.columns and 'dob' in df.columns:
        try:
            dob = pd.to_datetime(df['dob'], errors='coerce')
            today = pd.Timestamp.today().normalize()
            age = (today - dob).dt.days // 365
            df['age'] = age
            warnings.append('Derived age from dob')
        except Exception:
            pass

    # Derive BMI from weight_kg & height_cm if missing
    if 'BMI' not in df.columns and {'weight_kg', 'height_cm'}.issubset(set(df.columns)):
        try:
            h_m = pd.to_numeric(df['height_cm'], errors='coerce') / 100.0
            w = pd.to_numeric(df['weight_kg'], errors='coerce')
            bmi = w / (h_m ** 2)
            df['BMI'] = bmi
            warnings.append('Derived BMI from weight_kg and height_cm')
        except Exception:
            pass


def _normalize_values(df: pd.DataFrame, warnings: List[str]):
    # Gender string normalization to 'Male'/'Female'
    if 'gender' in df.columns:
        df['gender'] = df['gender'].apply(
            lambda v: GENDER_STR.get(str(v).strip().lower(), v)
        )

    # Yes/No normalization to 'Yes'/'No' for categorical flags
    for col in ['currentSmoker', 'BPMeds', 'prevalentStroke', 'prevalentHyp', 'diabetes']:
        if col in df.columns:
            def yn(v):
                s = str(v).strip().lower()
                if s in BINARY_TRUE:
                    return 'Yes'
                if s in BINARY_FALSE:
                    return 'No'
                return v
            df[col] = df[col].apply(yn)


def _type_coercion(df: pd.DataFrame):
    # Convert only numeric columns; keep categoricals as strings for encoder
    categorical = {'gender', 'currentSmoker', 'BPMeds', 'prevalentStroke', 'prevalentHyp', 'diabetes'}
    for col in df.columns:
        if col in categorical:
            # keep as-is (strings)
            continue
        # Otherwise try numeric
        df[col] = pd.to_numeric(df[col], errors='coerce') if df[col].dtype == object else df[col]


def _unit_heuristics(df: pd.DataFrame, warnings: List[str]):
    # totChol mmol/L → mg/dL if median in [3,15]
    if 'totChol' in df.columns:
        med = pd.to_numeric(df['totChol'], errors='coerce').median()
        if pd.notna(med) and 3 <= med <= 15:
            df['totChol'] = pd.to_numeric(df['totChol'], errors='coerce') * 38.67
            warnings.append('Converted totChol from mmol/L to mg/dL by ×38.67 (heuristic)')


def _range_clamps(df: pd.DataFrame, warnings: List[str]):
    for col, (lo, hi) in RANGES.items():
        if col in df.columns:
            s = pd.to_numeric(df[col], errors='coerce')
            below = (s < lo).sum()
            above = (s > hi).sum()
            s = s.clip(lower=lo, upper=hi)
            df[col] = s
            if below or above:
                warnings.append(f'Clamped {col} outside [{lo},{hi}] ({below} low, {above} high).')


def prepare_for_model(df_input: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Returns: df_ready and metadata dict containing warnings, mapping_summary, extras_dropped, missing_inserted
    """
    warnings: List[str] = []

    # Canonicalize headers and map synonyms
    df, mapping_summary, extras_dropped = _canonicalize_headers(df_input)

    # Derivations
    _derive_columns(df, warnings)

    # Value normalization (binary/gender/ordinals)
    _normalize_values(df, warnings)

    # Unit conversions
    _unit_heuristics(df, warnings)

    # Type coercion
    _type_coercion(df)

    # Ensure all required columns present (insert NaN if missing)
    missing_inserted = []
    for col in CANONICAL_COLUMNS:
        if col not in df.columns:
            df[col] = np.nan
            missing_inserted.append(col)

    # Clamp ranges
    _range_clamps(df, warnings)

    # Keep only required + passthrough id columns
    passthrough = []
    for p in ['id', 'patient_id', 'name']:
        if p in df_input.columns:
            df[p] = df_input[p]
            passthrough.append(p)

    df = df[CANONICAL_COLUMNS + passthrough]

    meta = {
        'mapping_summary': mapping_summary,
        'extras_dropped': [c for c in extras_dropped if c not in passthrough],
        'missing_inserted': missing_inserted,
        'warnings': warnings,
    }
    return df, meta
