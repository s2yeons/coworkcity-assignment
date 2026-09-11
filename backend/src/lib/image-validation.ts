/**
 * 업로드 이미지 검증 (외부 라이브러리 없이 헤더만 읽음).
 * - Content-Type 헤더는 클라이언트가 임의로 보낼 수 있으므로 파일 시그니처(매직 바이트)로 실제 형식을 판별합니다.
 * - 이미지 크기(픽셀)를 디코딩 전에 확인해 디컴프레션 폭탄·OCR CPU 고갈을 막습니다.
 */

export type ImageType = "image/png" | "image/jpeg" | "image/webp";
export type ImageInfo = { type: ImageType; width: number; height: number };

export const MAX_DIMENSION = 6000; // px, 한 변
export const MAX_PIXELS = 20_000_000; // 20MP (A4 300dpi ≈ 8.7MP)

function sniffPng(buf: Buffer): ImageInfo | null {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buf.length < 24 || !sig.every((b, i) => buf[i] === b)) return null;
  if (buf.toString("ascii", 12, 16) !== "IHDR") return null;
  return { type: "image/png", width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function sniffJpeg(buf: Buffer): ImageInfo | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff) return null;
  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) return null;
    const marker = buf[offset + 1];
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01 || marker === 0xff) {
      offset += marker === 0xff ? 1 : 2;
      continue;
    }
    const length = buf.readUInt16BE(offset + 2);
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      return { type: "image/jpeg", height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
    }
    if (marker === 0xda) return null; // 스캔 시작 전까지 SOF가 없으면 비정상
    offset += 2 + length;
  }
  return null;
}

function sniffWebp(buf: Buffer): ImageInfo | null {
  if (buf.length < 30 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") return null;
  const chunk = buf.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    return {
      type: "image/webp",
      width: 1 + buf.readUIntLE(24, 3),
      height: 1 + buf.readUIntLE(27, 3),
    };
  }
  if (chunk === "VP8 ") {
    return { type: "image/webp", width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === "VP8L") {
    const bits = buf.readUInt32LE(21);
    return { type: "image/webp", width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

export function sniffImage(buf: Buffer): ImageInfo | null {
  return sniffPng(buf) ?? sniffJpeg(buf) ?? sniffWebp(buf);
}

export type ImageValidation =
  | { ok: true; info: ImageInfo }
  | { ok: false; code: "UNSUPPORTED_FILE_TYPE" | "IMAGE_TOO_LARGE"; message: string };

export function validateImage(buf: Buffer, declaredType?: string): ImageValidation {
  const info = sniffImage(buf);
  if (!info) {
    return { ok: false, code: "UNSUPPORTED_FILE_TYPE", message: "PNG, JPEG, WEBP 이미지 파일만 올릴 수 있어요. (파일 내용이 이미지가 아닙니다)" };
  }
  if (declaredType && declaredType !== info.type) {
    return { ok: false, code: "UNSUPPORTED_FILE_TYPE", message: "파일 형식이 확장자와 다릅니다. 원본 이미지를 그대로 올려주세요." };
  }
  if (info.width <= 0 || info.height <= 0) {
    return { ok: false, code: "UNSUPPORTED_FILE_TYPE", message: "이미지 크기를 읽을 수 없어요." };
  }
  if (info.width > MAX_DIMENSION || info.height > MAX_DIMENSION || info.width * info.height > MAX_PIXELS) {
    return {
      ok: false,
      code: "IMAGE_TOO_LARGE",
      message: `이미지가 너무 커요. 한 변 ${MAX_DIMENSION}px, 총 ${MAX_PIXELS / 1_000_000}MP 이하로 줄여서 올려주세요.`,
    };
  }
  return { ok: true, info };
}
