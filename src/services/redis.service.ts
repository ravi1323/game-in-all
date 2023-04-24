import Redis from 'ioredis';

export class RedisClient {
  mProduction = false;
  mClient: any = null;
  constructor({
    production,
    host,
    port,
    password = null,
    db = null,
  }: {
    production: boolean;
    host: string;
    port: string;
    password?: string | null;
    db?: string | null;
  }) {
    try {
      this.mProduction = production;

      const redisConfiguration: any = {
        host,
        port: parseInt(port, 10),
      };

      if (this.mProduction && (!password || password === '' || !db || db === '')) {
        throw new Error(`'db' & 'password' is required in production mode.`);
      } else {
        redisConfiguration.password = password;
        redisConfiguration.database = parseInt(db as string, 10);
      }

      this.mClient = new Redis(redisConfiguration);
    } catch (e: any) {
      throw new Error(e);
    }
  }

  getClient() {
    return this.mClient;
  }

  async duplicateConnection() {
    const duplicate = this.mClient.duplicate();
    duplicate
      .connect()
      .then(() => {
        return;
      })
      .catch((e: any) => {
        throw new Error(e);
      });

    return duplicate;
  }

  async setRedisKeyValue({ key, value, isJSON }: { key: string; value: any; isJSON: boolean }) {
    return new Promise(async (resolve, reject) => {
      try {
        value = isJSON ? JSON.stringify(value) : value;
        const stored = await this.mClient.set(key, value);

        if (stored === 'OK') {
          resolve({
            success: true,
            stored: isJSON ? JSON.parse(value) : value,
          });
        } else {
          resolve({
            success: false,
            message: 'failed storing value on redis server',
          });
        }
      } catch (e: any) {
        resolve({
          success: false,
          message: e.message,
        });
      }
    });
  }

  async getRedisKeyValue({ key, isJSON }: { key: string; isJSON: boolean }) {
    return new Promise(async (resolve, reject) => {
      try {
        let value = await this.mClient.get(key);

        if (value) {
          if (isJSON) value = JSON.parse(value);

          resolve({
            success: true,
            value,
          });
        } else {
          resolve({
            success: false,
            message: 'not found',
          });
        }
      } catch (e: any) {
        resolve({
          success: false,
          message: `redis failed : ${e.message}`,
        });
      }
    });
  }
}
