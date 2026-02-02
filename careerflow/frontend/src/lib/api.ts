import { supabase } from './supabase';

const API_BASE_URL = 'http://localhost:3001';

interface ApiOptions extends RequestInit {
    skipAuth?: boolean;
}

/**
 * Make an authenticated API request
 * Automatically attaches the Supabase session token to the request
 */
export async function apiClient<T = any>(
    endpoint: string,
    options: ApiOptions = {}
): Promise<T> {
    const { skipAuth = false, ...fetchOptions } = options;

    const headers: Record<string, string> = {
        ...(fetchOptions.headers as Record<string, string> || {}),
    };

    // Add auth token if not skipped
    if (!skipAuth) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        }
    }

    // Set content-type for JSON requests (unless it's FormData)
    if (fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) {
        return {} as T;
    }

    // Handle non-JSON responses (like PDF)
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
        return response as unknown as T;
    }

    return JSON.parse(text);
}

/**
 * GET request helper
 */
export async function apiGet<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    return apiClient<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request helper
 */
export async function apiPost<T = any>(
    endpoint: string,
    body?: any,
    options: ApiOptions = {}
): Promise<T> {
    return apiClient<T>(endpoint, {
        ...options,
        method: 'POST',
        body: body instanceof FormData ? body : JSON.stringify(body),
    });
}

/**
 * PATCH request helper
 */
export async function apiPatch<T = any>(
    endpoint: string,
    body?: any,
    options: ApiOptions = {}
): Promise<T> {
    return apiClient<T>(endpoint, {
        ...options,
        method: 'PATCH',
        body: JSON.stringify(body),
    });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    return apiClient<T>(endpoint, { ...options, method: 'DELETE' });
}

/**
 * Fetch PDF and return as blob URL
 */
export async function apiGetPdf(endpoint: string, body?: any): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body || {}),
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

export default apiClient;
