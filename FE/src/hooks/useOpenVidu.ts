import { useAuthStore } from '@/stores/authStore';
import { useSocketStore } from '@/stores/socketStore';
import { GamePublisher } from '@/types/gamePublisher';
import { GameSubscriber } from '@/types/gameSubscriber';
import {
  OpenVidu,
  Publisher,
  Subscriber,
  VideoInsertMode,
} from 'openvidu-browser';
import { Reducer, useEffect, useReducer } from 'react';

type State = {
  isGameStarted: boolean;
  gamePublisher: GamePublisher;
  gameSubscribers: GameSubscriber[];
};

type Action =
  | { type: 'PARTICIPATE'; payload: { participantList: string[] } }
  | { type: 'LEAVE'; payload: { nickname: string } }
  | { type: 'START_GAME'; payload: { publisher: Publisher } }
  | { type: 'SUBSCRIBE'; payload: { subscriber: Subscriber } }
  | { type: 'UNSUBSCRIBE'; payload: { nickname: string } }
  | { type: 'CHANGE_PUBLISHER_STATUS'; payload: Partial<GamePublisher> }
  | {
      type: 'CHANGE_SUBSCRIBER_STATUS';
      payload: { nickname: string; data: Partial<GameSubscriber> };
    }
  | { type: 'INITIALIZE_VOTES' }
  | { type: 'SET_All_PARTICIPANTS_AS_CANDIDATES' }
  | { type: 'SET_TARGETS_OF_MAFIA' }
  | { type: 'SET_TARGETS_OF_POLICE' };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'PARTICIPATE':
      return {
        ...state,
        gameSubscribers: action.payload.participantList.map((participant) => ({
          participant: null,
          nickname: participant,
          role: null,
          audioEnabled: false,
          videoEnabled: false,
          votes: 0,
          isCandidate: false,
        })),
      };

    case 'LEAVE':
      return {
        ...state,
        gameSubscribers: state.gameSubscribers.filter(
          (gameSubscriber) =>
            gameSubscriber.nickname !== action.payload.nickname,
        ),
      };

    case 'START_GAME':
      return {
        ...state,
        isGameStarted: true,
        gamePublisher: {
          ...state.gamePublisher,
          participant: action.payload.publisher,
          audioEnabled: true,
          videoEnabled: true,
        },
      };

    case 'SUBSCRIBE': {
      const index = state.gameSubscribers.findIndex(
        (gameSubscriber) =>
          gameSubscriber.nickname ===
          action.payload.subscriber.stream.connection.data.split('%/%')[0],
      );

      if (index === -1) {
        return state;
      }

      /* eslint-disable indent */
      return {
        ...state,
        gameSubscribers: state.gameSubscribers.map((gameSubscriber, idx) =>
          idx === index
            ? {
                ...gameSubscriber,
                participant: action.payload.subscriber,
                audioEnabled: true,
                videoEnabled: true,
              }
            : gameSubscriber,
        ),
      };
    }

    case 'UNSUBSCRIBE':
      return {
        ...state,
        gameSubscribers: state.gameSubscribers.map((gameSubscriber) =>
          gameSubscriber.nickname === action.payload.nickname
            ? {
                ...gameSubscriber,
                participant: null,
                audioEnabled: false,
                videoEnabled: false,
              }
            : gameSubscriber,
        ),
      };
    /* eslint-enable indent */

    case 'CHANGE_PUBLISHER_STATUS':
      return {
        ...state,
        gamePublisher: { ...state.gamePublisher, ...action.payload },
      };

    case 'CHANGE_SUBSCRIBER_STATUS': {
      const index = state.gameSubscribers.findIndex(
        (gameSubscriber) => gameSubscriber.nickname === action.payload.nickname,
      );

      if (index === -1) {
        return state;
      }

      return {
        ...state,
        gameSubscribers: state.gameSubscribers.map((gameSubscriber, idx) =>
          idx === index
            ? { ...gameSubscriber, ...action.payload.data }
            : gameSubscriber,
        ),
      };
    }

    case 'INITIALIZE_VOTES':
      return {
        ...state,
        gamePublisher: { ...state.gamePublisher, votes: 0, isCandidate: false },
        gameSubscribers: state.gameSubscribers.map((gameSubscriber) => ({
          ...gameSubscriber,
          votes: 0,
          isCandidate: false,
        })),
      };

    case 'SET_All_PARTICIPANTS_AS_CANDIDATES':
      return {
        ...state,
        gamePublisher: { ...state.gamePublisher, isCandidate: true },
        gameSubscribers: state.gameSubscribers.map((gameSubscriber) => ({
          ...gameSubscriber,
          isCandidate: true,
        })),
      };

    case 'SET_TARGETS_OF_MAFIA':
      return {
        ...state,
        gamePublisher: {
          ...state.gamePublisher,
          isCandidate: state.gamePublisher.role !== 'MAFIA',
        },
        gameSubscribers: state.gameSubscribers.map((gameSubscriber) => ({
          ...gameSubscriber,
          isCandidate: gameSubscriber.role !== 'MAFIA',
        })),
      };

    case 'SET_TARGETS_OF_POLICE':
      return {
        ...state,
        gamePublisher: {
          ...state.gamePublisher,
          isCandidate: false,
        },
        gameSubscribers: state.gameSubscribers.map((gameSubscriber) => ({
          ...gameSubscriber,
          isCandidate: gameSubscriber.role === null,
        })),
      };

    default:
      throw new Error('Unknown action type');
  }
};

export const useOpenVidu = () => {
  const { nickname } = useAuthStore();
  const { socket, session, setSocketState } = useSocketStore();
  const [state, dispatch] = useReducer<Reducer<State, Action>>(reducer, {
    isGameStarted: false,
    gamePublisher: {
      participant: null,
      nickname: nickname,
      role: null,
      audioEnabled: false,
      videoEnabled: false,
      votes: 0,
      isCandidate: false,
    },
    gameSubscribers: [],
  });

  const toggleAudio = () => {
    if (!state.gamePublisher.participant) {
      return;
    }

    if (state.gamePublisher.audioEnabled) {
      dispatch({
        type: 'CHANGE_PUBLISHER_STATUS',
        payload: { audioEnabled: false },
      });
      state.gamePublisher.participant.publishAudio(false);
    } else {
      dispatch({
        type: 'CHANGE_PUBLISHER_STATUS',
        payload: { audioEnabled: true },
      });
      state.gamePublisher.participant.publishAudio(true);
    }
  };

  const toggleVideo = () => {
    if (!state.gamePublisher.participant) {
      return;
    }

    if (state.gamePublisher.videoEnabled) {
      dispatch({
        type: 'CHANGE_PUBLISHER_STATUS',
        payload: { videoEnabled: false },
      });
      state.gamePublisher.participant.publishVideo(false);
    } else {
      dispatch({
        type: 'CHANGE_PUBLISHER_STATUS',
        payload: { videoEnabled: true },
      });
      state.gamePublisher.participant.publishVideo(true);
    }
  };

  const changePublisherStatus = (data: Partial<GamePublisher>) => {
    dispatch({ type: 'CHANGE_PUBLISHER_STATUS', payload: data });
  };

  const changeSubscriberStatus = (
    nickname: string,
    data: Partial<GameSubscriber>,
  ) => {
    dispatch({ type: 'CHANGE_SUBSCRIBER_STATUS', payload: { nickname, data } });
  };

  const initializeVotes = () => {
    dispatch({ type: 'INITIALIZE_VOTES' });
  };

  const setAllParticipantsAsCandidates = () => {
    dispatch({ type: 'SET_All_PARTICIPANTS_AS_CANDIDATES' });
  };

  const setTargetsOfMafia = () => {
    dispatch({ type: 'SET_TARGETS_OF_MAFIA' });
  };

  const setTargetsOfPolice = () => {
    dispatch({ type: 'SET_TARGETS_OF_POLICE' });
  };

  const eliminatePublisher = () => {
    state.gamePublisher?.participant?.publishAudio(false);
    state.gamePublisher?.participant?.publishVideo(false);
    session?.unpublish(state.gamePublisher.participant!);
    dispatch({
      type: 'CHANGE_PUBLISHER_STATUS',
      payload: { participant: null, audioEnabled: false, videoEnabled: false },
    });
  };

  useEffect(() => {
    // 게임 참가
    socket?.on('participants', (participants: string[]) => {
      dispatch({
        type: 'PARTICIPATE',
        payload: {
          participantList: participants.filter(
            (participant) => participant !== nickname,
          ),
        },
      });
    });

    // 다른 플레이어가 방을 나간 경우
    socket?.on('leave-user-nickname', (nickname: string) => {
      dispatch({ type: 'LEAVE', payload: { nickname } });
    });

    (async () => {
      try {
        // OpenVidu 객체 생성
        const openvidu = new OpenVidu();

        /**
         * 세션 초기화 (아직 연결되지 않은 상태)
         * - WebRTC 연결을 위한 로컬 객체 생성
         * - 이벤트 핸들러를 등록할 수 있는 인터페이스 제공
         */
        const session = openvidu.initSession();

        // 연결 중 에러 발생 시
        session.on('exception', (exception) => {
          console.warn(exception);
        });

        setSocketState({ session });

        socket?.on(
          'video-info',
          async (data: { token: string; sessionId: string }) => {
            /**
             * 토큰을 사용하여 실제 연결 수립
             * - OpenVidu 서버와 WebRTC 연결 설정
             * - 인증 및 미디어 서버와의 초기 핸드셰이크
             */
            await session.connect(data.token, nickname);

            // 로컬 스트림(자신의 비디오/오디오) 초기화
            const publisher = await openvidu.initPublisherAsync(undefined, {
              audioSource: undefined, // 기본 마이크
              videoSource: undefined, // 기본 카메라
              publishAudio: true, // 오디오 활성화
              publishVideo: true, // 카메라 활성화
              resolution: '640x480', // 해상도 설정
              frameRate: 30, // FPS 설정
              insertMode: VideoInsertMode.APPEND, // 비디오 요소 추가 방식
              mirror: false, // 미러링 여부
            });

            /**
             * 스트림 발행 시작
             * - 다른 참가자들이 내 스트림을 볼 수 있게 됨
             */
            await session.publish(publisher);
            dispatch({ type: 'START_GAME', payload: { publisher } });
          },
        );
      } catch (error) {
        console.error(`Error joining session: ${error}`);
      }
    })();

    return () => {
      socket?.off('participants');
      socket?.off('video-info');
    };
  }, [nickname, setSocketState, socket]);

  useEffect(() => {
    return () => {
      if (session) {
        session.disconnect();
        setSocketState({ session: null });
      }
    };
  }, [session, setSocketState]);

  useEffect(() => {
    if (session) {
      /**
       * 이벤트 핸들러 설정
       * - 다른 참가자의 스트림이 생성될 때
       */
      session.on('streamCreated', (event) => {
        // 자동으로 새 스트림 구독
        const subscriber = session.subscribe(event.stream, undefined);
        dispatch({ type: 'SUBSCRIBE', payload: { subscriber } });
      });

      // 다른 참가자의 오디오/비디오 상태가 변경될 때
      session.on('streamPropertyChanged', (event) => {
        switch (event.changedProperty) {
          case 'audioActive':
            dispatch({
              type: 'CHANGE_SUBSCRIBER_STATUS',
              payload: {
                nickname: event.stream.connection.data.split('%/%')[0],
                data: { audioEnabled: event.newValue as boolean },
              },
            });
            break;
          case 'videoActive':
            dispatch({
              type: 'CHANGE_SUBSCRIBER_STATUS',
              payload: {
                nickname: event.stream.connection.data.split('%/%')[0],
                data: { videoEnabled: event.newValue as boolean },
              },
            });
            break;
          default:
            break;
        }
      });

      // 참가자의 스트림이 제거될 때
      session.on('streamDestroyed', (event) => {
        dispatch({
          type: 'UNSUBSCRIBE',
          payload: { nickname: event.stream.connection.data.split('%/%')[0] },
        });
      });
    }

    return () => {
      if (session) {
        session.off('streamCreated');
        session.off('streamPropertyChanged');
        session.off('streamDestroyed');
      }
    };
  }, [session, state.gameSubscribers]);

  return {
    isGameStarted: state.isGameStarted,
    gamePublisher: state.gamePublisher,
    gameSubscribers: state.gameSubscribers,
    toggleAudio,
    toggleVideo,
    changePublisherStatus,
    changeSubscriberStatus,
    initializeVotes,
    setAllParticipantsAsCandidates,
    setTargetsOfMafia,
    setTargetsOfPolice,
    eliminatePublisher,
  };
};
