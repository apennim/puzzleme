import { useState } from 'react';
import SettingsIcon from './SettingsIcon';

interface LoginProps {
  onContinue: (nickname: string) => void;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}

function Login({ onContinue }: LoginProps) {
  const [nickname, setNickname] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!nickname.trim() || !identifier.trim()) {
      alert('請輸入暱稱，以及 Gmail 或電話號碼');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim(), contact: identifier.trim() }),
      });

      if (!res.ok) {
        console.error('登入失敗', await res.text());
        alert('登入失敗，請檢查網路連線後再試一次。');
        return;
      }

      onContinue(nickname.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-logo">
        <SettingsIcon />
      </div>

      <div className="login-field">
        <label htmlFor="login-nickname">暱稱</label>
        <input
          id="login-nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
      </div>

      <div className="login-field">
        <label htmlFor="login-identifier">Gmail/Phone number</label>
        <input
          id="login-identifier"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
      </div>

      <div className="login-field">
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button type="button" className="login-submit" onClick={handleContinue} disabled={submitting}>
        {submitting ? '登入中…' : '登入'}
      </button>

      <div className="login-divider">or</div>

      <button type="button" className="login-google" onClick={handleContinue} disabled={submitting}>
        <GoogleIcon />
        Continue with Google
      </button>
    </div>
  );
}

export default Login;
