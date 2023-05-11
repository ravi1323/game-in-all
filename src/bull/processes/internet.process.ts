import { Redis } from "ioredis";
import { findNextPlayerTurn } from "../../helpers/game.helper";
import { getPlayerGamePlay } from "../../helpers/player.helper";
import { getTableGamePlay } from "../../helpers/table.helper";
import { Server } from "socket.io";
import { CONSTANTS } from "../../config/constants.config";
import { makeResponse } from "../../helpers/util.helper";

export const internetDissconnect = async (job, done) : Promise<void> => {
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
                 * fetching table game play data
                 */
                const tableGamePlay = await getTableGamePlay(redisClient, tableId);
                if (!tableGamePlay) reject(new Error("table game play not found"));

                /**
                 * fetching player game play data
                 */
                const playerGamePlay = await getPlayerGamePlay(redisClient, userId);
                if (!playerGamePlay) reject(new Error("player game play not found."));

                // FIXME: normal turn Stop Timer (25 seconds)

                // FIXME: Global Timer Stop Timer (10 minute)
                // FIXME: rematch timer stop Timer (10 seconds)

                /**
                 * send winning to oppononent
                 * find the next player turn
                 */
                const winnerId = findNextPlayerTurn(tableGamePlay.playerList, userId);
                process.stdout.write(winnerId);

                // FIXME: needs to be sended only to left player in game, not all.
                IO.to(tableId).emit(CONSTANTS.SOCKET.EVENTS.CUSTOM.REASON, makeResponse({
                    reason: 'You won, Opponent left last 1 minute',
                    code: 'GAMEOVER:DISCONNECTED:OTHER'
                }))

                resolve();
            }
        } catch(e) {
            reject(e);
        }
    })
}