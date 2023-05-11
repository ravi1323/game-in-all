import { Redis } from "ioredis";
import { Server } from "socket.io";
import { getPlayerGamePlay, updatePlayerGamePlay } from "../../helpers/player.helper";
import { getTableGamePlay } from "../../helpers/table.helper";
import { Player, Table } from "../../config/interfaces.config";

export const userTurnTimerProcess = async (job, done) : Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {   

            const userId : string = job.data.userId;
            const tableId : string = job.data.tableId;
            const redisClient : Redis = job.data.redisClient;
            const IO : Server = job.data.redisClient;

            if ( !userId || !tableId || !redisClient || !IO ) {
                reject(new Error("userId & tableId & redisClient & IO is missing in process argument."));
            } else {

                /**
                 * fetch player game play data
                 */
                const tableGamePlay : Table = await getTableGamePlay(redisClient, tableId);
                if (!tableGamePlay) reject(new Error("table game play is not found in userTurnTimerProcess"));

                /**
                 * fetch player game play data
                 */
                let playerGamePlay : Player = await getPlayerGamePlay(redisClient, userId);
                if (!playerGamePlay) reject(new Error("player game play is not found in userTurnTimerProcess"));

                /**
                 * update player game play data.
                 */
                playerGamePlay.turnCount++;
                playerGamePlay = await updatePlayerGamePlay(redisClient, playerGamePlay);
                if (!playerGamePlay) reject(new Error('failed updating player game play in userTurnTimerProcess'));

                /**
                 * Remaining time Finder
                 */
                // TODO: left here...   
            }

        } catch(e) {
            reject(e);
        }
    })
}