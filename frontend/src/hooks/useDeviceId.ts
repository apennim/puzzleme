import { useState } from 'react';

const ID_KEY = 'pintu-device-id';
const LABEL_KEY = 'pintu-device-label';

function readOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/** 輕量裝置身分：一組持久化的隨機裝置 ID + 使用者自填的識別名稱（Gmail/電話），不做真的帳密驗證 */
export function useDeviceId() {
  const [deviceId] = useState(readOrCreateDeviceId);
  const [label, setLabelState] = useState(() => {
    try {
      return localStorage.getItem(LABEL_KEY) ?? '';
    } catch {
      return '';
    }
  });

  const setLabel = (value: string) => {
    setLabelState(value);
    try {
      localStorage.setItem(LABEL_KEY, value);
    } catch {
      // localStorage 被封鎖時，僅維持記憶體內狀態
    }
  };

  return { deviceId, label, setLabel, hasIdentity: !!label };
}
