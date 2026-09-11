/** 카카오맵 JavaScript SDK 로더. 여러 컴포넌트가 동시에 불러도 스크립트는 한 번만 삽입합니다. */

export const KAKAO_MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type KakaoNS = any;
declare global {
  interface Window {
    kakao?: { maps: KakaoNS };
  }
}

let loading: Promise<KakaoNS> | null = null;

export function loadKakaoMaps(): Promise<KakaoNS> {
  if (typeof window === "undefined") return Promise.reject(new Error("server"));
  if (window.kakao?.maps?.Map) return Promise.resolve(window.kakao.maps);
  if (!KAKAO_MAP_KEY) return Promise.reject(new Error("NO_KEY"));
  if (loading) return loading;

  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(KAKAO_MAP_KEY)}&autoload=false`;
    script.async = true;
    script.onload = () => {
      if (!window.kakao?.maps) return reject(new Error("SDK_INVALID"));
      window.kakao.maps.load(() => resolve(window.kakao!.maps));
    };
    script.onerror = () => {
      loading = null;
      reject(new Error("SDK_LOAD_FAILED"));
    };
    document.head.appendChild(script);
  });
  return loading;
}
