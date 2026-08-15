const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const SESSION_KEY = 'stoners_api_session';

export const getApiSessionToken = (): string => sessionStorage.getItem(SESSION_KEY) || '';
export const setApiSessionToken = (token: string): void => sessionStorage.setItem(SESSION_KEY, token);
export const clearApiSessionToken = (): void => sessionStorage.removeItem(SESSION_KEY);

export const apiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const sessionToken = getApiSessionToken();
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    if (response.status === 401 && !path.startsWith('/api/auth/')) {
      clearApiSessionToken();
      window.dispatchEvent(new Event('stoners-session-expired'));
    }
    throw new Error(body?.error || `La API respondió con estado ${response.status}`);
  }

  return response.json() as Promise<T>;
}
