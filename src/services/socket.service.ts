import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { CONSTANTS } from '../config/constants.config';

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

    async handleEvents(socket: Socket) {
        console.log(`new socket connection established : ${socket.id}`);
    }

    buildMatchMaking({
        playersPerMatch,
        matchDuration
    } : {
        playersPerMatch: number,
        matchDuration: number
    }) : void {
        this.IO.on(CONSTANTS.SOCKET.EVENTS.CORE.CONNECT, async (socket: Socket) => {
            await this.handleEvents(socket);
        })
    }
}