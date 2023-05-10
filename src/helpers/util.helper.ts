import { Server, Socket } from 'socket.io';
import { CONSTANTS } from '../config/constants.config';
import crypto from 'crypto';
import { Password } from '../config/interfaces.config';

export const makeResponse = (obj: object) => {
  return JSON.stringify(obj);
};

export const convertStringtoObject = (obj: any): object => {
  try {
    return typeof obj === 'object' ? obj : JSON.parse(obj);
  } catch (error: any) {
    return error;
  }
};

export const isJsonString = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

export const isJsonable = (data): boolean => {
  try {
    JSON.stringify(data);
    return true;
  } catch (e) {
    return false;
  }
};

export const sendDebug = (IO: Server, socket: Socket, data: any) => {
  // prepare the response in string.
  if (isJsonable(data)) {
    data = makeResponse(data);
  } else {
    data = makeResponse({
      value: data,
    });
  }

  // send it in the room
  const debugRoom = IO.sockets.adapter.rooms[CONSTANTS.SOCKET.GLOBAL_ROOMS.DEBUG];
  if (debugRoom.length > 0) {
    IO.to(CONSTANTS.SOCKET.GLOBAL_ROOMS.DEBUG).emit(CONSTANTS.SOCKET.EVENTS.CUSTOM.DEBUG, data);
  }
};

export const genPassword = (password: string): Password => {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');

  return {
    hash,
    salt,
  };
};

export const comparePassword = (password: string, hash: string, salt: string): boolean => {
  const newHash: string = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return newHash === hash;
};
