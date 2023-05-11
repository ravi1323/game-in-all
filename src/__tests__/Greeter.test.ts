import { Game } from '../index';

test('Greet', () => {
  try {
    const game = new Game({
      mProduction: false,
      httpPort: 3000,
      playersPerMatch: 2,
      matchDuration: 5 * 60 * 1000,
      minimumPlayersToPlay: 2,
      entryFees: [100],
      redisHost: '127.0.0.1',
      redisPort: '6379',
      redisDB: '1',
      redisPassword: 'check'
    })
  } catch(e) {
    console.log(e.message)
  }
});

// test('Redis Service', async () => {
//   const RedisInst = new RedisClient({ production: false, host: '127.0.0.1', port: '6379' });

//   await RedisInst.setRedisKeyValue({ key: 'name', value: 'ravi', isJSON: false });

//   var data: any = await RedisInst.getRedisKeyValue({ key: 'name', isJSON: false });
//   data = data.value;
//   expect(data).toBe('ravi');
// });

// test('Http Service', () => {
//   const httpServer = new HttpServer({ production: false, port: 3000 });

//   const server = httpServer.getServer();

//   expect(server).not.toBeNull();
// });

// test('Socket Service', () => {
//   const httpServer = new HttpServer({ production: false, port: 3001 });

//   const socketServer = new SocketIO({ httpServer: httpServer.getServer() as Server });

//   expect(socketServer).not.toBeNull();
// });
