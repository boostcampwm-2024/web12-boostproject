import { HttpException, HttpStatus } from '@nestjs/common';
import { EXCEPTION_CODE } from './exception.code';
import { EXCEPTION_MESSAGE } from './exception.message';

export class NotFoundOpenviduSessionException extends HttpException {
  constructor() {
    super(
      {
        code: EXCEPTION_CODE.NOT_FOUND_TIMER_EXCEPTION,
        message: EXCEPTION_MESSAGE.NOT_FOUND_TIMER_EXCEPTION,
        error: 'NotFoundTimerException',
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
