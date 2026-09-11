import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MAX_DIMENSION, sniffImage, validateImage } from "./image-validation";

function png(width: number, height: number): Buffer {
  const b = Buffer.alloc(40);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0);
  b.writeUInt32BE(13, 8);
  b.write("IHDR", 12, "ascii");
  b.writeUInt32BE(width, 16);
  b.writeUInt32BE(height, 20);
  return b;
}
function jpeg(width: number, height: number): Buffer {
  // SOI, APP0(짧게), SOF0
  const app0 = Buffer.from([0xff, 0xe0, 0x00, 0x04, 0x00, 0x00]);
  const sof = Buffer.alloc(2 + 2 + 5 + 2 + 2);
  sof.set([0xff, 0xc0], 0);
  sof.writeUInt16BE(11, 2);
  sof[4] = 8;
  sof.writeUInt16BE(height, 5);
  sof.writeUInt16BE(width, 7);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sof, Buffer.from([0xff, 0xda])]);
}
function webpVp8x(width: number, height: number): Buffer {
  const b = Buffer.alloc(32);
  b.write("RIFF", 0, "ascii");
  b.write("WEBP", 8, "ascii");
  b.write("VP8X", 12, "ascii");
  b.writeUIntLE(width - 1, 24, 3);
  b.writeUIntLE(height - 1, 27, 3);
  return b;
}

describe("sniffImage (매직 바이트로 형식·크기 판별)", () => {
  it("PNG / JPEG / WEBP 헤더에서 크기를 읽음", () => {
    assert.deepEqual(sniffImage(png(1240, 1754)), { type: "image/png", width: 1240, height: 1754 });
    assert.deepEqual(sniffImage(jpeg(1286, 1786)), { type: "image/jpeg", width: 1286, height: 1786 });
    assert.deepEqual(sniffImage(webpVp8x(800, 600)), { type: "image/webp", width: 800, height: 600 });
  });
  it("이미지가 아니면 null", () => {
    assert.equal(sniffImage(Buffer.from("hello world, definitely not an image")), null);
    assert.equal(sniffImage(Buffer.from("%PDF-1.4 ...")), null);
    assert.equal(sniffImage(Buffer.alloc(0)), null);
  });
});

describe("validateImage", () => {
  it("정상 이미지 통과", () => {
    const v = validateImage(png(1240, 1754), "image/png");
    assert.equal(v.ok, true);
  });
  it("Content-Type을 image/png로 속인 텍스트 → UNSUPPORTED_FILE_TYPE", () => {
    const v = validateImage(Buffer.from("<script>alert(1)</script>"), "image/png");
    assert.equal(v.ok, false);
    if (!v.ok) assert.equal(v.code, "UNSUPPORTED_FILE_TYPE");
  });
  it("선언 형식과 실제 형식 불일치 → 거부", () => {
    const v = validateImage(jpeg(100, 100), "image/png");
    assert.equal(v.ok, false);
  });
  it("과대 크기 (디컴프레션 폭탄) → IMAGE_TOO_LARGE", () => {
    const v = validateImage(png(MAX_DIMENSION + 1, 100), "image/png");
    assert.equal(v.ok, false);
    if (!v.ok) assert.equal(v.code, "IMAGE_TOO_LARGE");
    const v2 = validateImage(png(5000, 5000), "image/png"); // 25MP > 20MP
    assert.equal(v2.ok, false);
  });
});
