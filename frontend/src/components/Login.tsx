import { useState } from 'react';
import SettingsIcon from './SettingsIcon';
import type { LoginInput } from '../hooks/useProfile';

interface LoginProps {
  onContinue: (input: LoginInput) => Promise<void>;
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
    if (!nickname.trim() || !identifier.trim() || !password) {
      alert('請輸入暱稱、Gmail 或電話號碼，以及密碼');
      return;
    }
    if (password.length < 6) {
      alert('密碼至少需要 6 個字元');
      return;
    }

    setSubmitting(true);
    try {
      // 同一組 Gmail/電話 + 密碼再次登入，會回到同一個帳號，個人資料都還在
      await onContinue({ nickname: nickname.trim(), contact: identifier.trim(), password });
    } catch (err) {
      console.error('登入失敗', err);
      alert(err instanceof Error ? err.message : '登入失敗，請檢查網路連線後再試一次。');
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
