const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** 백엔드 API 오류. status 0은 네트워크 오류입니다. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError(0, "UNKNOWN_ERROR", error instanceof Error ? error.message : "알 수 없는 오류가 발생했어요.");
}

/**
 * 백엔드 응답 규약 { data } / { error: { code, message } } 를 해석합니다.
 * 성공 시 data만 반환하고, 실패 시 ApiError를 던집니다.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "NETWORK_ERROR", "서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.");
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.error?.code ?? "UNKNOWN_ERROR",
      body?.error?.message ?? `요청에 실패했어요. (${res.status})`,
      body?.error?.details,
    );
  }
  return body.data as T;
}
