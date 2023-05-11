export const CONSTANTS = {
  GAME: {
    REQUIRED_PLAYERS: 2,
    REQUIRED_GAME_TIME: 60000, // 1 minute -> 60 seconds -> 60000 miliseconds
  },
  SOCKET: {
    EVENTS: {
      CORE: {
        DISCONNECT: 'disconnect',
        CONNECT: 'connection'
      },
      CUSTOM: {
        TEST: 'TEST',
        REASON: 'REASON',
        FAIL: 'FAIL',
        SIGNUP: 'SIGNUP',
        PLAY_GAME: 'PLAY_GAME',
        PLAY_GAME_SUCCESS: 'PLAY_GAME_SUCCESS',
        PLAY_GAME_FAIL: 'PLAY_GAME_FAIL',
        DEBUG: 'DEBUG',
        JOIN_DEBUG: 'JOIN_DEBUG',
        JOIN_DEBUG_SUCCESS: 'JOIN_DEBUG_SUCCESS',
        JOIN_DEBUG_FAIL: 'JOIN_DEBUG_FAIL'
      }
    },
    GLOBAL_ROOMS: {
      DEBUG: 'DEBUG'
    },
  },
  USER: {
    DB_PREFIX: 'USERS',
    USER_TURN_TIMER: 'USER_TURN_TIMER'
  }, 
  PLAYER: {
    DB_PREFIX: 'PLAYER'
  },
  TABLE: {
    DB_PREFIX: 'TABLE'
  },
  EMPTY_TABLE: {
    DB_PREFIX: 'TABLE~EMPTY'
  },
  BULL:{
    INTERNET_ISSUE_QUEUE: 'INTERNET_ISSUE_QUEUE'
  },
  AUTH: {
    HASH: 'af30cb638386869981827e15a6bd33e4a6adc1ede47d45a2c18259835f149a53020c6427a53e8a23966ec0e0a04d2b7bc196f5ec807d3ab4747b7e8e61e901cb',
    SALT: '1dbe7316a095968c398afa94f3acdb32840e900c0227515e283cd924131775a4'
  }
};
