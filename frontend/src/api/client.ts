export class ApiClientError extends Error {
  status: number;
  detail: string;
  errors?: Array<{ loc: string[]; msg: string; type: string }>;

  constructor(status: number, detail: string, errors?: any[]) {
    super(detail);
    this.name = 'ApiClientError';
    this.status = status;
    this.detail = detail;
    this.errors = errors;
  }
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');
const API_KEY = import.meta.env.VITE_API_KEY;

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (API_KEY) {
    headers['X-API-Key'] = API_KEY;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError) {
    throw new ApiClientError(
      0,
      'Unable to connect to the StockWise API server. Please verify that the backend is running at ' + BASE_URL
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    let errorMessage = 'An unexpected API error occurred.';
    let validationErrors: any[] | undefined = undefined;

    if (data) {
      if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else if (Array.isArray(data.detail)) {
        // FastAPI default validation format
        errorMessage = data.detail.map((d: any) => `${d.loc?.join('.') || 'field'}: ${d.msg}`).join(', ');
        validationErrors = data.detail;
      } else if (data.errors && Array.isArray(data.errors)) {
        // Our custom formatted validation errors
        errorMessage = data.detail || 'Input validation failed.';
        validationErrors = data.errors;
      }
    } else {
      errorMessage = response.statusText || `Request failed with status ${response.status}`;
    }

    throw new ApiClientError(response.status, errorMessage, validationErrors);
  }

  return data as T;
}
