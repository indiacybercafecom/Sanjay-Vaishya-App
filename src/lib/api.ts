import { firebaseAuth } from '../firebase/config';

export async function getAuthHeaders(extra: Record<string, string> = {}): Promise<Record<string, string>> {
  const headers: Record<string, string> = { ...extra };
  const currentUser = firebaseAuth.currentUser;
  if (currentUser && !headers.Authorization) {
    try {
      const token = await currentUser.getIdToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Proceed without token when unavailable
    }
  }
  return headers;
}

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const baseHeaders: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...((options.headers as Record<string, string>) || {}),
  };

  const headers = await getAuthHeaders(baseHeaders);

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  const text = await response.text();
  let data: Record<string, unknown> = {};
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = { error: text };
    }
  }

  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `Request failed (${response.status})`);
  }

  return data as T;
}

export async function apiUpload<T>(url: string, formData: FormData): Promise<T> {
  return apiFetch<T>(url, {
    method: 'POST',
    body: formData,
  });
}
