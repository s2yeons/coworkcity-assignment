"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, toApiError } from "@/lib/api";

type Settled<T> = {
  /** 어떤 요청(key + 재시도 횟수)의 결과인지 */
  token: string | null;
  data?: T;
  error?: ApiError;
};

export type ApiQueryResult<T> = {
  data: T | undefined;
  error: ApiError | undefined;
  isLoading: boolean;
  refetch: () => void;
};

/**
 * 이 기능 규모에 맞춘 최소한의 data-fetching 훅 (외부 상태 관리 라이브러리 없이).
 * - key가 바뀌면 이전 요청을 abort하고 다시 가져옵니다. key가 null이면 요청하지 않습니다.
 * - 로딩 여부는 "마지막으로 완료된 요청"과 "현재 요청"의 token 비교로 파생합니다.
 * - keepPreviousData: 검색 입력처럼 결과가 깜빡이지 않아야 할 때 이전 데이터를 유지합니다.
 */
export function useApiQuery<T>(
  key: string | null,
  fetcher: (signal: AbortSignal) => Promise<T>,
  options: { keepPreviousData?: boolean } = {},
): ApiQueryResult<T> {
  const { keepPreviousData = false } = options;
  const [settled, setSettled] = useState<Settled<T>>({ token: null });
  const [attempt, setAttempt] = useState(0);
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const token = key === null ? null : `${key}#${attempt}`;

  useEffect(() => {
    if (token === null) return;
    const controller = new AbortController();

    fetcherRef
      .current(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setSettled({ token, data });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setSettled((prev) => ({
          token,
          data: keepPreviousData ? prev.data : undefined,
          error: toApiError(error),
        }));
      });

    return () => controller.abort();
  }, [token, keepPreviousData]);

  const refetch = useCallback(() => setAttempt((n) => n + 1), []);
  const isCurrent = settled.token === token;

  return {
    data: token !== null && (isCurrent || keepPreviousData) ? settled.data : undefined,
    error: isCurrent ? settled.error : undefined,
    isLoading: token !== null && !isCurrent,
    refetch,
  };
}
