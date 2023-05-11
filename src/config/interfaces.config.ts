export type Callback = (data: any) => string;
export interface NewUser {
  deviceId: string;
  name: string;
  socketId: string;
  tableId: string;
}
export interface Validation {
  valid: boolean;
  errors?: object;
}

export interface UserErrorInterface {
  name: string[];
  deviceId: string[];
}

export interface Password {
  hash: string;
  salt: string;
}

export interface Table {
  _id: string,
  isWaiting: boolean,
  playerList: PlayerListPlayer[]
}

export interface Player {
  _id: string,
  state: string, // 'P'
  isDisconnected: boolean,
  turnCount: number,
  colorType: string
}

export interface RejoinDataErrors {
  userId: string[],
  tableId: string[]
}

export interface PlayingData {
  en: string,
  playerGamePlay: object,
  tableGamePlay: object,
  remainingTime: object
}

export interface PlayerListPlayer {
  userId: string,
  username: string,
  seatIndex: number,
  color: 'BLACK' | 'WHITE' | 'NONE'
}