import { useEffect } from 'react';

interface NotificationProps {
  message: string;
  onClose: () => void;
}

export default function Notification({ message, onClose }: NotificationProps) {
  useEffect(() => {
    const t = setTimeout(() => onClose(), 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{ position: 'fixed', right: 20, top: 20, zIndex: 120 }}>
      <div style={{ background: '#fff', padding: '12px 16px', borderRadius: 12, boxShadow: '0 12px 30px rgba(0,0,0,0.12)' }}>
        <strong style={{ display: 'block', marginBottom: 6 }}>系統通知</strong>
        <div style={{ fontSize: 14 }}>{message}</div>
      </div>
    </div>
  );
}
