import { Socket } from 'socket.io';
import { CONSTANTS } from '../config/constants.config';
import { HttpServer } from './http.service';
import { SocketIO } from './socket.service';
import { makeResponse } from '../helpers/util.helper';
import { validateSignupPayload } from '../middewares/auth.middeware';
import { UserValidate } from '../config/interfaces.config';
import { RedisClient } from './redis.service';

export class Game {
  playersPerMatch = 0;
  matchDuration = 5 * 60 * 1000; // 5 minute (in miliseconds)
  entryFees = [];
  minimumPlayersToPlay = 2;
  mProduction = false;
  httpServer: any = null;
  IO: any = null;
  redisClient = null;

  constructor({
    mProduction,
    httpPort,
    playersPerMatch,
    matchDuration,
    entryFees,
    minimumPlayersToPlay,
    key = null,
    cert = null,
    redisHost,
    redisPort,
    redisDB,
    redisPassword
  } : {
    mProduction: boolean;
    httpPort: number;
    playersPerMatch: number;
    matchDuration: number;
    entryFees: number[];
    minimumPlayersToPlay: number;
    key?: any;
    cert?: any;
    redisHost: string;
    redisPort: string;
    redisDB: string;
    redisPassword: string;
  }) {
    if (playersPerMatch < 2) throw new Error('match has to be atleast 2 players');
    if (matchDuration < 60000) throw new Error('match duration has to be atleast 1 minute');
    if (entryFees.length < 1) throw new Error('provide a valid entry fees');
    if (minimumPlayersToPlay < 2) throw new Error('minimum 2 players are required to play the game.');

    if (mProduction && (!key || key === '' || !cert || cert === ''))
      throw new Error(`'{key}' & '{cert}' is required on production.`);
    else {
      this.redisClient = new RedisClient({ production: mProduction, host: redisHost, port: redisPort, db: redisDB, password: redisPassword});

      this.httpServer = mProduction
        ? new HttpServer({ production: mProduction, port: httpPort, key, cert })
        : new HttpServer({ production: mProduction, port: httpPort });
      const socketServer = new SocketIO({ httpServer: this.httpServer.getServer() });
      this.IO = socketServer.getIO();

      this.IO.on(CONSTANTS.SOCKET.EVENTS.CORE.CONNECT, async (socket: Socket) => {
        const handlers = {};

        handlers[`${CONSTANTS.SOCKET.EVENTS.CUSTOM.SIGNUP}`] = async (data, acknowledgement, socketI, eventName) =>
          this.signup(data, acknowledgement, socketI, eventName);

        await socketServer.handleEvents(socket, handlers);
      });
    }
  }

  async signup(data: any, acknowledgement: any, socket: Socket, eventName: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const isValid: UserValidate = validateSignupPayload(data);

        if (!isValid.valid) {
          acknowledgement(
            makeResponse({
              ...isValid.errors,
              en: eventName,
            }),
          );
          socket.emit(
            CONSTANTS.SOCKET.EVENTS.CUSTOM.FAIL,
            makeResponse({
              ...isValid.errors,
              en: CONSTANTS.SOCKET.EVENTS.CUSTOM.FAIL,
            }),
          );
        } else {
          const user = this.redisClient.getRedisKeyValue(data.deviceId, true);

          if (user.success) {
            socket.emit(
              eventName,
              makeResponse({
                msg: 'signup successfully.',
              }),
            );
          } else {
            await this.redisClient.setRedisKeyValue(data.deviceId, {
              deviceId: data.deviceId,
              createdAt: new Date()
            }, true);

            socket.emit(
              eventName,
              makeResponse({
                msg: 'signup successfully.',
              }),
            );
          }
        }
      } catch (e) {
        socket.emit(
          CONSTANTS.SOCKET.EVENTS.CUSTOM.FAIL,
          makeResponse({
            msg: e.message,
            en: CONSTANTS.SOCKET.EVENTS.CUSTOM.FAIL,
          }),
        );
        acknowledgement(
          makeResponse({
            msg: e.message,
            en: eventName,
          }),
        );
        reject(e);
      }
    });
  }

  async playGame(data: any, acknowledgement: any, socket: Socket, eventName: string) : Promise<void> {
    // TODO: left here...
  }
}
