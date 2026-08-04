import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface VoteOption {
  id: string;
  label: string;
  votes: number;
}

const roomId = 'pintu-room-01';

interface VoteRoomProps {
  onAddBlindPins?: (pins: { id: string; lat: number; lng: number; title: string; locked?: boolean }[]) => void;
  onUnlock?: (pins: { id: string; lat: number; lng: number; title: string }[]) => void;
}

function VoteRoom({ onAddBlindPins, onUnlock }: VoteRoomProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [options, setOptions] = useState<VoteOption[]>([
    { id: 'A', label: '#老台北鐵窗花', votes: 0 },
    { id: 'B', label: '#昭和復古風', votes: 0 },
    { id: 'C', label: '#城市盲盒探險', votes: 0 },
  ]);
  const [message, setMessage] = useState('請選擇一個主題，送出後模擬房間協作。');
  const [blindRoute, setBlindRoute] = useState<any | null>(null);

  useEffect(() => {
    const client = io('http://localhost:4000', { autoConnect: false });
    client.connect();

    client.on('connect', () => {
      client.emit('join_room', roomId);
    });

    client.on('vote_update', (updatedOptions: VoteOption[]) => {
      setOptions(updatedOptions);
    });

    client.on('room_result', (content: { title: string }) => {
      setMessage(`接收後端路線方案：${content.title}`);
    });

    setSocket(client);

    return () => {
      client.disconnect();
    };
  }, []);

  const votedCount = useMemo(() => options.reduce((sum, item) => sum + item.votes, 0), [options]);
  const isUnlocked = votedCount > 1;

  const handleVote = (optionId: string) => {
    if (!socket) return;
    const nextOptions = options.map((option) =>
      option.id === optionId ? { ...option, votes: option.votes + 1 } : option
    );
    setOptions(nextOptions);
    socket.emit('vote', { roomId, optionId });

    if (nextOptions.reduce((sum, item) => sum + item.votes, 0) > 1) {
      socket.emit('request_route', { roomId });
    }
  };

  const handleSendTheme = () => {
    // simulate server returning 3 candidate routes (A/B/C)
    const routeA = [
      { id: 'A-1', lat: 25.0565, lng: 121.5099, title: 'A1' },
      { id: 'A-2', lat: 25.0570, lng: 121.5110, title: 'A2' },
      { id: 'A-sp', lat: 25.0541, lng: 121.5097, title: '幻猻家珈琲' },
    ];
    const routeB = [
      { id: 'B-1', lat: 25.0550, lng: 121.5150, title: 'B1' },
      { id: 'B-2', lat: 25.0560, lng: 121.5160, title: 'B2' },
      { id: 'B-sp', lat: 25.0541, lng: 121.5097, title: '幻猻家珈琲' },
    ];
    const routeC = [
      { id: 'C-1', lat: 25.0520, lng: 121.5100, title: 'C1' },
      { id: 'C-2', lat: 25.0530, lng: 121.5120, title: 'C2' },
      { id: 'C-sp', lat: 25.0541, lng: 121.5097, title: '幻猻家珈琲' },
    ];

    const candidates = { A: routeA, B: routeB, C: routeC };
    setBlindRoute(candidates);
    setMessage('已產生 3 組盲盒路線，地圖上將以模糊狀態顯示。');

    // inject blurred pins into map (locked)
    if (onAddBlindPins) {
      // choose route A by default for display
      const lockedPins = routeA.map((p) => ({ ...p, locked: true }));
      onAddBlindPins(lockedPins);
    }
  };

  useEffect(() => {
    const total = options.reduce((s, o) => s + o.votes, 0);
    if (total > 1 && blindRoute && onUnlock) {
      // simulate unlocking chosen route (A)
      const unlockPins = blindRoute['A'];
      onUnlock(unlockPins);
      setMessage('投票已通過：已解鎖路線 A');
    }
  }, [options, blindRoute, onUnlock]);

  return (
    <section className="card">
      <div className="card-header">
        <h2>協作投票房</h2>
        <p>模擬房間協作，投票通過後解鎖盲盒地圖路線。</p>
      </div>
      <div className="card-body">
        <div className="vote-grid">
          {options.map((option) => (
            <button key={option.id} className="vote-button" onClick={() => handleVote(option.id)}>
              <span>{option.label}</span>
              <strong>{option.votes} 票</strong>
            </button>
          ))}
        </div>

        <div className="vote-status">
          <p>{message}</p>
          <p>總票數：{votedCount}</p>
          {isUnlocked ? <p className="unlocked">已達成多數，地圖路線解鎖中！</p> : <p className="locked">尚未過半，盲盒路線維持模糊。</p>}
        </div>
      </div>
    </section>
  );
}

export default VoteRoom;
