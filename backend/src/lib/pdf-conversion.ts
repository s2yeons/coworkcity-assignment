import { pdf } from "pdf-to-img";
import { HttpError } from "./http";

/** 매직 바이트로 PDF 여부를 판별합니다 (Content-Type은 클라이언트가 임의로 보낼 수 있어 신뢰하지 않습니다). */
export function isPdf(buf: Buffer): boolean {
  return buf.length >= 5 && buf.toString("ascii", 0, 5) === "%PDF-";
}

/**
 * PDF의 첫 페이지를 PNG 버퍼로 변환합니다.
 * OCR(tesseract.js)은 래스터 이미지만 처리할 수 있어, PDF로 올라온 등록증은 이 변환을 거쳐야 합니다.
 * scale: 2 로 렌더링해 인쇄용 저해상도 PDF도 OCR에 충분한 해상도를 확보합니다.
 */
export async function convertPdfFirstPageToPng(buffer: Buffer): Promise<Buffer> {
  let doc: Awaited<ReturnType<typeof pdf>> | undefined;
  try {
    doc = await pdf(buffer, { scale: 2 });
    if (doc.length < 1) {
      throw new HttpError(400, "PDF_EMPTY", "PDF에 페이지가 없어요.");
    }
    return await doc.getPage(1);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "PDF_CONVERSION_FAILED", "PDF를 읽지 못했어요. 손상되지 않은 파일인지 확인하거나 이미지로 다시 시도해주세요.");
  } finally {
    await doc?.destroy();
  }
}
