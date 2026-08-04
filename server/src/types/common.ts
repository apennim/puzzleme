/**
 * 後端共通類型
 */

export interface Pin {
  id: string;
  lat: number;
  lng: number;
  title: string;
  distance?: number;
  isSP?: boolean;
}

export interface Route {
  id: string;
  name: string;
  pins: Pin[];
  description: string;
}

export interface Theme {
  id: string;
  label: string;
  value: string;
}
