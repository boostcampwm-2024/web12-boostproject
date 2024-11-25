'use client';

import VideoCameraIcon from '@/components/common/icons/VideoCameraIcon';
import VideoCameraSlashIcon from '@/components/common/icons/VideoCameraSlashIcon';
import { ROLE, Role } from '@/constants/role';
import { Situation } from '@/constants/situation';
import { useAuthStore } from '@/stores/authStore';
import { useSocketStore } from '@/stores/socketStore';
import { GamePublisher } from '@/types/gamePublisher';
import { GameSubscriber } from '@/types/gameSubscriber';
import { useEffect, useRef } from 'react';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';

interface VideoItemProps {
  roomId: string;
  isPublisherAlive: boolean;
  gamePublisherRole: Role | null;
  gameParticipant: GamePublisher | GameSubscriber;
  situation: Situation | null;
  target: string | null;
  setTarget: (nickname: string | null) => void;
}

const VideoItem = ({
  roomId,
  isPublisherAlive,
  gamePublisherRole,
  gameParticipant,
  situation,
  target,
  setTarget,
}: VideoItemProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { nickname } = useAuthStore();
  const { socket } = useSocketStore();

  const handleClick = () => {
    if (!situation || !isPublisherAlive || !gameParticipant.isCandidate) {
      return;
    }

    switch (situation) {
      case 'VOTE':
        if (target !== null) {
          socket?.emit('cancel-vote-candidate', {
            roomId,
            from: nickname,
            to: target,
          });
        }

        if (target === gameParticipant.nickname) {
          setTarget(null);
          return;
        }

        setTarget(gameParticipant.nickname);
        socket?.emit('vote-candidate', {
          roomId,
          from: nickname,
          to: gameParticipant.nickname,
        });
        break;
      case 'MAFIA':
        socket?.emit('select-mafia-target', {
          roomId,
          from: nickname,
          target: gameParticipant.nickname,
        });
        break;
      case 'DOCTOR':
        setTarget(gameParticipant.nickname);
        socket?.emit('select-doctor-target', {
          roomId,
          from: nickname,
          target: gameParticipant.nickname,
        });
        break;
      case 'POLICE':
        socket?.emit('police-investigate', {
          roomId,
          police: nickname,
          criminal: gameParticipant.nickname,
        });
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (videoRef.current && gameParticipant.participant) {
      gameParticipant.participant.addVideoElement(videoRef.current);
    }
  }, [gameParticipant.participant]);

  return (
    <div
      className={[
        `${isPublisherAlive && (situation === 'VOTE' || (situation === 'MAFIA' && gamePublisherRole === 'MAFIA') || (situation === 'DOCTOR' && gamePublisherRole === 'DOCTOR') || (situation === 'POLICE' && gamePublisherRole === 'POLICE')) && gameParticipant.isCandidate && 'cursor-pointer hover:z-10'}`,
        `${(target === gameParticipant.nickname || situation === 'ARGUMENT') && gameParticipant.isCandidate && 'z-10 border-2'}`,
        'relative flex h-full w-full flex-col items-center rounded-3xl border border-slate-200 bg-black',
      ].join(' ')}
      onClick={handleClick}
    >
      {gameParticipant.role !== null && (
        <div className='absolute left-4 top-4 z-10 flex h-8 w-20 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-xs text-blue-800'>
          {ROLE[gameParticipant.role]}
        </div>
      )}
      {gameParticipant.isRoomManager && (
        <div className='absolute right-4 top-4 z-10 flex h-8 w-20 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-xs text-blue-800'>
          방장
        </div>
      )}
      {situation === 'VOTE' && gameParticipant.isCandidate && (
        <p className='absolute top-0 z-10 flex h-full w-full items-center justify-center text-5xl text-white'>
          {gameParticipant.votes}
        </p>
      )}
      <video
        className='h-full w-full overflow-y-hidden rounded-t-3xl object-cover'
        ref={videoRef}
        autoPlay={true}
        playsInline={true}
      />
      <div className='flex w-full flex-row items-center justify-between gap-3 rounded-b-3xl bg-slate-600/50 px-4 py-3'>
        <p className='z-10 truncate text-nowrap text-sm text-white'>
          {gameParticipant.nickname}
        </p>
        <div className='flex flex-row items-center gap-3'>
          {gameParticipant.audioEnabled ? (
            <FaMicrophone className='text-white' />
          ) : (
            <FaMicrophoneSlash className='scale-125 text-white' />
          )}
          {gameParticipant.videoEnabled ? (
            <VideoCameraIcon className='scale-90 fill-white' />
          ) : (
            <VideoCameraSlashIcon className='scale-90 fill-white' />
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoItem;
