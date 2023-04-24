import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { CONSTANTS } from '../config/constants.config';

export class SocketIO {
  IO: Server | null = null;
  constructor({ httpServer }: { httpServer: HttpServer | HttpsServer }) {
    this.IO = new Server(httpServer, {
      cors: {
        origin: ['*', 'https://admin.socket.io'],
        credentials: true,
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
      allowEIO3: true,
    });

    this.IO.on(CONSTANTS.SOCKET.EVENTS.CORE.CONNECT, (socket) => {
      return;
    });
  }
}
