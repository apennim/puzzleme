import { useRef } from 'react';

interface EditableImageProps {
  value: string;
  onChange: (dataUrl: string) => void;
  alt: string;
  className?: string;
  children?: React.ReactNode;
  /** 小尺寸（例如頭像）時，只顯示圖示不顯示文字說明 */
  compact?: boolean;
}

function EditableImage({ value, onChange, alt, className = '', children, compact = false }: EditableImageProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={`editable-image ${value ? '' : 'editable-image-empty'} ${className}`}
      style={value ? { backgroundImage: `url(${value})` } : undefined}
      role="button"
      tabIndex={0}
      aria-label={value ? `更換${alt}` : `上傳${alt}`}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {value ? (
        <span className="editable-image-edit-btn">{compact ? '✎' : '✎ 更換照片'}</span>
      ) : (
        <span className="editable-image-placeholder">
          <span className="editable-image-plus">＋</span>
          {!compact && '點擊上傳照片'}
        </span>
      )}
      {children}
    </div>
  );
}

export default EditableImage;
