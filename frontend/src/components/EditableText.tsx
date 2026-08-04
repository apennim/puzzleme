import { useEffect, useRef } from 'react';

interface EditableTextProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  className?: string;
}

function EditableText({ value, onChange, placeholder = '點擊輸入文字', className = '' }: EditableTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isEditing = useRef(false);

  useEffect(() => {
    if (ref.current && !isEditing.current && ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
  }, [value]);

  return (
    <div
      ref={ref}
      className={className}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      onFocus={() => {
        isEditing.current = true;
      }}
      onBlur={(e) => {
        isEditing.current = false;
        onChange(e.currentTarget.textContent ?? '');
      }}
    />
  );
}

export default EditableText;
