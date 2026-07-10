import Constants from "expo-constants";

function resolveApiBase(): string {
  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
  const host = extra?.apiUrl ?? "";
  if (host) return `${host}/api`;
  // Fallback: same-origin in browser environments
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api`;
  }
  return "/api";
}

const API_BASE = resolveApiBase();

class ApiError extends Error {
  status: number;
  constructor(msg: string, status: number) {
    super(msg);
    this.status = status;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const url = `${API_BASE}${path}`;
  const opts: RequestInit = {
    method,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok) throw new ApiError(data.error ?? `HTTP ${res.status}`, res.status);
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  del: (path: string) => request<void>("DELETE", path),
};

export { API_BASE };
