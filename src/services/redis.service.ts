import Redis from 'ioredis';

export class RedisClient
{
    M_production = false;
    M_client : any = null;
    constructor(
        {
            production,
            host,
            port,
            password = undefined,
            db = undefined
        } : {
            production: boolean,
            host: string,
            port: string,
            password?: string | undefined,
            db?: string | undefined
        }
    ) {
        try {
            this.M_production = production;

            var redisConfiguration : any = {
                host: host,
                port: parseInt(port)
            }

            if (this.M_production && (!password || password == '' || !db || db == '')) {
                throw new Error(`'db' & 'password' is required in production mode.`);
            } else {
                redisConfiguration['password'] = password;
                redisConfiguration['database'] = parseInt((db as string));
            }

            this.M_client = new Redis(redisConfiguration);
        } catch(e: any) {
            throw new Error(e);
        }
    }

    getClient() { return this.M_client; }

    async duplicateConnection() {
        var duplicate = this.M_client.duplicate();
        duplicate.connect().then(() => {
            return;
        }).catch((e: any) => {
            throw new Error(e);
        })

        return duplicate;
    }

    async setRedisKeyValue({
        key,
        value,
        isJSON
    } : {
        key: string,
        value: any,
        isJSON: boolean
    }) {
        return new Promise(async (resolve, reject) => {
            try {
                value = isJSON ? JSON.stringify(value) : value;
                const stored = await this.M_client.set(key, value)

                if (stored === 'OK') {
                    resolve({
                        success: true,
                        stored: isJSON ? JSON.parse(value) : value
                    })
                } else {
                    resolve({
                        success: false,
                        message: 'failed storing value on redis server'
                    })
                }

            } catch(e : any) {
                resolve({
                    success: false,
                    message: e.message
                })
            }
        })
    }

    async getRedisKeyValue({
        key, 
        isJSON
    } : {
        key: string,
        isJSON: boolean
    }) {
        return new Promise(async (resolve, reject) => {
            try {
                var value = await this.M_client.get(key)

                if (value) {
                    if (isJSON) value = JSON.parse(value)

                    resolve({
                        success: true,
                        value
                    })
                } else {
                    resolve({
                        success: false,
                        message: 'not found'
                    })
                }
            } catch(e: any) {
                resolve({
                    success: false,
                    message: `redis failed : ${e.message}`
                })
            }
        })
    }
}