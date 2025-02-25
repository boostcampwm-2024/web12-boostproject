import { forwardRef, Module } from '@nestjs/common';
import { EventGateway } from './event.gateway';
import { GameRoomModule } from 'src/game-room/game-room.module';
import { EventManager } from './event-manager';
import { GameModule } from 'src/game/game.module';
import { OnlineStateModule } from '../online-state/online-state.module';
import { APP_FILTER } from '@nestjs/core';
import { WebsocketExceptionFilter } from '../common/filter/websocket.exception.filter';
import { UserModule } from 'src/user/user.module';
import { EventClientManager } from './event-client-manager';

@Module({
  imports: [
    GameRoomModule,
    GameModule,
    forwardRef(() => UserModule),
    OnlineStateModule,
  ],
  providers: [
    EventGateway,
    EventManager,
    EventClientManager,
    {
      provide: APP_FILTER,
      useClass: WebsocketExceptionFilter,
    },
  ],
  exports: [EventManager, EventClientManager],
})
export class EventModule {}
