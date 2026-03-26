/**
 * API client for calling the FastAPI backend.
 * Automatically attaches Supabase JWT tokens to requests.
 */

import { supabase } from './supabase';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

if (!BACKEND_URL) {
  console.warn('VITE_BACKEND_URL is not set. Backend API calls will fail.');
}

/**
 * Make an authenticated POST request to the backend.
 * Automatically attaches the user's Supabase JWT token.
 */
export async function apiPost<T>(
  path: string,
  body: unknown,
  options?: { signal?: AbortSignal }
): Promise<T> {
  // Get the current session to extract the JWT token
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const url = `${BACKEND_URL}${path}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
    signal: options?.signal,
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    let errorData: any = { error: response.statusText };

    if (contentType?.includes('application/json')) {
      try {
        errorData = await response.json();
      } catch {
        // If JSON parsing fails, keep the default error
      }
    }

    const error = new Error(errorData.error || errorData.message || 'API error');
    (error as any).status = response.status;
    (error as any).statusCode = response.status;
    if (errorData.retry_after) {
      (error as any).retry_after = errorData.retry_after;
    }
    throw error;
  }

  return response.json() as Promise<T>;
}

/**
 * Make an authenticated PATCH request to the backend.
 */
export async function apiPatch<T>(
  path: string,
  body: unknown,
  options?: { signal?: AbortSignal }
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const url = `${BACKEND_URL}${path}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
    signal: options?.signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    const error = new Error(errorData.error);
    (error as any).status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
}

/**
 * Make an authenticated GET request to the backend.
 */
export async function apiGet<T>(
  path: string,
  options?: { signal?: AbortSignal }
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const url = `${BACKEND_URL}${path}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
    signal: options?.signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    const error = new Error(errorData.error);
    (error as any).status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
}
