import { useState } from 'react';
import SettingsIcon from './SettingsIcon';

function clearUploadedImages() {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith('pintu-image:'));
  keys.forEach((k) => localStorage.removeItem(k));
  window.location.reload();
}

function SettingsPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="settings-wrap">
      <button
        type="button"
        className="settings-btn"
        aria-label="設定"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <SettingsIcon />
      </button>

      {open && (
        <div className="settings-panel">
          <p className="settings-panel-title">設定</p>
          <button
            type="button"
            className="settings-panel-item"
            onClick={() => {
              if (confirm('確定要清除所有已上傳的照片與文案嗎？此動作無法復原。')) {
                clearUploadedImages();
              }
            }}
          >
            清除已上傳的照片與文案
          </button>
        </div>
      )}
    </div>
  );
}

export default SettingsPanel;
