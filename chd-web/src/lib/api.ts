import { PredictIn, PredictOut, MetaOut, BatchPredictResponse } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // Use the raw error text if it's not JSON
      errorMessage = errorText || errorMessage;
    }
    
    throw new ApiError(response.status, errorMessage);
  }
  
  return response.json();
}

export async function fetchMeta(): Promise<MetaOut> {
  const response = await fetch(`${API_BASE}/api/v1/meta`);
  return handleResponse<MetaOut>(response);
}

export async function postPredict(data: PredictIn): Promise<PredictOut> {
  const response = await fetch(`${API_BASE}/api/v1/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  return handleResponse<PredictOut>(response);
}

export { ApiError };

export async function postBatchPredict(file: File, threshold = 0.3, preview = true, previewLimit = 100): Promise<BatchPredictResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const url = new URL(`${API_BASE}/batch/predict`);
  url.searchParams.set('threshold', String(threshold));
  url.searchParams.set('preview', String(preview));
  url.searchParams.set('preview_limit', String(previewLimit));

  const response = await fetch(url.toString(), {
    method: 'POST',
    body: formData,
  });
  return handleResponse<BatchPredictResponse>(response);
}

export function getBatchExportUrl(batchId: string, fmt: 'csv'|'xlsx'|'pdf'): string {
  const url = new URL(`${API_BASE}/batch/export`);
  url.searchParams.set('batch_id', batchId);
  url.searchParams.set('fmt', fmt);
  return url.toString();
}