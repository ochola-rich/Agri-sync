export const API_BASE = 'http://localhost:8080';
const TOKEN_KEY = 'agrisync-token';
const ROLE_KEY = 'agrisync-role';
const USER_ID_KEY = 'agrisync-userid';

export function getToken(): string | null { return localStorage.getItem(TOKEN_KEY); }
export function setToken(token: string) { localStorage.setItem(TOKEN_KEY, token); }
export function clearToken() { localStorage.removeItem(TOKEN_KEY); }

export function getStoredRole(): string | null { return localStorage.getItem(ROLE_KEY); }
export function setStoredRole(role: string) { localStorage.setItem(ROLE_KEY, role); }
export function clearStoredRole() { localStorage.removeItem(ROLE_KEY); }

export function getUserId(): string | null { return localStorage.getItem(USER_ID_KEY); }
export function setUserId(id: string) { localStorage.setItem(USER_ID_KEY, id); }
export function clearUserId() { localStorage.removeItem(USER_ID_KEY); }

export function authHeader(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function login(phone: string, password: string, role: 'farmer'|'collector'|'admin') {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password, role }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  const data = await res.json();
  if (data.token) setToken(data.token);
  if (data.role) setStoredRole(data.role);
  // backend returns userId per spec
  if (data.userId) setUserId(data.userId);
  // fallback if response nests user
  if (!data.userId && data.user?.id) setUserId(data.user.id);
  return data;
}

export async function signupFarmer(payload: { name: string; phone: string; password: string }) {
  const res = await fetch(`${API_BASE}/farmers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return await res.json();
}

export async function signupCollector(payload: { name: string; phone: string; password: string }) {
  const res = await fetch(`${API_BASE}/collectors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return await res.json();
}

/**
 * Fetch the current user's profile using stored role + userId.
 * Returns the profile object or null.
 */
export async function fetchProfile(): Promise<any | null> {
  const role = getStoredRole();
  const id = getUserId();
  if (!role || !id) return null;
  const path = role === 'farmer' ? `/farmers/${id}` : `/collectors/${id}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
  });
  if (!res.ok) return null;
  const json = await res.json();
  // spec: GET /farmers/:id returns { farmer: { ... } }
  if (json.farmer) return json.farmer;
  if (json.collector) return json.collector;
  return json;
}