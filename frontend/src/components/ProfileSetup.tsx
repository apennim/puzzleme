import { useRef, useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import SettingsIcon from './SettingsIcon';

// 台灣 22 個縣市，加上「海外」給不在台灣的試用者
const LOCATIONS = [
  '基隆市', '臺北市', '新北市', '桃園市', '新竹市', '新竹縣', '苗栗縣',
  '臺中市', '彰化縣', '南投縣', '雲林縣', '嘉義市', '嘉義縣', '臺南市',
  '高雄市', '屏東縣', '宜蘭縣', '花蓮縣', '臺東縣', '澎湖縣', '金門縣', '連江縣',
  '海外',
];

// 依設計稿：沒上傳大頭貼時，圓框中間放彩色版的拼途 Logo
const LOGO_PIECE_COLORS: [string, string, string, string, string] = [
  '#94ACB6', '#94ACB6', '#E1C6B9', '#F6EFC2', '#DDECC0',
];

/**
 * 登入後的「建立個人資料」頁：上傳大頭貼、輸入名字、選擇所在地點。
 * 只有還沒填過所在地點的帳號會看到（見 App.tsx），按 Done! 存進 profiles 表後進入 App。
 * 大頭貼選好就會立刻上傳（沿用 useProfile 的 setAvatar），首頁、發文、個人資料頁都會同步。
 */
function ProfileSetup() {
  const { avatarUrl, setAvatar, nickname, updateProfile } = useProfile();
  const [name, setName] = useState(nickname);
  const [location, setLocation] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      setUploading(true);
      setError('');
      try {
        await setAvatar(String(reader.result));
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDone = async () => {
    if (!avatarUrl) return setError('請先上傳一張大頭貼');
    if (!name.trim()) return setError('請輸入你的名字');
    if (!location) return setError('請選擇所在地點');

    setSaving(true);
    setError('');
    try {
      // 存成功後 location 會有值，App 就會自動切換到主畫面
      await updateProfile({ nickname: name, location });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="setup-screen">
      <button
        type="button"
        className={avatarUrl ? 'setup-avatar has-image' : 'setup-avatar'}
        style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
        onClick={() => fileRef.current?.click()}
        aria-label={avatarUrl ? '更換大頭貼' : '上傳大頭貼'}
        disabled={uploading}
      >
        {!avatarUrl && <SettingsIcon className="setup-avatar-logo" pieceColors={LOGO_PIECE_COLORS} />}
        {uploading && <span className="setup-avatar-status">上傳中…</span>}
        {avatarUrl && !uploading && <span className="setup-avatar-edit">✎</span>}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className="setup-fields">
        <div className="setup-field">
          <label htmlFor="setup-name">Your Name is...?</label>
          <input id="setup-name" type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} />
        </div>

        <div className="setup-field">
          <label htmlFor="setup-location">Where you from...?</label>
          <select id="setup-location" required value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="" disabled>
              選擇所在地點
            </option>
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="setup-error" role="alert">
        {error}
      </p>

      <button type="button" className="setup-done" onClick={handleDone} disabled={saving || uploading}>
        {saving ? 'Saving…' : 'Done!'}
      </button>
    </div>
  );
}

export default ProfileSetup;
