"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { loadKakaoMaps, type KakaoNS } from "@/lib/kakao-map";

export type MapPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** 추천 순위. 없으면 점 마커 */
  rank?: number;
  /** 선택 조건 모두 충족 등 강조 */
  emphasized?: boolean;
};

type Props = {
  pins: MapPin[];
  activeId?: string | null;
  onPinClick?: (id: string) => void;
  className?: string;
  /** 단일 지점 상세용: 줌 고정 */
  zoom?: number;
};

/**
 * 카카오맵 위에 추천 지점을 순위 마커로 표시합니다.
 * SDK 로드 실패·키 없음·좌표 없음이면 안내만 보여주고 나머지 화면은 영향받지 않습니다.
 */
export function OfficeMap({ pins, activeId, onPinClick, className, zoom }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoNS | null>(null);
  const overlaysRef = useRef<Map<string, KakaoNS>>(new Map());
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const validPins = pins.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

  // SDK 로드 + 지도 생성 (1회)
  useEffect(() => {
    let cancelled = false;
    loadKakaoMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        const first = validPins[0];
        const center = new maps.LatLng(first?.lat ?? 37.5665, first?.lng ?? 126.978);
        mapRef.current = new maps.Map(containerRef.current, { center, level: zoom ?? 7 });
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 마커 갱신
  useEffect(() => {
    const maps = window.kakao?.maps;
    const map = mapRef.current;
    if (status !== "ready" || !maps || !map) return;

    for (const overlay of overlaysRef.current.values()) overlay.setMap(null);
    overlaysRef.current.clear();
    if (validPins.length === 0) return;

    const bounds = new maps.LatLngBounds();
    for (const pin of validPins) {
      const position = new maps.LatLng(pin.lat, pin.lng);
      bounds.extend(position);
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", `${pin.name}${pin.rank ? ` (추천 ${pin.rank})` : ""}`);
      el.dataset.pinId = pin.id;
      el.className = "office-pin";
      const label = document.createElement("span");
      label.textContent = pin.rank ? String(pin.rank) : "";
      el.appendChild(label);
      el.addEventListener("click", () => onPinClick?.(pin.id));
      const overlay = new maps.CustomOverlay({ position, content: el, yAnchor: 1.15, zIndex: pin.emphasized ? 3 : 2 });
      overlay.setMap(map);
      overlaysRef.current.set(pin.id, overlay);
    }
    if (validPins.length > 1) map.setBounds(bounds, 48, 48, 48, 48);
    else {
      map.setCenter(new maps.LatLng(validPins[0].lat, validPins[0].lng));
      map.setLevel(zoom ?? 5);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, JSON.stringify(validPins.map((p) => [p.id, p.lat, p.lng, p.rank, p.emphasized]))]);

  // 활성 마커 강조
  useEffect(() => {
    for (const [id, overlay] of overlaysRef.current) {
      const el = overlay.getContent() as HTMLElement;
      el.classList.toggle("is-active", id === activeId);
      const pin = validPins.find((p) => p.id === id);
      el.classList.toggle("is-emphasized", Boolean(pin?.emphasized));
    }
  }, [activeId, status, validPins]);

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-line bg-surface", className)}>
      <div ref={containerRef} className="absolute inset-0" aria-label="지점 위치 지도" role="region" />
      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-ink-3" role="status">
          {status === "loading" ? "지도를 불러오는 중" : "지도를 불러오지 못했어요. 목록으로 계속 확인할 수 있어요."}
        </div>
      )}
      {status === "ready" && validPins.length === 0 && (
        <div className="absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-white/90 px-3 py-1 text-xs text-ink-2">표시할 위치 정보가 없어요</div>
      )}
    </div>
  );
}
