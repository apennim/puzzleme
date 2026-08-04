import { useState } from 'react';
import { useLocalImage } from '../hooks/useLocalImage';
import EditableImage from './EditableImage';
import EditableText from './EditableText';

interface TripInviteProps {
  onClose: () => void;
}

const stop = (e: React.SyntheticEvent) => e.stopPropagation();

function TripInvite({ onClose }: TripInviteProps) {
  const [photo, setPhoto] = useLocalImage('invite-photo');
  const [avatar0, setAvatar0] = useLocalImage('invite-avatar-0');
  const [avatar1, setAvatar1] = useLocalImage('invite-avatar-1');
  const [avatar2, setAvatar2] = useLocalImage('invite-avatar-2');
  const [distance, setDistance] = useLocalImage('invite-distance');
  const [title, setTitle] = useLocalImage('invite-title');
  const [address, setAddress] = useLocalImage('invite-address');
  const [sns, setSns] = useLocalImage('invite-sns');
  const [tel, setTel] = useLocalImage('invite-tel');
  const [tag0, setTag0] = useLocalImage('invite-tag-0');
  const [tag1, setTag1] = useLocalImage('invite-tag-1');
  const [tag2, setTag2] = useLocalImage('invite-tag-2');
  const [organizer, setOrganizer] = useLocalImage('invite-organizer');
  const [joined, setJoined] = useState(false);

  const handleJoin = () => {
    setJoined(true);
    setTimeout(onClose, 900);
  };

  return (
    <section className="card trip-invite">
      <EditableImage value={photo} onChange={setPhoto} alt="行程照片" className="trip-invite-media">
        <button type="button" className="back-btn trip-invite-back" onClick={(e) => { stop(e); onClose(); }} aria-label="返回">
          ‹
        </button>

        <div className="trip-invite-avatars" onClick={stop} onMouseDown={stop}>
          <EditableImage value={avatar0} onChange={setAvatar0} alt="發起人頭像" className="friend-activity-avatar" compact />
          <EditableImage value={avatar1} onChange={setAvatar1} alt="同行者頭像 1" className="friend-activity-avatar" compact />
          <EditableImage value={avatar2} onChange={setAvatar2} alt="同行者頭像 2" className="friend-activity-avatar" compact />
        </div>

        <div className="trip-invite-distance" onClick={stop} onMouseDown={stop}>
          <EditableText value={distance} onChange={setDistance} placeholder="距離你 X km" className="trip-invite-distance-text" />
        </div>

        <div className="swipe-card-gradient" />
      </EditableImage>

      <div className="trip-invite-info">
        <EditableText value={title} onChange={setTitle} placeholder="地點名稱" className="card-title" />
        <EditableText value={address} onChange={setAddress} placeholder="地址" className="card-address" />
        <div className="trip-invite-contact">
          <EditableText value={sns} onChange={setSns} placeholder="SNS" className="trip-invite-contact-text" />
          <EditableText value={tel} onChange={setTel} placeholder="TEL" className="trip-invite-contact-text" />
        </div>
      </div>

      <div className="tag-row trip-invite-tags">
        <span className="tag-pill tag-pill-0">
          <EditableText value={tag0} onChange={setTag0} placeholder="標籤" className="tag-pill-text" />
        </span>
        <span className="tag-pill tag-pill-1">
          <EditableText value={tag1} onChange={setTag1} placeholder="標籤" className="tag-pill-text" />
        </span>
        <span className="tag-pill tag-pill-2">
          <EditableText value={tag2} onChange={setTag2} placeholder="標籤" className="tag-pill-text" />
        </span>
      </div>

      <div className="trip-invite-organizer">
        <EditableText value={organizer} onChange={setOrganizer} placeholder="由 OOO 發起的行程" className="trip-invite-organizer-text" />
      </div>

      <div className="card-actions trip-invite-actions">
        {joined ? (
          <p className="trip-invite-joined">🎉 已加入行程！</p>
        ) : (
          <>
            <button type="button" className="btn-join" onClick={handleJoin}>
              Join!
            </button>
            <button type="button" className="btn-decline" onClick={onClose} aria-label="不加入">
              ✕
            </button>
          </>
        )}
      </div>
    </section>
  );
}

export default TripInvite;
