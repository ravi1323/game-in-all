import { RedisClient } from './services/redis.service';
import { HttpServer } from './services/http.service';
import { SocketIO } from './services/socket.service';

export const Greet = () => "Hello world!";
export { RedisClient, HttpServer, SocketIO };
