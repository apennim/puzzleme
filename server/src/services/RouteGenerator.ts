/**
 * 路線生成服務
 */

import type { Route, Pin } from '../types/common';

/**
 * 路線生成器 - 根據主題生成預設路線
 */
export class RouteGenerator {
  /**
   * 根據主題生成 3 條預設路線
   */
  generateRoutes(theme: string): Route[] {
    const themeKey = theme.toLowerCase();

    if (themeKey.includes('老台北') || themeKey.includes('鐵窗花')) {
      return this.generateTaipeiHeritageRoutes();
    } else if (themeKey.includes('昭和') || themeKey.includes('復古')) {
      return this.generateShowaRetroRoutes();
    }

    return this.generateDefaultRoutes();
  }

  /**
   * 老台北主題路線
   */
  private generateTaipeiHeritageRoutes(): Route[] {
    return [
      {
        id: 'route-a-heritage',
        name: '方案 A - 古蹟巡禮',
        description: '造訪大稻埕最具代表性的古蹟建築',
        pins: [
          {
            id: 'pin-heritage-1',
            lat: 25.0545,
            lng: 121.5090,
            title: '老台北鐵窗花',
          },
          {
            id: 'pin-heritage-2',
            lat: 25.0558,
            lng: 121.5105,
            title: '霞海城隍廟',
          },
        ],
      },
      {
        id: 'route-b-heritage',
        name: '方案 B - 商業繁華',
        description: '重現大稻埕茶業與布業的繁榮商圈',
        pins: [
          {
            id: 'pin-heritage-3',
            lat: 25.0560,
            lng: 121.5115,
            title: '迪化街年貨大街',
          },
          {
            id: 'pin-heritage-4',
            lat: 25.0555,
            lng: 121.5110,
            title: '永樂市場古蹟',
          },
        ],
      },
      {
        id: 'route-c-heritage',
        name: '方案 C - 河濱漫步',
        description: '沿著淡水河畔感受悠閒的漫遊節奏',
        pins: [
          {
            id: 'pin-heritage-5',
            lat: 25.0563,
            lng: 121.5076,
            title: '大稻埕碼頭夕陽',
          },
          {
            id: 'pin-heritage-6',
            lat: 25.0565,
            lng: 121.5080,
            title: '河邊步道散步',
          },
        ],
      },
    ];
  }

  /**
   * 昭和復古主題路線
   */
  private generateShowaRetroRoutes(): Route[] {
    return [
      {
        id: 'route-a-retro',
        name: '方案 A - 文青咖啡之旅',
        description: '探尋老店咖啡的懷舊風情',
        pins: [
          {
            id: 'pin-retro-1',
            lat: 25.0550,
            lng: 121.5100,
            title: '昭和復古風 - 茶館',
          },
          {
            id: 'pin-retro-2',
            lat: 25.0552,
            lng: 121.5088,
            title: '老店懷舊咖啡',
          },
        ],
      },
      {
        id: 'route-b-retro',
        name: '方案 B - 巷弄尋寶',
        description: '漫遊充滿故事的老街小巷',
        pins: [
          {
            id: 'pin-retro-3',
            lat: 25.0540,
            lng: 121.5125,
            title: '陽光巷弄街景',
          },
          {
            id: 'pin-retro-4',
            lat: 25.0548,
            lng: 121.5085,
            title: '新藝街文創基地',
          },
        ],
      },
      {
        id: 'route-c-retro',
        name: '方案 C - 在地美食漫遊',
        description: '品嚐大稻埕在地特色小吃',
        pins: [
          {
            id: 'pin-retro-5',
            lat: 25.0545,
            lng: 121.5110,
            title: '夜市小吃廣場',
          },
          {
            id: 'pin-retro-6',
            lat: 25.0535,
            lng: 121.5120,
            title: '林家花園 - 古蹟',
          },
        ],
      },
    ];
  }

  /**
   * 預設路線（無特定主題）
   */
  private generateDefaultRoutes(): Route[] {
    return [
      {
        id: 'route-a-default',
        name: '方案 A - 初探大稻埕',
        pins: [
          {
            id: 'pin-default-1',
            lat: 25.0545,
            lng: 121.5090,
            title: '起點探索',
          },
          {
            id: 'pin-default-2',
            lat: 25.0563,
            lng: 121.5076,
            title: '終點景點',
          },
        ],
      },
      {
        id: 'route-b-default',
        name: '方案 B - 深度體驗',
        pins: [
          {
            id: 'pin-default-3',
            lat: 25.0550,
            lng: 121.5100,
            title: '中途景點',
          },
          {
            id: 'pin-default-4',
            lat: 25.0555,
            lng: 121.5110,
            title: '另一景點',
          },
        ],
      },
      {
        id: 'route-c-default',
        name: '方案 C - 輕鬆漫步',
        pins: [
          {
            id: 'pin-default-5',
            lat: 25.0540,
            lng: 121.5125,
            title: '周邊景色',
          },
          {
            id: 'pin-default-6',
            lat: 25.0565,
            lng: 121.5080,
            title: '河濱美景',
          },
        ],
      },
    ];
  }
}
