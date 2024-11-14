import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { StartCountdownRequest } from 'src/game/dto/start.countdown.request';
import { CountdownTimeoutService } from 'src/game/usecase/countdown/countdown.timeout.service';
import { COUNTDOWN_TIMEOUT_USECASE } from 'src/game/usecase/countdown/countdown.timeout.usecase';
import { GameState, TransitionHandler } from './state';
import { GameContext } from '../game-context';
import { DiscussionState } from './discussion.state';

@Injectable()
export class PoliceState extends GameState {
  constructor(
    @Inject(COUNTDOWN_TIMEOUT_USECASE)
    private readonly countdownTimeoutService: CountdownTimeoutService,
    @Inject(forwardRef(() => DiscussionState))
    private readonly discussionState: DiscussionState,
  ) {
    super();
  }

  async handle(context: GameContext, next: TransitionHandler) {
    const room = context.room;
    await this.countdownTimeoutService.countdownStart(
      new StartCountdownRequest(room, 'ARGUMENT'),
    );
    // todo: 경찰 상태가 끝나면 이제 낮이 되는데 바로 토론 상태로 가는 것이 아니라 게임 승리 조건을 확인해서 처리해야할 것 같습니다.
    next(this.discussionState);
  }
}
