import { useState } from 'react';
import { useLocalImage } from '../hooks/useLocalImage';
import EditableImage from './EditableImage';
import EditableText from './EditableText';
import TripInvite from './TripInvite';

export interface FriendActivityMeta {
  id: string;
  caption: string;
}

const activities: FriendActivityMeta[] = [
  { id: 'friend-1', caption: '欸！大稻埕碼頭整修好了嗎？' },
  { id: 'friend-2', caption: '有人現在要去逛街嗎？' },
  { id: 'friend-3', caption: '朋友推薦我去吃' },
];

function FriendAvatarStack({ activityId }: { activityId: string }) {
  const [avatar1, setAvatar1] = useLocalImage(`friend-avatar-${activityId}-0`);
  const [avatar2, setAvatar2] = useLocalImage(`friend-avatar-${activityId}-1`);
  const [avatar3, setAvatar3] = useLocalImage(`friend-avatar-${activityId}-2`);
  const [more, setMore] = useLocalImage(`friend-avatar-${activityId}-more`);

  return (
    <div className="friend-avatar-stack" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <EditableImage value={avatar1} onChange={setAvatar1} alt="好友頭像 1" className="friend-activity-avatar" compact />
      <EditableImage value={avatar2} onChange={setAvatar2} alt="好友頭像 2" className="friend-activity-avatar" compact />
      <EditableImage value={avatar3} onChange={setAvatar3} alt="好友頭像 3" className="friend-activity-avatar" compact />
      <div className="friend-activity-avatar friend-avatar-more">
        <EditableText value={more} onChange={setMore} placeholder="+N" className="friend-avatar-more-text" />
      </div>
    </div>
  );
}

function FriendActivityCard({
  activity,
  onOpenInvite,
}: {
  activity: FriendActivityMeta;
  onOpenInvite?: () => void;
}) {
  const [image, setImage] = useLocalImage(`friend-photo-${activity.id}`);

  return (
    <article className="friend-activity">
      <div className="friend-activity-media-wrap">
        <EditableImage value={image} onChange={setImage} alt="行程照片" className="friend-activity-media" />
        {onOpenInvite && (
          <button
            type="button"
            className="friend-activity-open-invite"
            onClick={onOpenInvite}
            aria-label="查看行程邀請"
          />
        )}
        <FriendAvatarStack activityId={activity.id} />
      </div>
      <p className="friend-activity-caption">{activity.caption}</p>
    </article>
  );
}

function FriendTrip() {
  const [showInvite, setShowInvite] = useState(false);

  if (showInvite) {
    return <TripInvite onClose={() => setShowInvite(false)} />;
  }

  return (
    <section className="card friend-trip">
      <div className="card-header">
        <h2>好友行程</h2>
        <p>看看朋友最近在大稻埕的行程動態</p>
      </div>
      <div className="friend-trip-list">
        {activities.map((activity, i) => (
          <FriendActivityCard
            key={activity.id}
            activity={activity}
            onOpenInvite={i === 0 ? () => setShowInvite(true) : undefined}
          />
        ))}
      </div>
    </section>
  );
}

export default FriendTrip;
