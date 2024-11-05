import { JobFactory } from './job.factory';
import { MAFIA_ROLE } from './mafia.role';
import { Injectable } from '@nestjs/common';
import { GameInvalidPlayerCountError } from '../common/error/game.invalid.player.count.error';
import { errorMessage } from '../common/error/error.message';
import { errorCode } from '../common/error/error.code';
import { RoleCountNegativeError } from '../common/error/role.count.negative.error';

@Injectable()
export class RandomJobFactory implements JobFactory {
  /*
    유저가 6명일 때, 마피아 2, 경찰 1, 시민 3
    유저가 7명일 때, 마피아 2, 경찰 1, 의사 1, 시민 3
    유저가 8명일 때, 마피아 3, 경찰 1, 의사 1, 시민 3
   */
  allocateGameRoles(playerIds: Array<number>): Record<number, MAFIA_ROLE> {
    const userCount = playerIds.length;
    return this.allocate(userCount);
  }

  private allocate(userCount: number): Record<number, MAFIA_ROLE> {
    let possibleRoles: Array<MAFIA_ROLE>;
    switch (userCount) {
      case 6:
        possibleRoles = this.makeRoles(2, 1, 0, 3);
        break;
      case 7:
        possibleRoles = this.makeRoles(2, 1, 1, 3);
        break;
      case 8:
        possibleRoles = this.makeRoles(3, 1, 1, 3);
        break;
      default:
        throw new GameInvalidPlayerCountError(errorMessage.GAME_INVALID_PLAYER_COUNT_ERROR, errorCode.NOT_FOUND_GAME_HISTORY_ERROR);
    }
    const userRoles: Record<number, MAFIA_ROLE> = {};
    this.shuffle(possibleRoles).forEach((role, idx) => {
      userRoles[idx] = role;
    });
    return userRoles;
  }

  private shuffle(possibleRoles: Array<MAFIA_ROLE>): Array<MAFIA_ROLE> {
    return possibleRoles.sort(() => Math.random() - 0.5);
  }

  private makeRoles(mafia: number, police: number, doctor: number, citizen: number): Array<MAFIA_ROLE> {
    this.verifyNegativeNumber(mafia, police, doctor, citizen);
    return [
      ...Array(mafia).fill(MAFIA_ROLE.MAFIA),
      ...Array(police).fill(MAFIA_ROLE.POLICE),
      ...Array(doctor).fill(MAFIA_ROLE.DOCTOR),
      ...Array(citizen).fill(MAFIA_ROLE.CITIZEN),
    ];
  }

  private verifyNegativeNumber(mafia: number, police: number, doctor: number, citizen: number) {
    if (mafia < 0 || police < 0 || doctor < 0 || citizen < 0) {
      throw new RoleCountNegativeError(errorMessage.ROLE_COUNT_NEGATIVE_ERROR, errorCode.ROLE_COUNT_NEGATIVE_ERROR);
    }
  }
}