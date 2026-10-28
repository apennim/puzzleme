import { useEffect, useRef, useState } from 'react';

/** 貼文照片統一裁成 4:5（直式），跟首頁貼文卡的比例一樣，裁到哪裡首頁就顯示到哪裡 */
export const POST_ASPECT = 4 / 5;
const OUTPUT_WIDTH = 1080;
const MAX_ZOOM = 3;

interface ImageCropperProps {
  /** 使用者選的原始照片（data URL 或 object URL） */
  src: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

interface Offset {
  x: number;
  y: number;
}

/**
 * 照片裁切視窗：拖曳移動照片、拉桿或滑鼠滾輪縮放，框內就是發布出去的畫面。
 *
 * 原理：框的大小固定，照片用「剛好蓋滿框」的倍率（baseScale）乘上使用者縮放（zoom）來顯示，
 * offset 是照片左上角相對於框左上角的位置。按下確認時，把框對應到原圖上的那一塊
 * 用 canvas 畫出來，輸出成 JPEG。
 */
function ImageCropper({ src, onCancel, onConfirm }: ImageCropperProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ pointerX: number; pointerY: number; start: Offset } | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [frame, setFrame] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  // 量框的實際大小（手機、電腦寬度不同）
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => setFrame({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const baseScale = natural && frame.w ? Math.max(frame.w / natural.w, frame.h / natural.h) : 1;
  const scale = baseScale * zoom;
  const displayW = natural ? natural.w * scale : 0;
  const displayH = natural ? natural.h * scale : 0;

  // 照片必須永遠蓋滿框，不能拖到露出空白
  const clamp = (next: Offset, w = displayW, h = displayH): Offset => ({
    x: Math.min(0, Math.max(frame.w - w, next.x)),
    y: Math.min(0, Math.max(frame.h - h, next.y)),
  });

  // 照片載入或框的大小改變時，先置中
  useEffect(() => {
    if (!natural || !frame.w) return;
    const s = Math.max(frame.w / natural.w, frame.h / natural.h);
    setZoom(1);
    setOffset({ x: (frame.w - natural.w * s) / 2, y: (frame.h - natural.h * s) / 2 });
  }, [natural, frame.w, frame.h]);

  /** 以框的中心為基準縮放，縮放後畫面中心不會跑掉 */
  const changeZoom = (nextZoom: number) => {
    if (!natural) return;
    const z = Math.min(MAX_ZOOM, Math.max(1, nextZoom));
    const nextScale = baseScale * z;
    const cx = (frame.w / 2 - offset.x) / scale;
    const cy = (frame.h / 2 - offset.y) / scale;
    setZoom(z);
    setOffset(
      clamp(
        { x: frame.w / 2 - cx * nextScale, y: frame.h / 2 - cy * nextScale },
        natural.w * nextScale,
        natural.h * nextScale,
      ),
    );
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { pointerX: e.clientX, pointerY: e.clientY, start: offset };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    setOffset(
      clamp({ x: drag.start.x + e.clientX - drag.pointerX, y: drag.start.y + e.clientY - drag.pointerY }),
    );
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img || !natural) return;
    // 框在原圖上對應的範圍
    const sx = -offset.x / scale;
    const sy = -offset.y / scale;
    const sw = frame.w / scale;
    const sh = frame.h / scale;
    // 輸出寬度最多 1080px，原圖比較小就不放大，避免變糊
    const outW = Math.round(Math.min(OUTPUT_WIDTH, sw));
    const outH = Math.round(outW / POST_ASPECT);

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

    setSaving(true);
    canvas.toBlob(
      (blob) => {
        setSaving(false);
        if (blob) onConfirm(blob);
        else alert('裁切失敗，請換一張照片再試一次。');
      },
      'image/jpeg',
      0.9,
    );
  };

  return (
    <div
      className="modal-overlay cropper-overlay"
      onClick={(e) => {
        e.stopPropagation(); // 只關裁切視窗，不要連發文視窗一起關掉
        onCancel();
      }}
    >
      <div className="cropper-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>裁切照片</h3>
          <button type="button" className="modal-close" onClick={onCancel} aria-label="取消裁切">
            ✕
          </button>
        </div>

        <div
          ref={frameRef}
          className="cropper-frame"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={(e) => changeZoom(zoom - e.deltaY * 0.002)}
        >
          <img
            ref={imgRef}
            src={src}
            alt="要裁切的照片"
            draggable={false}
            className="cropper-image"
            onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            style={{ width: displayW || undefined, height: displayH || undefined, transform: `translate(${offset.x}px, ${offset.y}px)` }}
          />
        </div>

        <p className="cropper-hint">拖曳照片調整位置，框內就是貼文顯示的畫面</p>

        <label className="cropper-zoom">
          <span aria-hidden="true">－</span>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => changeZoom(Number(e.target.value))}
            aria-label="縮放"
          />
          <span aria-hidden="true">＋</span>
        </label>

        <div className="cropper-actions">
          <button type="button" className="cropper-cancel" onClick={onCancel}>
            取消
          </button>
          <button type="button" className="new-post-submit cropper-confirm" onClick={handleConfirm} disabled={!natural || saving}>
            {saving ? '處理中…' : '確認裁切'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropper;
