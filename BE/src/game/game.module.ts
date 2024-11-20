import { Module } from '@nestjs/common';
import { RandomJobFactory } from './usecase/allocate-user-role/random.job.factory';
import { JOB_FACTORY } from './usecase/allocate-user-role/job.factory';
import { ALLOCATE_USER_ROLE_USECASE } from './usecase/allocate-user-role/allocate.user-role.usecase';
import { TypeormGameHistoryRepository } from './repository/typeorm.game-history.repository';
import { GAME_HISTORY_REPOSITORY } from './repository/game-history.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistoryEntity } from './entity/game-history.entity';
import { COUNTDOWN_TIMER } from './usecase/countdown/countdown.timer';
import { MafiaCountdownTimer } from './usecase/countdown/mafia.countdown.timer';
import { COUNTDOWN_TIMEOUT_USECASE } from './usecase/countdown/countdown.timeout.usecase';
import { VOTE_MANAGER } from './usecase/vote-manager/vote-manager';
import { TotalGameManager } from './total.game-manager';
import { AllocateUserRoleService } from './usecase/allocate-user-role/allocate.user-role.service';
import { CountdownTimeoutService } from './usecase/countdown/countdown.timeout.service';
import { VOTE_MAFIA_USECASE } from './usecase/vote-manager/vote.mafia.usecase';
import { VoteMafiaService } from './usecase/vote-manager/vote.mafia.service';
import { ArgumentState } from './fsm/states/argument.state';
import { DiscussionState } from './fsm/states/discussion.state';
import { MafiaState } from './fsm/states/mafia.state';
import { PrimaryVoteState } from './fsm/states/primary-vote.state';
import { START_GAME_USECASE } from './usecase/start-game/start-game.usecase';
import { DoctorState } from './fsm/states/doctor.state';
import { PoliceState } from './fsm/states/police.state';
import { VideoServerModule } from 'src/video-server/video-server.module';
import { SetUpState } from './fsm/states/set-up.state';
import { StartGameService } from './usecase/start-game/start-game.service';
import { FinalVoteState } from './fsm/states/final-vote.state';
import { POLICE_MANAGER } from './usecase/role-playing/police-manager';
import { POLICE_INVESTIGATE_USECASE } from './usecase/role-playing/police.investigate.usecase';
import { PoliceInvestigateService } from './usecase/role-playing/police.investigate.service';
import { MAFIA_KILL_USECASE } from './usecase/role-playing/mafia.kill.usecase';
import { MafiaKillService } from './usecase/role-playing/mafia.kill.service';
import { MAFIA_MANAGER } from './usecase/role-playing/mafia-manager';
import { DOCTOR_MANAGER } from './usecase/role-playing/doctor-manager';
import { DOCTOR_CURE_USECASE } from './usecase/role-playing/doctor.cure.usecase';
import { DoctorCureService } from './usecase/role-playing/doctor.cure.service';

@Module({
  imports: [TypeOrmModule.forFeature([GameHistoryEntity]), VideoServerModule],
  providers: [
    {
      provide: JOB_FACTORY,
      useClass: RandomJobFactory,
    },
    {
      provide: ALLOCATE_USER_ROLE_USECASE,
      useClass: AllocateUserRoleService,
    },
    {
      provide: GAME_HISTORY_REPOSITORY,
      useClass: TypeormGameHistoryRepository,
    },
    {
      provide: COUNTDOWN_TIMER,
      useClass: MafiaCountdownTimer,
    },
    {
      provide: COUNTDOWN_TIMEOUT_USECASE,
      useClass: CountdownTimeoutService,
    },
    TotalGameManager,
    {
      provide: VOTE_MANAGER,
      useExisting: TotalGameManager,
    },
    {
      provide: VOTE_MAFIA_USECASE,
      useClass: VoteMafiaService,
    },
    {
      provide: START_GAME_USECASE,
      useClass: StartGameService,
    },
    {
      provide: POLICE_MANAGER,
      useExisting: TotalGameManager,
    },
    {
      provide: POLICE_INVESTIGATE_USECASE,
      useClass: PoliceInvestigateService,
    },
    {
      provide: MAFIA_MANAGER,
      useExisting: TotalGameManager,
    },
    {
      provide: MAFIA_KILL_USECASE,
      useClass: MafiaKillService,
    },
    {
      provide: DOCTOR_MANAGER,
      useExisting: TotalGameManager,
    },
    {
      provide: DOCTOR_CURE_USECASE,
      useClass: DoctorCureService,
    },
    ArgumentState,
    DiscussionState,
    DoctorState,
    MafiaState,
    PoliceState,
    SetUpState,
    PrimaryVoteState,
    FinalVoteState,
  ],
  exports: [
    START_GAME_USECASE,
    ALLOCATE_USER_ROLE_USECASE,
    COUNTDOWN_TIMEOUT_USECASE,
    VOTE_MAFIA_USECASE,
    POLICE_INVESTIGATE_USECASE,
    MAFIA_KILL_USECASE,
    DOCTOR_CURE_USECASE,
  ],
})
export class GameModule {}
