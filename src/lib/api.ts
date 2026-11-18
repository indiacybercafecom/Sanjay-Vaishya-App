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

export async function downloadProtectedFile(url: string, fallbackFilename: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(url, {
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    let message = `Unable to download file (${response.status})`;
    try {
      const errJson = (await response.json()) as { error?: string };
      if (errJson.error) message = errJson.error;
    } catch {
      // Ignore parse failure
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = /filename="?([^"]+)"?/i.exec(disposition);
  const filename = match?.[1] || fallbackFilename || 'attachment';

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
