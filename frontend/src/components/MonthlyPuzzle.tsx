import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useProfile } from '../hooks/useProfile';
import { useTrips, type TripPerson } from '../hooks/useTrips';
import { buildMonthlyRecap, type RecapPlace } from '../lib/monthlyRecap';

const PIECE = 100; // 每片拼圖的大小（SVG 座標單位）
const TAB = 22; // 凸出去的拼圖頭最多超出幾單位

/**
 * 畫一片拼圖的外框。四個邊各自是：0 平邊、1 凸出、-1 凹進。
 * 每個邊用「沿著邊的位置 u（0～1）」和「往外的距離 v」描述拼圖頭的形狀，再換算成實際座標。
 */
function piecePath(x: number, y: number, edges: [number, number, number, number]): string {
  // 依順時針：上（往右走）、右（往下走）、下（往左走）、左（往上走），以及每個邊往外的方向
  const sides = [
    { from: [x, y], to: [x + PIECE, y], out: [0, -1] },
    { from: [x + PIECE, y], to: [x + PIECE, y + PIECE], out: [1, 0] },
    { from: [x + PIECE, y + PIECE], to: [x, y + PIECE], out: [0, 1] },
    { from: [x, y + PIECE], to: [x, y], out: [-1, 0] },
  ];
  // 拼圖頭的形狀（u 沿著邊、v 往外，單位是一片的邊長）
  const knob = [
    [0.37, 0],
    [0.4, 0.02, 0.3, 0.22, 0.5, 0.22],
    [0.7, 0.22, 0.6, 0.02, 0.63, 0],
  ];
  let d = `M ${x} ${y}`;
  sides.forEach((side, i) => {
    const sign = edges[i];
    const pt = (u: number, v: number) => {
      const px = side.from[0] + (side.to[0] - side.from[0]) * u + side.out[0] * v * PIECE * sign;
      const py = side.from[1] + (side.to[1] - side.from[1]) * u + side.out[1] * v * PIECE * sign;
      return `${px.toFixed(1)} ${py.toFixed(1)}`;
    };
    if (sign !== 0) {
      d += ` L ${pt(knob[0][0], knob[0][1])}`;
      for (const c of knob.slice(1)) d += ` C ${pt(c[0], c[1])} ${pt(c[2], c[3])} ${pt(c[4], c[5])}`;
    }
    d += ` L ${pt(1, 0)}`;
  });
  return `${d} Z`;
}

/** 本月景點組成的照片拼圖；點一片可以看是哪裡、跟誰去 */
function PuzzleBoard({ places, onSelect, selected }: { places: RecapPlace[]; onSelect: (order: number) => void; selected: number | null }) {
  const cols = places.length <= 4 ? 2 : 3;
  const rows = Math.ceil(places.length / cols);
  const width = cols * PIECE + TAB * 2;
  const height = rows * PIECE + TAB * 2;
  const exists = (r: number, c: number) => r >= 0 && c >= 0 && c < cols && r * cols + c < places.length;
  // 相鄰兩片共用一條邊：這片凸出，鄰居就凹進（用位置算出固定的凹凸，不會每次重畫都變）
  const hEdge = (r: number, c: number) => ((r * 7 + c * 3) % 2 === 0 ? 1 : -1); // 第 r 列和 r+1 列之間
  const vEdge = (r: number, c: number) => ((r * 5 + c * 11) % 2 === 0 ? 1 : -1); // 第 c 欄和 c+1 欄之間

  // 每片的位置和外框只算一次，照片裁切和描邊共用同一條路徑
  const pieces = places.map((place, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const edges: [number, number, number, number] = [
      exists(r - 1, c) ? -hEdge(r - 1, c) : 0,
      exists(r, c + 1) ? vEdge(r, c) : 0,
      exists(r + 1, c) ? hEdge(r, c) : 0,
      exists(r, c - 1) ? -vEdge(r, c - 1) : 0,
    ];
    const x = TAB + c * PIECE;
    const y = TAB + r * PIECE;
    return { place, x, y, d: piecePath(x, y, edges) };
  });

  return (
    <svg className="puzzle-board" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`本月 ${places.length} 個景點組成的拼圖`}>
      <defs>
        {pieces.map(({ place, d }) => (
          <clipPath id={`puzzle-piece-${place.order}`} key={place.order}>
            <path d={d} />
          </clipPath>
        ))}
      </defs>
      {pieces.map(({ place, x, y, d }) => {
        const clip = `url(#puzzle-piece-${place.order})`;
        const isSelected = selected === place.order;
        return (
          <g key={place.order} className="puzzle-piece" onClick={() => onSelect(place.order)} role="button" aria-label={`第 ${place.order} 站：${place.title}`}>
            {/* 照片的範圍比格子大一圈，凸出去的拼圖頭才有照片 */}
            <rect x={x - TAB} y={y - TAB} width={PIECE + TAB * 2} height={PIECE + TAB * 2} fill="#e8dcd8" clipPath={clip} />
            {place.image && (
              <image
                href={place.image}
                x={x - TAB}
                y={y - TAB}
                width={PIECE + TAB * 2}
                height={PIECE + TAB * 2}
                preserveAspectRatio="xMidYMid slice"
                clipPath={clip}
              />
            )}
            <path d={d} className={isSelected ? 'puzzle-piece-outline is-selected' : 'puzzle-piece-outline'} />
            <circle cx={x + 18} cy={y + 18} r={12} className="puzzle-piece-badge" />
            <text x={x + 18} y={y + 22.5} textAnchor="middle" className="puzzle-piece-number">
              {place.order}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** 地圖：依順序把景點連成路線，標記上的數字對應拼圖片的編號 */
function RouteMap({ places }: { places: RecapPlace[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const located = places.filter((p) => p.lat != null && p.lng != null);
  // 景點或座標變了才重畫地圖（陣列每次渲染都是新的，所以比對內容組成的字串）
  const routeKey = located.map((p) => `${p.order}:${p.lat},${p.lng}`).join('|');

  useEffect(() => {
    if (!ref.current || located.length === 0) return;
    const map = L.map(ref.current, { zoomControl: false, attributionControl: false, scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    const points = located.map((p) => L.latLng(p.lat!, p.lng!));
    L.polyline(points, { color: '#315a66', weight: 4, opacity: 0.85, dashArray: '8 6' }).addTo(map);
    located.forEach((p) => {
      L.marker([p.lat!, p.lng!], {
        icon: L.divIcon({ className: 'route-marker', html: `<span>${p.order}</span>`, iconSize: [28, 28], iconAnchor: [14, 14] }),
        title: p.title,
      }).addTo(map);
    });
    map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 16 });
    return () => {
      map.remove();
    };
  }, [routeKey]);

  if (located.length === 0) return null;
  return <div ref={ref} className="route-map" aria-label="本月路線地圖" />;
}

function SmallAvatar({ person }: { person: TripPerson }) {
  return person.avatarUrl ? (
    <img className="puzzle-avatar" src={person.avatarUrl} alt="" />
  ) : (
    <span className="puzzle-avatar puzzle-avatar-initial">{person.nickname.slice(0, 1)}</span>
  );
}

/** 每月路線拼圖頁：照片拼圖＋路線地圖＋這個月和誰一起出門 */
function MonthlyPuzzle({ onClose }: { onClose: () => void }) {
  const { userId } = useProfile();
  const { trips, loading } = useTrips(userId);
  const recap = useMemo(() => buildMonthlyRecap(trips, userId ?? ''), [trips, userId]);
  const [selected, setSelected] = useState<number | null>(null);
  const selectedPlace = recap.places.find((p) => p.order === selected);

  return (
    <section className="card monthly-puzzle">
      <div className="monthly-puzzle-header">
        <button type="button" className="back-btn" onClick={onClose} aria-label="返回">
          ‹
        </button>
        <div>
          <h2>{recap.month} 月路線拼圖</h2>
          <p>這個月和朋友一起走過的地方</p>
        </div>
      </div>

      {loading ? (
        <p className="friend-trip-empty">拼圖拼湊中…</p>
      ) : recap.places.length === 0 ? (
        <p className="friend-trip-empty">這個月還沒有和朋友一起出門，邀請好友來一趟行程，月底就能拼出你的路線拼圖！</p>
      ) : (
        <>
          <div className="monthly-puzzle-board">
            <PuzzleBoard places={recap.places} selected={selected} onSelect={(o) => setSelected(o === selected ? null : o)} />
          </div>
          <p className="monthly-puzzle-caption" aria-live="polite">
            {selectedPlace ? (
              <>
                <strong>
                  {selectedPlace.order}. {selectedPlace.title}
                </strong>
                {selectedPlace.companions.length > 0 && <>　和 {selectedPlace.companions.map((p) => p.nickname).join('、')}</>}
              </>
            ) : (
              '點一片拼圖，看看是哪裡、跟誰去'
            )}
          </p>

          <div className="monthly-puzzle-stats">
            <div>
              <strong>{recap.trips.length}</strong>
              <span>趟行程</span>
            </div>
            <div>
              <strong>{recap.places.length}</strong>
              <span>個景點</span>
            </div>
            <div>
              <strong>{recap.totalKm.toFixed(1)}</strong>
              <span>公里路線</span>
            </div>
          </div>

          <RouteMap places={recap.places} />

          {recap.companions.length > 0 && (
            <div className="monthly-puzzle-friends">
              <p className="monthly-puzzle-section-title">一起出門的朋友</p>
              {recap.companions.map(({ person, count }) => (
                <div className="monthly-puzzle-friend" key={person.userId}>
                  <SmallAvatar person={person} />
                  <span>{person.nickname}</span>
                  <em>{count} 次</em>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default MonthlyPuzzle;
