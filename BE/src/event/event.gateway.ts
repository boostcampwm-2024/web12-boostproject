import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { CreateRoomRequest } from 'src/game-room/dto/create-room.request';
import { GameRoomService } from 'src/game-room/game-room.service';
import { Inject, Logger } from '@nestjs/common';
import { EventClient } from './event-client.model';
import { EventManager } from './event-manager';
import { Event } from './event.const';
import {
  START_GAME_USECASE,
  StartGameUsecase,
} from 'src/game/usecase/start-game/start-game.usecase';
import {
  VOTE_MAFIA_USECASE,
  VoteMafiaUsecase,
} from '../game/usecase/vote-manager/vote.mafia.usecase';
import { VoteCandidateRequest } from '../game/dto/vote.candidate.request';
import { SelectMafiaTargetRequest } from '../game/dto/select.mafia.target.request';
import {
  MAFIA_KILL_USECASE,
  MafiaKillUsecase,
} from '../game/usecase/role-playing/mafia.kill.usecase';
import { FINISH_GAME_USECASE } from '../game/usecase/finish-game/finish-game.usecase';
import {
  CONNECTED_USER_USECASE,
  ConnectedUserUsecase,
} from '../online-state/connected-user.usecase';

// @UseInterceptors(WebsocketLoggerInterceptor)
@WebSocketGateway({
  namespace: 'ws',
  cors: {
    origin: '*',
  },
})
export class EventGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger(EventGateway.name);
  private connectedClients: Map<Socket, EventClient> = new Map();
  // 임시 user_id
  private tmpUserId = 1;
  constructor(
    private readonly eventManager: EventManager,
    private readonly gameRoomService: GameRoomService,
    @Inject(START_GAME_USECASE)
    private readonly startGameUsecase: StartGameUsecase,
    @Inject(VOTE_MAFIA_USECASE)
    private readonly voteMafiaUsecase: VoteMafiaUsecase,
    @Inject(MAFIA_KILL_USECASE)
    private readonly mafiaKillUseCase: MafiaKillUsecase,
    @Inject(CONNECTED_USER_USECASE)
    private readonly connectUserUseCase: ConnectedUserUsecase,
  ) {}

  async handleConnection(socket: Socket) {
    this.logger.log(`client connected: ${socket.id}`);
    const client = new EventClient(socket, this.eventManager);

    //임시 닉네임 및 ID 설정
    client.nickname = socket.id;
    client.tmpUserId = this.tmpUserId++;

    await this.connectUserUseCase.enter({
      userId: String(client.tmpUserId),
      userNickName: client.nickname,
    });

    client.subscribe(Event.ROOM_DATA_CHANGED);
    client.subscribe(Event.USER_DATA_CHANGED);
    this.connectedClients.set(socket, client);
    this.publishRoomDataChangedEvent();
    await this.publishUserDataChangedEvent();
  }

  async handleDisconnect(socket: Socket) {
    this.logger.log(`client disconnected: ${socket.id}`);
    const client = this.connectedClients.get(socket);
    await this.connectUserUseCase.leave(String(client.tmpUserId));
    client.unsubscribeAll();
    this.connectedClients.delete(socket);
    await this.publishUserDataChangedEvent();
  }

  @SubscribeMessage('set-nickname')
  setNickname(
    @MessageBody() data: { nickname: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const { nickname } = data;
    const client = this.connectedClients.get(socket);
    client.nickname = nickname;
  }

  @SubscribeMessage('room-list')
  getRooms(): WsResponse<any> {
    return {
      event: 'room-list',
      data: this.gameRoomService.getRooms(),
    };
  }

  @SubscribeMessage('create-room')
  createRoom(
    @MessageBody() createRoomRequest: CreateRoomRequest,
    @ConnectedSocket() socket: Socket,
  ) {
    const client = this.connectedClients.get(socket);
    const roomId = this.gameRoomService.createRoom(client, createRoomRequest);
    this.publishRoomDataChangedEvent();

    return {
      event: 'create-room',
      data: {
        success: true,
        roomId,
      },
    };
  }

  @SubscribeMessage('enter-room')
  async enterRoom(
    @MessageBody('roomId') roomId: string,
    @ConnectedSocket() socket: Socket,
  ) {
    const client = this.connectedClients.get(socket);
    this.gameRoomService.enterRoom(client, roomId);

    await this.connectUserUseCase.enterRoom({
      userId: String(client.tmpUserId),
      userNickName: client.nickname,
    });

    this.publishRoomDataChangedEvent();
    await this.publishUserDataChangedEvent();
  }

  @SubscribeMessage('leave-room')
  async leaveRoom(
    @MessageBody('roomId') roomId: string,
    @ConnectedSocket() socket: Socket,
  ) {
    const client = this.connectedClients.get(socket);
    this.gameRoomService.leaveRoom(client.nickname, roomId);

    await this.connectUserUseCase.leaveRoom({
      userId: String(client.tmpUserId),
      userNickName: client.nickname,
    });

    this.publishRoomDataChangedEvent();
    await this.publishUserDataChangedEvent();
  }

  @SubscribeMessage('send-chat')
  sendChatToRoom(
    @MessageBody() data: { roomId: string; message: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const { roomId, message } = data;
    const room = this.gameRoomService.findRoomById(roomId);
    const client = this.connectedClients.get(socket);

    room.sendAll('chat', {
      from: client.nickname,
      to: 'room',
      message,
    });
  }

  @SubscribeMessage('send-mafia')
  sendMafia(
    @MessageBody() data: { roomId: string; message: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const { roomId, message } = data;
    const room = this.gameRoomService.findRoomById(roomId);
    const client = this.connectedClients.get(socket);

    room.sendMafia('chat-mafia', {
      from: client.nickname,
      to: 'maifa',
      message,
    });
  }

  @SubscribeMessage('start-game')
  async startGame(@MessageBody('roomId') roomId: string) {
    const room = this.gameRoomService.findRoomById(roomId);
    if (!room.isFull()) {
      return {
        event: 'start-game',
        data: { success: false },
      };
    }
    this.startGameUsecase.start(room);
  }

  @SubscribeMessage('vote-candidate')
  async voteCandidate(
    @MessageBody() voteCandidateRequest: VoteCandidateRequest,
  ) {
    const room = this.gameRoomService.findRoomById(voteCandidateRequest.roomId);
    await this.voteMafiaUsecase.vote(
      room,
      voteCandidateRequest.from,
      voteCandidateRequest.to,
    );
  }

  @SubscribeMessage('cancel-vote-candidate')
  async cancelVoteCandidate(
    @MessageBody() voteCandidateRequest: VoteCandidateRequest,
  ) {
    const room = this.gameRoomService.findRoomById(voteCandidateRequest.roomId);
    await this.voteMafiaUsecase.cancelVote(
      room,
      voteCandidateRequest.from,
      voteCandidateRequest.to,
    );
  }

  @SubscribeMessage('select-mafia-target')
  async selectMafiaTarget(
    @MessageBody() selectMafiaTargetRequest: SelectMafiaTargetRequest,
  ) {
    const room = this.gameRoomService.findRoomById(
      selectMafiaTargetRequest.roomId,
    );
    await this.mafiaKillUseCase.selectMafiaTarget(
      room,
      selectMafiaTargetRequest.from,
      selectMafiaTargetRequest.target,
    );
  }

  private publishRoomDataChangedEvent() {
    this.eventManager.publish(Event.ROOM_DATA_CHANGED, {
      event: 'room-list',
      data: this.gameRoomService.getRooms(),
    });
  }

  private async publishUserDataChangedEvent() {
    const onLineUserList = await this.connectUserUseCase.getOnLineUserList();
    this.eventManager.publish(Event.USER_DATA_CHANGED, {
      event: 'online-user-list',
      data: onLineUserList,
    });
  }
}
