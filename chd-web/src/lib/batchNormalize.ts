import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export type Severity = 'error' | 'warning' | 'info';

export interface RowIssue {
  rowIndex: number; // 0-based index in cleaned rows
  field?: string;
  message: string;
  severity: Severity;
}

export type CanonicalRow = Record<typeof CANONICAL[number], string | number | null>;

export interface NormalizeResult {
  rows: CanonicalRow[]; // canonical rows only (14 fields)
  warnings: string[];
  issues: RowIssue[]; // per-row issues
  headerMapping: Record<string, string>; // src -> canonical
  extras: string[]; // headers ignored
}

export const CANONICAL = [
  'gender', 'currentSmoker', 'BPMeds', 'prevalentStroke', 'prevalentHyp', 'diabetes',
  'age', 'cigsPerDay', 'totChol', 'sysBP', 'BMI', 'heartRate', 'glucose', 'pulsePressure',
] as const;

const HEADER_SYNONYMS: Record<string, string> = {
  // gender
  'sex': 'gender', 'gndr': 'gender', 'male_female': 'gender', 'is_male': 'gender', 'm/f': 'gender',
  // currentSmoker
  'smoker': 'currentSmoker', 'is_smoker': 'currentSmoker', 'smoking': 'currentSmoker', 'cur_smoke': 'currentSmoker', 'current_smoking': 'currentSmoker', 'tobacco_use': 'currentSmoker', 'current_smoker': 'currentSmoker',
  // BPMeds
  'bpmeds': 'BPMeds', 'bp_meds': 'BPMeds', 'on_bp_meds': 'BPMeds', 'blood_pressure_meds': 'BPMeds', 'anti_hypertensives': 'BPMeds',
  // prevalentStroke
  'stroke': 'prevalentStroke', 'prior_stroke': 'prevalentStroke', 'stroke_history': 'prevalentStroke', 'ever_stroke': 'prevalentStroke', 'prev_stroke': 'prevalentStroke',
  // prevalentHyp
  'hypertension': 'prevalentHyp', 'high_bp': 'prevalentHyp', 'htn': 'prevalentHyp', 'has_hypertension': 'prevalentHyp',
  // diabetes
  'diabetic': 'diabetes', 'has_diabetes': 'diabetes', 'dm': 'diabetes', 't2d': 'diabetes',
  // age
  'years': 'age', 'age_years': 'age',
  // cigsPerDay
  'cigs/day': 'cigsPerDay', 'cigarettes_per_day': 'cigsPerDay', 'cigs_day': 'cigsPerDay', 'cigs_avg': 'cigsPerDay', 'cigs_per_day': 'cigsPerDay',
  // totChol
  'total_cholesterol': 'totChol', 'cholesterol_total': 'totChol', 'chol_total': 'totChol', 'tchol': 'totChol', 'chol': 'totChol',
  // sysBP
  'systolic_bp': 'sysBP', 'sbp': 'sysBP', 'bp_systolic': 'sysBP', 'bp': 'sysBP', 'blood_pressure': 'sysBP', 'resting_bp': 'sysBP',
  // BMI
  'body_mass_index': 'BMI', 'bmi_kg_m2': 'BMI',
  // heartRate
  'hr': 'heartRate', 'pulse': 'heartRate', 'heart_rate': 'heartRate', 'bpm': 'heartRate', 'resting_hr': 'heartRate',
  // glucose
  'fasting_glucose': 'glucose', 'fbg': 'glucose', 'glu': 'glucose', 'fbs': 'glucose', 'fpg': 'glucose',
  // pulsePressure
  'pp': 'pulsePressure', 'pulse_pressure': 'pulsePressure', 'sbp_dbp_diff': 'pulsePressure', 'pressure_pulse': 'pulsePressure',
  // frontend-only: diaBP
  'diastolic_bp': 'diaBP', 'dbp': 'diaBP',
};

const RANGE_GUARDS: Record<string, [number, number]> = {
  age: [18, 95],
  cigsPerDay: [0, 60],
  totChol: [80, 500],
  sysBP: [70, 260],
  BMI: [10, 80],
  heartRate: [30, 240],
  glucose: [40, 600],
  pulsePressure: [10, 120],
};

function normKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+|[_-]+/g, '_');
}

function toYesNo(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  const s = String(v).trim().toLowerCase();
  if (['yes','y','true','t','1'].includes(s)) return 'Yes';
  if (['no','n','false','f','0'].includes(s)) return 'No';
  return null; // unknown
}

function toGender(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  const s = String(v).trim().toLowerCase();
  if (['male','m','1','true','t'].includes(s)) return 'Male';
  if (['female','f','0','false','fl'].includes(s)) return 'Female';
  return null;
}

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  const s = String(v).trim().replace(/,/g, '');
  if (/^[+-]?\d*(?:\.\d+)?$/.test(s)) return Number(s);
  return null;
}

export async function parseFile(file: File, sheetName?: string): Promise<{ rows: Record<string, unknown>[]; sheetNames?: string[]; usedSheet?: string }>{
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (h: string) => h,
        complete: (res: Papa.ParseResult<Record<string, unknown>>) => {
          resolve({ rows: res.data });
        },
        error: (error: Error) => reject(error),
      });
    });
  }
  if (name.endsWith('.xls') || name.endsWith('.xlsx')) {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });
    const names = wb.SheetNames;
    const target = sheetName && names.includes(sheetName) ? sheetName : names[0];
    const ws = wb.Sheets[target];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
    return { rows: json, sheetNames: names, usedSheet: target };
  }
  throw new Error('Unsupported file type');
}

export function normalizeBatch(rawRows: Record<string, unknown>[]): NormalizeResult {
  const warnings: string[] = [];
  const issues: RowIssue[] = [];
  const headerMapping: Record<string, string> = {};
  const extras: string[] = [];

  // Build header mapping from first row keys
  const rawHeaders = Object.keys(rawRows[0] || {});
  const usedCanon = new Set<string>();
  for (const h of rawHeaders) {
    const nk = normKey(h);
    const canon = (CANONICAL as readonly string[]).find(c => normKey(c) === nk) || HEADER_SYNONYMS[nk];
    if (canon) {
      if (usedCanon.has(canon)) {
        // duplicate mapping -> prefer first occurrence
        warnings.push(`Duplicate header '${h}' also maps to ${canon}. Using first and ignoring this.`);
        extras.push(h);
      } else {
        headerMapping[h] = canon;
        usedCanon.add(canon);
      }
    } else {
      extras.push(h);
    }
  }

  // Ensure required columns resolvable: PP or diaBP rule
  // const required = new Set(CANONICAL);
  // pulsePressure may be missing if diaBP present in raw headers
  const hasPP = Array.from(Object.values(headerMapping)).includes('pulsePressure');
  const hasDia = Object.values(headerMapping).includes('diaBP') || rawHeaders.map(normKey).some(k => HEADER_SYNONYMS[k] === 'diaBP');
  if (!hasPP && !hasDia) {
    issues.push({ rowIndex: -1, message: 'Missing pulsePressure; provide diaBP and we will compute it from sysBP − diaBP.', severity: 'error' });
  }
  for (const c of CANONICAL) {
    if (c === 'pulsePressure') continue; // handled above
    const resolved = Object.values(headerMapping).includes(c);
    if (!resolved) {
      issues.push({ rowIndex: -1, field: c, message: `Missing required column: ${c}`, severity: 'error' });
    }
  }

  const cleaned: CanonicalRow[] = [];
  rawRows.forEach((raw, idx) => {
    const row: { [K in typeof CANONICAL[number]]?: string | number | null } & { diaBP?: number | null } = {};
    // Gather potential diaBP
    let diaBP: number | null = null;
    for (const [src, canonOrDia] of Object.entries(headerMapping)) {
      const canon = canonOrDia === 'diaBP' ? 'diaBP' : canonOrDia;
      const val = (raw as Record<string, unknown>)[src as keyof typeof raw];
      if (canon === 'gender') {
        const g = toGender(val);
        if (g == null) issues.push({ rowIndex: idx, field: 'gender', message: `Unrecognized gender '${val}'`, severity: 'error' });
        row.gender = g ?? '';
      } else if (['currentSmoker','BPMeds','prevalentStroke','prevalentHyp','diabetes'].includes(canon)) {
        const yn = toYesNo(val);
        if (yn == null) issues.push({ rowIndex: idx, field: canon, message: `Unrecognized Yes/No value '${val}'`, severity: 'error' });
        (row as Record<string, string | number | null>)[canon] = (yn ?? '') as string;
      } else if (canon === 'diaBP') {
        diaBP = toNumber(val);
      } else if ((CANONICAL as readonly string[]).includes(canon)) {
        const num = toNumber(val);
        if (num == null) issues.push({ rowIndex: idx, field: canon, message: `${canon}='${val}' is not numeric`, severity: 'error' });
        (row as Record<string, string | number | null>)[canon] = (num as number | null);
      }
    }

    // Compute PP if missing
    if (row.pulsePressure == null || row.pulsePressure === '') {
      if (row.sysBP != null && diaBP != null) {
        row.pulsePressure = Number(row.sysBP) - Number(diaBP);
      }
    } else if (row.sysBP != null && diaBP != null) {
      const diff = Math.abs(Number(row.pulsePressure) - (Number(row.sysBP) - Number(diaBP)));
      if (diff > 2) {
        issues.push({ rowIndex: idx, field: 'pulsePressure', message: `PP mismatch: sysBP - diaBP = ${Number(row.sysBP) - Number(diaBP)}, got ${row.pulsePressure}`, severity: 'error' });
      }
    }

    // Range checks
    for (const [k, [lo, hi]] of Object.entries(RANGE_GUARDS)) {
      const val = (row as Record<string, string | number | null>)[k as keyof CanonicalRow] as number | null | undefined;
  if (val == null) continue;
      if (typeof val !== 'number' || !isFinite(val)) {
        issues.push({ rowIndex: idx, field: k, message: `${k} is not numeric`, severity: 'error' });
        continue;
      }
      if (val < 0) {
        issues.push({ rowIndex: idx, field: k, message: `${k} cannot be negative`, severity: 'error' });
      }
      if (val < lo || val > hi) {
        issues.push({ rowIndex: idx, field: k, message: `${k}=${val} is outside expected range [${lo}, ${hi}]`, severity: 'warning' });
      }
    }

    // Build a fully-populated CanonicalRow
    const finalized: CanonicalRow = {
      gender: (row.gender ?? '') as string,
      currentSmoker: (row.currentSmoker ?? '') as string,
      BPMeds: (row.BPMeds ?? '') as string,
      prevalentStroke: (row.prevalentStroke ?? '') as string,
      prevalentHyp: (row.prevalentHyp ?? '') as string,
      diabetes: (row.diabetes ?? '') as string,
      age: (row.age ?? null) as number | null,
      cigsPerDay: (row.cigsPerDay ?? null) as number | null,
      totChol: (row.totChol ?? null) as number | null,
      sysBP: (row.sysBP ?? null) as number | null,
      BMI: (row.BMI ?? null) as number | null,
      heartRate: (row.heartRate ?? null) as number | null,
      glucose: (row.glucose ?? null) as number | null,
      pulsePressure: (row.pulsePressure ?? null) as number | null,
    };
    cleaned.push(finalized);
  });

  // Ensure only canonical keys in each row and all present
  // cleaned rows are already canonical by construction

  return { rows: cleaned, warnings, issues, headerMapping, extras };
}

export function cleanedCsv(rows: CanonicalRow[]): string {
  const csv = Papa.unparse(rows as unknown as Papa.UnparseObject<CanonicalRow>, { header: true, columns: CANONICAL as unknown as string[] });
  return csv;
}
