export const EXCEPTION_CODE = {
  GAME_INVALID_PLAYER_COUNT_EXCEPTION: 1000,
  ROLE_COUNT_NEGATIVE_EXCEPTION: 1001,
  NOT_FOUND_GAME_HISTORY_EXCEPTION: 1002,
  NOT_FOUND_USER_EXCEPTION: 1003,
  NOT_FOUND_GAME_USER_EXCEPTION: 1004,
  DUPLICATE_TIMER_EXCEPTION: 1005,
  NOT_FOUND_TIMER_EXCEPTION: 1006,
  NOT_FOUND_GAME_ROOM_EXCEPTION: 1007,
  NOT_FOUND_BALLOT_BOX_EXCEPTION: 1008,
  UNAUTHORIZED_USER_BALLOT_EXCEPTION: 1009,
  UNAUTHORIZED_USER_SELECT_EXCEPTION: 1010,
  CANNOT_SELECT_USER_EXCEPTION: 1011,
  NOT_FOUND_MAFIA_SELECT_LOG: 1012,
  NOT_FOUND_OPENVIDU_SESSION: 1013,
  FAILED_TO_CLOSE_OPENVIDU_SESSION: 1014,
  FAILED_TO_CREATE_OPENVIDU_SESSION: 1015,
  FAILED_TO_GENERATE_OPENVIDU_TOKEN: 1016,
  FAILED_TO_DISCONNECT_OPENVIDU_PARTICIPANT: 1017,
  FAILED_TO_FETCH_OPENVIDU_PARTICIPANT_LIST: 1018,
} as const;
