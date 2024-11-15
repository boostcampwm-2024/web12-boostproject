import { GameRoom } from '../../../game-room/entity/game-room.model';

export const COUNTDOWN_TIMER = Symbol('COUNTDOWN_TIMER');

export interface CountdownTimer {
  start(room: GameRoom, situation: string): Promise<Promise<void> | void>;

  stop(room: GameRoom): void;
}