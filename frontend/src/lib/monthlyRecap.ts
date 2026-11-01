import type { Trip, TripPerson } from '../hooks/useTrips';

/**
 * 每月路線拼圖：每個月 27 日到月底，自動統計這個月「和朋友一起出門」的共享行程，
 * 把去過的景點依時間排成一條路線。
 *
 * 不需要伺服器排程：使用者在 27～31 日打開 App 時，直接用已經讀到的行程資料當場算出來。
 * 只算「真的有和朋友一起」的行程：自己發起且至少一位朋友按了 Join!，或自己加入了別人的行程。
 */

/** 每月從幾號開始顯示拼圖 */
export const RECAP_START_DAY = 27;

/** 今天是不是拼圖開放的日子（27 日～月底）。網址加上 ?recap=1 可以在其他日子預覽，方便測試 */
export function isRecapWindow(now = new Date()): boolean {
  if (new URLSearchParams(window.location.search).has('recap')) return true;
  return now.getDate() >= RECAP_START_DAY;
}

export interface RecapPlace {
  /** 在整條路線上的順序，從 1 開始 */
  order: number;
  title: string;
  image: string;
  lat: number | null;
  lng: number | null;
  tripId: string;
  /** 這個景點那趟行程，和誰一起去（不含自己） */
  companions: TripPerson[];
}

export interface RecapTrip {
  trip: Trip;
  companions: TripPerson[];
}

export interface MonthlyRecap {
  year: number;
  /** 1～12 */
  month: number;
  trips: RecapTrip[];
  places: RecapPlace[];
  /** 一起出門的朋友，次數多的排前面 */
  companions: { person: TripPerson; count: number }[];
  /** 依路線順序把有座標的景點連起來的總距離（公里，直線距離） */
  totalKm: number;
}

/** 兩點間的直線距離（公里），用 Haversine 公式：把地球當成球體，算球面上兩點的大圓距離 */
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371; // 地球平均半徑（公里）
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 這趟行程和誰一起去：已加入的人＋發起人，扣掉自己 */
function companionsOf(trip: Trip, userId: string): TripPerson[] {
  const people = [trip.organizer, ...trip.members.filter((m) => m.status === 'joined')];
  return people.filter((p) => p.userId !== userId);
}

export function buildMonthlyRecap(trips: Trip[], userId: string, now = new Date()): MonthlyRecap {
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthStart = new Date(year, month, 1).getTime();
  const monthEnd = new Date(year, month + 1, 1).getTime();

  const recapTrips: RecapTrip[] = trips
    .filter((t) => t.createdAt >= monthStart && t.createdAt < monthEnd)
    .filter((t) => t.myRole === 'joined' || (t.myRole === 'organizer' && t.members.some((m) => m.status === 'joined')))
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((trip) => ({ trip, companions: companionsOf(trip, userId) }));

  // 依時間順序攤平：每趟行程的起點，接著是成員新增的下一站
  const places: RecapPlace[] = [];
  for (const { trip, companions } of recapTrips) {
    const stops = [
      { title: trip.placeTitle, image: trip.placeImage, lat: trip.placeLat, lng: trip.placeLng },
      ...trip.stops.map((s) => ({ title: s.title, image: s.image, lat: s.lat, lng: s.lng })),
    ];
    for (const stop of stops) {
      places.push({ ...stop, order: places.length + 1, tripId: trip.id, companions });
    }
  }

  const counts = new Map<string, { person: TripPerson; count: number }>();
  for (const { companions } of recapTrips) {
    for (const person of companions) {
      const entry = counts.get(person.userId) ?? { person, count: 0 };
      entry.count += 1;
      counts.set(person.userId, entry);
    }
  }

  let totalKm = 0;
  const located = places.filter((p): p is RecapPlace & { lat: number; lng: number } => p.lat != null && p.lng != null);
  for (let i = 1; i < located.length; i++) totalKm += distanceKm(located[i - 1], located[i]);

  return {
    year,
    month: month + 1,
    trips: recapTrips,
    places,
    companions: [...counts.values()].sort((a, b) => b.count - a.count),
    totalKm,
  };
}
