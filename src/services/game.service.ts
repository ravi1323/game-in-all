import { Socket } from 'socket.io';
import { CONSTANTS } from '../config/constants.config';
import { HttpServer } from './http.service';
import { SocketIO } from './socket.service';
import { makeResponse, sendDebug } from '../helpers/util.helper';
import { validateJoinDebug, validateSignupPayload } from '../middewares/auth.middeware';
import { Callback, Player, Validation } from '../config/interfaces.config';
import { RedisClient } from './redis.service';
import { createNewUser, getUser, updateUser } from '../helpers/user.helper';
import { deleteTableGamePlay, getTableGamePlay } from '../helpers/table.helper';
import { deletePlayerGamePlay, getPlayerGamePlay, updatePlayerGamePlay } from '../helpers/player.helper';
import { validateRejoinPayload } from '../middewares/game.middleware';
import { UserInternetIssueQueue, getInternetIssueTimer } from '../bull/index.bull';
import { internetDissconnect } from '../bull/processes/internet.process';
import Bull from 'bull'

export class Game {
  playersPerMatch = 0;
  matchDuration = 5 * 60 * 1000; // 5 minute (in miliseconds)
  entryFees = [];
  minimumPlayersToPlay = 2;
  mProduction = false;
  httpServer: any = null;
  IO: any = null;
  redisClient = null;
  InternetIssueJob = null;
  InternetIssueTimer : Bull.Queue<any> = null;

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
    redisPassword,
  }: {
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
      this.redisClient = new RedisClient({
        production: mProduction,
        host: redisHost,
        port: redisPort,
        db: redisDB,
        password: redisPassword,
      });

      this.httpServer = mProduction
        ? new HttpServer({ production: mProduction, port: httpPort, key, cert })
        : new HttpServer({ production: mProduction, port: httpPort });
      const socketServer = new SocketIO({ httpServer: this.httpServer.getServer() });
      this.IO = socketServer.getIO();

      this.IO.on(CONSTANTS.SOCKET.EVENTS.CORE.CONNECT, async (socket: Socket) => {
        const handlers = {};

        handlers[`${CONSTANTS.SOCKET.EVENTS.CUSTOM.SIGNUP}`] = async (data, acknowledgement, socketI, eventName) =>
          await this.signup(data, acknowledgement, socketI, eventName);
        handlers[`${CONSTANTS.SOCKET.EVENTS.CUSTOM.JOIN_DEBUG}`] = async (data, acknowledgement, socketI, eventName) =>
          await this.joinDebug(data, acknowledgement, socketI, eventName);

        await socketServer.handleEvents(socket, handlers);
      });
    }

    /**
     * bull register.
     */
    this.InternetIssueJob = UserInternetIssueQueue({
      redis: {
        host: redisHost,
        db: parseInt(redisDB),
        port: parseInt(redisPort),
        password: redisPassword
      }
    });
    this.InternetIssueTimer = getInternetIssueTimer({
      redis: {
        host: redisHost,
        db: parseInt(redisDB),
        port: parseInt(redisPort),
        password: redisPassword
      }
    })
    this.InternetIssueJob.process(internetDissconnect);
  }

  async signup(data: any, acknowledgement: Callback, socket: Socket, eventName: string) : Promise<void> {
    /**
     * USER SCHEMA 
     * {
     *    deviceId: String,
     *    name: String,
     *    socketId: String,
     *    tableId: String
     * }
     */

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
          sendDebug(this.IO, {
            ...isValid.errors,
            en: eventName,
          });
          resolve();
        } else {

          var user = await getUser(this.redisClient.mClient, data.deviceId).catch(e => {
            sendDebug(this.IO, {
              msg: `something went wrong : ${e.message}`
            })
          });
            
          if (user) {

            /**
             * update the player socket.id on redis
             */
            user.socketId = socket.id;
            user = await updateUser(this.redisClient.mClient, user);

            // update user auth id on socket with his / her deviceId
            socket.handshake.auth.id = user.deviceId;

            /**
             * sending signup responses
             */
            if (acknowledgement)
              acknowledgement(makeResponse({
                msg: 'signup successfully.',
              }))

            socket.emit(
              eventName,
              makeResponse({
                msg: 'signup successfully.',
              }),
            );

            sendDebug(this.IO, {
              msg: `new signup came in`,
              user
            });

            /**
             * check if player was already in any game.
             */
            if (user && user.tableId !== "") {

              const tableGamePlay = await getTableGamePlay(this.redisClient.mClient, user.tableId).catch(e => {
                if (acknowledgement)
                  acknowledgement(makeResponse({
                    msg: `something went wrong : ${e.message}`
                  }))

                socket.emit(CONSTANTS.SOCKET.EVENTS.CUSTOM.FAIL, makeResponse({
                  msg: `something went wrong : ${e.message}`
                }))

                sendDebug(this.IO, {
                  msg: `something went wrong : ${e.message}`
                })
              });

              /**
               * checking tableGamePlay is not neccessory,
               * removing .catch() block should give us freedom,
               * but possible return is void (undefined) too.
               */
              if (tableGamePlay) {

                if (tableGamePlay.isWaiting) {

                  /**
                   * remove empty table
                   */
                  await deleteTableGamePlay(this.redisClient.mClient, tableGamePlay._id, true);

                  /**
                   * remove player game play (PGP)
                   */
                  await deletePlayerGamePlay(this.redisClient.mClient, user.deviceId);

                  /**
                   * remove table game play (TGP)
                   */
                  await deleteTableGamePlay(this.redisClient.mClient, tableGamePlay._id);

                  socket.leave(socket.handshake.auth.tableId);

                  /**
                   * TODO: if player does not want show the lobby,
                   * then @selectTable needs to be called, and entryFees, chips, userId should be in SIGN_UP event payload.
                   */

                } else {
                  // FIXME: rejoin is in pending... TODO: left here..
                }
                
              } else {
                if (acknowledgement)
                  acknowledgement(makeResponse({
                    msg: `failed getting tableGamePlay : ${tableGamePlay}`
                  }))

                socket.emit(CONSTANTS.SOCKET.EVENTS.CUSTOM.FAIL, makeResponse({
                  msg: `failed getting tableGamePlay : ${tableGamePlay}`
                }))

                sendDebug(this.IO, {
                  msg: `failed getting tableGamePlay : ${tableGamePlay}`
                })
                
              }
              
            }

          } else {
            await createNewUser(this.redisClient.mClient, {
              deviceId: data.deviceId,
              name: data.name,
              socketId: socket.id,
              tableId: ""
            }).catch(e => {
              sendDebug(this.IO, {
                msg: `something went wrong : ${e.message}`
              })
            });

            socket.emit(
              eventName,
              makeResponse({
                msg: 'signup successfully.',
              }),
            );

            sendDebug(this.IO, {
              msg: `new signup came in`,
              user
            });
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

        sendDebug(this.IO, {
          msg: `signup failed : ${e.message}`,
        });
        reject(e);
      }
    });
  }

  async selectTable(data: any, acknowledgement: Callback, socket: Socket, eventName: string) : Promise<void> {
    return new Promise((resolve, reject) => {
      try {

        sendDebug(this.IO, {
          msg: 'player came for selectTable event.'
        })

      } catch(e) {
        if (acknowledgement)
          acknowledgement(makeResponse({
            msg: `something went wrong in selectTable : ${e.message}`
          }))
        sendDebug(this.IO, {
          msg: `something went wrong in selectTable : ${e.message}`
        })
      }
    })
  }

  async rejoin(data: any, acknowledgement: Callback, socket: Socket, eventName: string) : Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {

        let rematchTimer: number = 0;
        let GlobalremaingTime: number = 0;

        /**
         * validate rejoin payload
         */
        const isValid : Validation = validateRejoinPayload(data);

        // if not valid stop further execution.
        if (!isValid) {
          if (acknowledgement) 
            acknowledgement(makeResponse({
              ...isValid
            }))
          socket.emit(CONSTANTS.SOCKET.EVENTS.CUSTOM.FAIL, makeResponse({
            ...isValid
          }))
          resolve();
        }

        /**
         * if payload is valid continue.
         * store data on thier socket connection.
         */
        socket.handshake.auth.userId = data.userId;
        socket.handshake.auth.tableId = data.tableId;

        /**
         * fetch the user data.
         */
        let user = await getUser(this.redisClient.mClient, data.userId);
        if (!user) {
          if (acknowledgement) 
            acknowledgement(makeResponse({
              msg: `failed getting user on redis.`
            }))
          socket.emit(CONSTANTS.SOCKET.EVENTS.CUSTOM.FAIL, makeResponse({
            msg: 'failed getting user on redis.'
          }))
          resolve();
        }

        /**
         * update the user data
         */
        user.socketId = socket.id;
        user = await updateUser(this.redisClient.mClient, user);
        if (!user) {
          if (acknowledgement) 
            acknowledgement(makeResponse({
              msg: `failed updating user on redis.`
            }))
          socket.emit(CONSTANTS.SOCKET.EVENTS.CUSTOM.FAIL, makeResponse({
            msg: 'failed updating user on redis.'
          }))
          resolve();
        }

        /**
         * fetch player game play
         */
        let playerGamePlay : Player = await getPlayerGamePlay(this.redisClient.mClient, data.userId);
        if (!playerGamePlay) {
          if (acknowledgement)
            acknowledgement(makeResponse({
              msg: 'failed getting player game play on redis.'
            }))
          socket.emit(CONSTANTS.SOCKET.EVENTS.CUSTOM.FAIL, makeResponse({
            msg: 'failed getting player game play on redis.'
          }))
          resolve();
        }

        /**
         * update player game play
         */
        playerGamePlay.state = 'P';
        playerGamePlay.isDisconnected = false;
        playerGamePlay = await updatePlayerGamePlay(this.redisClient.mClient, playerGamePlay);
        if (!playerGamePlay) {
          if (acknowledgement)
            acknowledgement(makeResponse({
              msg: 'failed updating player game play on redis.'
            }))
          socket.emit(CONSTANTS.SOCKET.EVENTS.CUSTOM.FAIL, makeResponse({
            msg: 'failed updating player game play on redis.'
          }))
          resolve();
        }

        /**
         * get letest data of the player.
         */
        const playerGamePlay__leatest = await getPlayerGamePlay(this.redisClient.mClient, data.userId)

        if (playerGamePlay__leatest) {

          const job = await this.InternetIssueTimer.getJob(data.userId);
          if (job) job.remove();
          else sendDebug(this.IO, makeResponse({
            msg: 'failed getting internetissuetimer job.'
          }))

          // TODO: left here...

          
        }

      } catch(e) {
        reject(e);
      }
    })
  }

  async playGame(data: any, acknowledgement: Callback, socket: Socket, eventName: string): Promise<void> {
    /**
     * validate : deviceId
     */
    const isValid : Validation = validateSignupPayload(data);

    if (!isValid.valid) {
      socket.emit(CONSTANTS.SOCKET.EVENTS.CUSTOM.PLAY_GAME_FAIL); // TODO: left here...
    }
  }

  async joinDebug(data: any, acknowledgement: Callback, socket: Socket, eventName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const isValid: Validation = validateJoinDebug(data);

        if (!isValid.valid) {
          if (acknowledgement)
            acknowledgement(
              makeResponse({
                ...isValid.errors,
              }),
            );
          socket.emit(
            CONSTANTS.SOCKET.EVENTS.CUSTOM.FAIL,
            makeResponse({
              ...isValid.errors,
            }),
          );
        } else {
          socket.join(CONSTANTS.SOCKET.GLOBAL_ROOMS.DEBUG);
          if (acknowledgement) {
            acknowledgement(
              makeResponse({
                msg: `joined successfully, you'll get all debug messages from now on`,
              }),
            );
          } else {
            socket.emit(
              CONSTANTS.SOCKET.EVENTS.CUSTOM.JOIN_DEBUG_SUCCESS,
              makeResponse({
                msg: `joined successfully, you'll get all debug messages from now on`,
              }),
            );
          }
        }
      } catch (e) {
        if (acknowledgement) {
          acknowledgement(
            makeResponse({
              msg: `something went wrong : ${e.message}`,
            }),
          );
        } else {
          socket.emit(
            CONSTANTS.SOCKET.EVENTS.CUSTOM.JOIN_DEBUG_FAIL,
            makeResponse({
              msg: `something went wrong : ${e.message}`,
            }),
          );
        }
      }
    });
  }
}
