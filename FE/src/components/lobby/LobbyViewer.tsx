'use client';

import { io } from 'socket.io-client';
import LobbyBanner from './LobbyBanner';
import LobbyList from './LobbyList';
import { useEffect, useState } from 'react';
import { useSocketStore } from '@/stores/socketStore';
import NicknameModal from './NicknameModal';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

const LobbyViewer = () => {
  const { nickname } = useAuthStore();
  const { setSocketState } = useSocketStore();
  const [hasNickname, setHasNickname] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (hasNickname) {
      const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}/ws`, {
        transports: ['websocket', 'polling'], // use WebSocket first, if available
      });

      socket.on('connect_error', (error) => {
        console.error(`연결 실패: ${error}`);
        alert('서버와의 연결에 실패하였습니다. 잠시 후에 다시 시도해 주세요.');
        router.replace('/');
      });

      setSocketState({ socket });
      socket.emit('set-nickname', { nickname });
    }
  }, [hasNickname, nickname, router, setSocketState]);

  return (
    <div className='flex flex-col items-center'>
      {!hasNickname && (
        <NicknameModal setHasNickname={() => setHasNickname(true)} />
      )}
      <LobbyBanner />
      <LobbyList />
    </div>
  );
};

export default LobbyViewer;
