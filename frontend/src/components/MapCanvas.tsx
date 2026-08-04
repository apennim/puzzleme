import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// @ts-ignore
import * as turf from '@turf/turf';
import { LOCATIONS, GEOFENCE_BUFFER_METERS } from '../utils/constants';

interface Pin {
  id: string;
  lat: number;
  lng: number;
  title: string;
}

interface MapCanvasProps {
  matchedPins: Pin[];
  onAddPin?: (pin: Pin) => void;
}

const baseCenter = [25.0552, 121.5201] as const;

function MapCanvas({ matchedPins, onAddPin }: MapCanvasProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const [pressIndicator, setPressIndicator] = useState<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    const map = L.map(mapRef.current, {
      center: { lat: baseCenter[0], lng: baseCenter[1] },
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    leafletMapRef.current = map;

    // enable double-click on map to add a pin
    map.on('dblclick', (ev: L.LeafletMouseEvent) => {
      const lat = ev.latlng.lat;
      const lng = ev.latlng.lng;
      const pin: Pin = {
        id: `user-${Date.now()}`,
        lat,
        lng,
        title: '📍 雙擊點',
      };
      if (onAddPin) onAddPin(pin);
    });

    // long-press detection for touch/pointer devices with visual feedback
    let pressTimer: number | null = null;
    let pressStartPoint: L.LatLng | null = null;
    const container = map.getContainer();

    const onPointerDown = (ev: PointerEvent) => {
      if (ev.pointerType === 'mouse' && ev.button !== 2) return; // only right-click for mouse

      const rect = container.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      pressStartPoint = map.containerPointToLatLng(L.point(x, y));

      // 顯示長按進度指示器
      pressTimer = window.setTimeout(() => {
        if (!pressStartPoint) return;

        // 檢查是否在 SP 地理圍欄內
        const spPoint = turf.point([LOCATIONS.SP.lng, LOCATIONS.SP.lat]);
        const testPoint = turf.point([pressStartPoint.lng, pressStartPoint.lat]);
        const distance = turf.distance(spPoint, testPoint, { units: 'meters' });
        const isSP = distance <= GEOFENCE_BUFFER_METERS;

        // 生成標題
        let title = '📍 長按點';
        if (isSP) {
          title = `✨ ${LOCATIONS.SP.name}`;
        }

        const pin: Pin = {
          id: `user-${Date.now()}`,
          lat: pressStartPoint.lat,
          lng: pressStartPoint.lng,
          title,
        };
        if (onAddPin) onAddPin(pin);

        // 清除進度指示器
        if (pressIndicator) {
          pressIndicator.remove();
          setPressIndicator(null);
        }
      }, 600);
    };

    const clearPointer = () => {
      if (pressTimer) {
        window.clearTimeout(pressTimer);
        pressTimer = null;
      }
      if (pressIndicator) {
        pressIndicator.remove();
        setPressIndicator(null);
      }
      pressStartPoint = null;
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointerup', clearPointer);
    container.addEventListener('pointerleave', clearPointer);
    container.addEventListener('pointercancel', clearPointer);

    // right-click context menu for desktop
    container.addEventListener('contextmenu', (ev: MouseEvent) => {
      ev.preventDefault();
      const rect = container.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const point = map.containerPointToLatLng(L.point(x, y));

      // 檢查是否在 SP 地理圍欄內
      const spPoint = turf.point([LOCATIONS.SP.lng, LOCATIONS.SP.lat]);
      const testPoint = turf.point([point.lng, point.lat]);
      const distance = turf.distance(spPoint, testPoint, { units: 'meters' });
      const isSP = distance <= GEOFENCE_BUFFER_METERS;

      let title = '📍 右鍵點';
      if (isSP) {
        title = `✨ ${LOCATIONS.SP.name}`;
      }

      const pin: Pin = {
        id: `user-${Date.now()}`,
        lat: point.lat,
        lng: point.lng,
        title,
      };
      if (onAddPin) onAddPin(pin);
    });

    // cleanup listeners on unmount
    const cleanup = () => {
      map.off('dblclick');
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointerup', clearPointer);
      container.removeEventListener('pointerleave', clearPointer);
      container.removeEventListener('pointercancel', clearPointer);
      container.removeEventListener('contextmenu', onContextMenu);
    };

    const onContextMenu = (ev: MouseEvent) => {
      ev.preventDefault();
      const rect = container.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const point = map.containerPointToLatLng(L.point(x, y));

      // 檢查是否在 SP 地理圍欄內
      const spPoint = turf.point([LOCATIONS.SP.lng, LOCATIONS.SP.lat]);
      const testPoint = turf.point([point.lng, point.lat]);
      const distance = turf.distance(spPoint, testPoint, { units: 'meters' });
      const isSP = distance <= GEOFENCE_BUFFER_METERS;

      let title = '📍 右鍵點';
      if (isSP) {
        title = `✨ ${LOCATIONS.SP.name}`;
      }

      const pin: Pin = {
        id: `user-${Date.now()}`,
        lat: point.lat,
        lng: point.lng,
        title,
      };
      if (onAddPin) onAddPin(pin);
    };

    container.addEventListener('contextmenu', onContextMenu);

    L.marker({ lat: baseCenter[0], lng: baseCenter[1] }, {
      icon: L.divIcon({
        className: 'base-marker',
        html: '<div class="base-pin">起點</div>',
      }),
    }).addTo(map);

    L.marker([25.0563, 121.5076], {
      icon: L.divIcon({
        className: 'base-marker-end',
        html: '<div class="base-pin">終點</div>',
      }),
    }).addTo(map);
    return cleanup;
  }, [onAddPin]);

  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    matchedPins.forEach((pin) => {
      const iconHtml = `<div class="match-pin">${pin.title}</div>`;

      const marker = L.marker([pin.lat, pin.lng], {
        icon: L.divIcon({
          className: 'match-marker',
          html: iconHtml,
        }),
      }).addTo(map);
      markersRef.current[pin.id] = marker;
    });

    if (matchedPins.length > 0) {
      const bounds = L.latLngBounds(matchedPins.map((pin) => [pin.lat, pin.lng] as const));
      bounds.extend([baseCenter[0], baseCenter[1]]);
      bounds.extend([25.0563, 121.5076]);
      map.fitBounds(bounds.pad(0.25));
    }
  }, [matchedPins]);

  return (
    <section className="card">
      <div className="card-header">
        <h2>Map Canvas</h2>
        <p>滑卡右滑後，系統會即時注入 Pin 點到地圖。</p>
      </div>
      <div className="card-body">
        <div ref={mapRef} className="map-canvas" />
      </div>
    </section>
  );
}

export default MapCanvas;
