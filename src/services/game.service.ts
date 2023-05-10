import { Socket } from 'socket.io';
import { CONSTANTS } from '../config/constants.config';
import { HttpServer } from './http.service';
import { SocketIO } from './socket.service';
import { makeResponse, sendDebug } from '../helpers/util.helper';
import { validateJoinDebug, validateSignupPayload } from '../middewares/auth.middeware';
import { Validation } from '../config/interfaces.config';
import { RedisClient } from './redis.service';
import { createNewUser, getUser } from '../helpers/user.helper';

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
    if (playersPerMatch < CONSTANTS.GAME.REQUIRED_PLAYERS) throw new Error('match has to be atleast 2 players');
    if (matchDuration < CONSTANTS.GAME.REQUIRED_GAME_TIME) throw new Error('match duration has to be atleast 1 minute');
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
        var handlers = {};

        handlers[`${CONSTANTS.SOCKET.EVENTS.CUSTOM.SIGNUP}`] = async (data, acknowledgement, socketI, eventName) =>
          await this.signup(data, acknowledgement, socketI, eventName);
        handlers[`${CONSTANTS.SOCKET.EVENTS.CUSTOM.JOIN_DEBUG}`] = async (data, acknowledgement, socketI, eventName) => 
          await this.joinDebug(data, acknowledgement, socketI, eventName);

        await socketServer.handleEvents(socket, handlers);
      });
    }
  }

  async signup(data: any, acknowledgement: any, socket: Socket, eventName: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const isValid: Validation = validateSignupPayload(data);

        if (!isValid.valid) {
          if (acknowledgement)
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
          sendDebug(this.IO, socket, {
            ...isValid.errors,
            en: eventName,
          })
          resolve();
        } else {
          const user = await getUser(this.redisClient, data.deviceId);

          if (user) {
            socket.emit(
              eventName,
              makeResponse({
                msg: 'signup successfully.',
              }),
            );

            sendDebug(this.IO, socket, {
              msg: `new signup came in socketId : ${socket.id} & userData : ${JSON.stringify(user)}`
            })
          } else {
            await createNewUser(this.redisClient, {
              deviceId: data.deviceId,
              name: data.name
            });

            socket.emit(
              eventName,
              makeResponse({
                msg: 'signup successfully.',
              }),
            );

            sendDebug(this.IO, socket, {
              msg: `new signup came in socketId : ${socket.id} & userData : ${JSON.stringify(user)}`
            })
          }

          resolve();
        }
      } catch (e) {

        if (acknowledgement)
          acknowledgement(
            makeResponse({
              msg: e.message,
              en: eventName,
            }),
          );
        socket.emit(
          CONSTANTS.SOCKET.EVENTS.CUSTOM.FAIL,
          makeResponse({
            msg: e.message,
            en: CONSTANTS.SOCKET.EVENTS.CUSTOM.FAIL,
          }),
        );

        sendDebug(this.IO, socket, {
          msg: `signup failed : ${e.message}`
        })
        reject(e);
      }
    });
  }

  async playGame(data: any, acknowledgement: any, socket: Socket, eventName: string) : Promise<void> {
    /**
     * validate : deviceId
     */
    const isValid = validateSignupPayload(data);

    if (!isValid.valid) {
      socket.emit(CONSTANTS.SOCKET.EVENTS.CUSTOM.PLAY_GAME_FAIL) // TODO: left here...
    }
  }

  async joinDebug(data: any, acknowledgement: any, socket: Socket, eventName: string) : Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const isValid : Validation = validateJoinDebug(data);

        if (!isValid.valid) {

          if (acknowledgement) 
            acknowledgement(makeResponse({
              ...isValid.errors
            }))
          socket.emit(CONSTANTS.SOCKET.EVENTS.CUSTOM.FAIL, makeResponse({
            ...isValid.errors
          }))
        } else {
          socket.join(CONSTANTS.SOCKET.GLOBAL_ROOMS.DEBUG);
          if (acknowledgement) 
          {
            acknowledgement(makeResponse({
              msg: `joined successfully, you'll get all debug messages from now on`
            }))
          } else 
          {
            socket.emit(CONSTANTS.SOCKET.EVENTS.CUSTOM.JOIN_DEBUG_SUCCESS, makeResponse({
              msg: `joined successfully, you'll get all debug messages from now on`
            }))
          }
        }
      } catch(e) {
        if (acknowledgement) 
        {
          acknowledgement(makeResponse({
            msg: `something went wrong : ${e.message}`
          }))
        } else 
        {
          socket.emit(CONSTANTS.SOCKET.EVENTS.CUSTOM.JOIN_DEBUG_FAIL, makeResponse({
            msg: `something went wrong : ${e.message}`
          }))
        }
      }
    })
  }
}
