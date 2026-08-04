import React from 'react';

interface Pin { id: string; lat: number; lng: number; title: string }

interface TimelineProps {
  pins: Pin[];
  visible: boolean;
  onClose: () => void;
}

export default function Timeline({ pins, visible, onClose }: TimelineProps) {
  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 'min(720px, 96%)', maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 12, boxShadow: '0 30px 80px rgba(0,0,0,0.2)', padding: 20 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>時空膠囊 — 行程回顧</h3>
          <button onClick={onClose} style={{ padding: '6px 10px' }}>關閉</button>
        </header>
        <ol style={{ marginTop: 12 }}>
          {pins.length === 0 && <li>尚未有解鎖的 Pin 點</li>}
          {pins.map((p, i) => (
            <li key={p.id} style={{ padding: 12, borderRadius: 8, background: i % 2 ? '#fafafa' : '#fff', marginBottom: 8 }}>
              <strong>{p.title}</strong>
              <div>經緯度：{p.lat.toFixed(6)}, {p.lng.toFixed(6)}</div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
