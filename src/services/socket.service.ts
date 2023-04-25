import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { convertStringtoObject, isJsonString, makeResponse } from '../helpers/util.helper';

export class SocketIO
{
    IO : Server | null = null;

    constructor({
        httpServer
    } : {
        httpServer: HttpServer | HttpsServer
    }) {

        try {
            this.IO = new Server(httpServer, {
                cors: {
                    origin: ["*", "https://admin.socket.io"],
                    credentials: true
                },
                pingInterval: 4000,
                maxHttpBufferSize: 1e8,
                pingTimeout: 10000,
                connectionStateRecovery: {
                    // the backup duration of the sessions and the packets
                    maxDisconnectionDuration: 2 * 60 * 1000,
                    // whether to skip middlewares upon successful recovery
                    skipMiddlewares: false,
                },
                allowEIO3: true
            });
        } catch(e: any) {
            throw new Error(e);
        }
    }

    getIO() : Server | null
    {
        return this.IO;
    }

    async handleEvents(socket: Socket, handlers: object) {
        return new Promise((resolve, reject) => {
            
            socket.onAny(async (eventName, value, acknowledgement) => {
                try {
                    
                    if (typeof value === 'string') value = convertStringtoObject(value);
                    const data = isJsonString(value) ? JSON.parse(value) : value;

                    handlers[eventName] ? handlers[eventName](data, acknowledgement, socket, eventName) : (() => {
                        socket.emit('fail', makeResponse({
                            msg: 'not a gameinall events'
                        }))
                    })();

                } catch(e) {
                    socket.emit('failed', makeResponse({
                        msg: e.message
                    }))
                    reject(e);
                }
            })
        })
    }
}