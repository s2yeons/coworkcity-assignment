import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

/**
 * API 응답 규약
 * - 성공: { data: ... }
 * - 실패: { error: { code, message, details? } }
 */
export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ data });
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (message: string) => new HttpError(404, "NOT_FOUND", message);

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "요청한 리소스를 찾을 수 없습니다." } });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "요청 파라미터가 올바르지 않습니다.",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }
  // 요청 본문(업로드 이미지·OCR 결과 등 개인정보)은 로그에 남기지 않고 오류 자체만 기록합니다.
  console.error(err instanceof Error ? `${err.name}: ${err.message}` : err);
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
  });
}
