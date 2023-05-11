import { Redis } from "ioredis";
import { Player } from "../config/interfaces.config";
import { CONSTANTS } from "../config/constants.config";

export const deletePlayerGamePlay = async (redisClient: Redis, playerId: string, getDeleted: boolean = false) : Promise<Player | boolean> => {
    return new Promise(async (resolve, reject) => {
        try {
            const KEY = `${CONSTANTS.PLAYER.DB_PREFIX}~${playerId}`;
            if (getDeleted) {
                const playerGamePlay = await redisClient.get(KEY);
                if (playerGamePlay) {
                    resolve(JSON.parse(playerGamePlay) as Player);
                } else {
                    reject({ message: 'you are player game play that does not exist!' });
                }
            } else {
                await redisClient.del(KEY);
                resolve(true);
            }

        } catch(e) {
            reject(e);
        }
    })
}

export const getPlayerGamePlay = async (redisClient: Redis, playerId: string) : Promise<Player> => {
    return new Promise(async (resolve, reject) => {
        try {
            const KEY = `${CONSTANTS.PLAYER.DB_PREFIX}~${playerId}`;
            const playerGamePlay = await redisClient.get(KEY);
            if (playerGamePlay) {
                resolve(JSON.parse(playerGamePlay) as Player);
            } else {
                reject({ message: 'failed getting player game play on redis!'});
            }
        } catch(e) {
            reject(e);
        }
    })
}

export const updatePlayerGamePlay = async (redisClient: Redis, player: Player) : Promise<Player> => {
    return new Promise(async (resolve, reject) => {
        try {

            const KEY = `${CONSTANTS.PLAYER.DB_PREFIX}~${player._id}`;
            const stored = await redisClient.set(KEY, JSON.stringify(player));

            if (stored === 'OK') {
                resolve(player);
            } else {
                reject({ message: 'failed updating player game play on redis!'});
            }

        } catch(e) {
            reject(e);
        }
    })
}