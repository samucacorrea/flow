export type ApiError = {
  message: string;
  code: string;
  details?: Record<string, unknown>;
};

// Use the frontend origin in production; Next.js proxies /api to Laravel.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as ApiError | null;
    const fallback: ApiError = {
      message: "Request failed.",
      code: "request_failed",
    };
    throw data || fallback;
  }

  return (await response.json()) as T;
}
