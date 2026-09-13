/**
 * tesseract.js 기반 OCR. 워커를 한 번만 만들어 재사용합니다.
 * 학습 데이터(kor, eng)는 backend/tessdata 에 포함되어 있어 네트워크 없이 동작합니다.
 * 업로드된 이미지는 메모리에서만 처리되고 디스크에 저장하지 않습니다.
 */
import path from "node:path";
import { createWorker, OEM, PSM, type Worker } from "tesseract.js";

const TESSDATA_DIR = path.resolve(__dirname, "../../tessdata");
export const OCR_ENGINE = "tesseract.js 7 (kor+eng, LSTM)";

let workerPromise: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker(["kor", "eng"], OEM.LSTM_ONLY, {
        langPath: TESSDATA_DIR,
        cachePath: TESSDATA_DIR,
        gzip: false,
      });
      // 사업자등록증은 세로로 흐르는 단일 컬럼 문서라 SINGLE_COLUMN이 표(업태/종목) 정렬을 가장 잘 보존합니다.
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_COLUMN,
        preserve_interword_spaces: "1",
      });
      return worker;
    })().catch((error) => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

export type OcrResult = {
  text: string;
  /** 0~100 */
  confidence: number;
  durationMs: number;
};

export async function recognizeImage(image: Buffer): Promise<OcrResult> {
  const worker = await getWorker();
  const started = Date.now();
  const { data } = await worker.recognize(image);
  return { text: data.text, confidence: Math.round(data.confidence), durationMs: Date.now() - started };
}

/** 서버 시작 시 미리 초기화해 첫 요청의 1~2초 지연을 없앱니다 (실패해도 요청 시 다시 시도) */
export function warmupOcr(): void {
  getWorker()
    .then(() => console.log("🔎 OCR worker ready"))
    .catch((error) => console.warn("OCR warmup failed (will retry on first request):", error instanceof Error ? error.message : error));
}
