import { API_BASE_URL } from './apiConfig';
import { getFreshAccessToken, refreshAccessToken } from './auth/refresh';

export { API_BASE_URL };

type RequestOption = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /**
   * Send without a bearer token. For the endpoints that mint one — signing in,
   * registering, refreshing — where attaching a token would be circular.
   */
  anonymous?: boolean;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** The API's machine-readable code, e.g. `SESSION_REUSED`. */
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestOption = {},
): Promise<T> {
  const { method = 'GET', body, anonymous = false } = options;

  const send = (accessToken: string | null) =>
    fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  if (anonymous) return unwrap<T>(await send(null));

  let response = await send(await getFreshAccessToken());

  // The token looked live but the API disagreed — a clock skew, a restart, or
  // a token revoked mid-flight. One rotation, one retry, then give up.
  if (response.status === 401) {
    const retryToken = await refreshAccessToken();

    if (retryToken) response = await send(retryToken);
  }

  return unwrap<T>(response);
}

async function unwrap<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'Request failed';
    let code: string | undefined;

    try {
      const error = await response.json();

      if (typeof error.message === 'string') message = error.message;
      if (typeof error.error === 'string') code = error.error;
    } catch {
      // Response bukan JSON
    }

    throw new ApiError(response.status, message, code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
