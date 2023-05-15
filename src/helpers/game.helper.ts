import { Redis } from "ioredis";
import { PlayerListPlayer, Table } from "../config/interfaces.config";
import { getPlayerGamePlay } from "./player.helper";

export const findNextPlayerTurn = (playerList : PlayerListPlayer[], currentTurnId: string) => {
    let nextPlayerId = '';

    if (playerList[0].userId === currentTurnId) {
        nextPlayerId = playerList[1].userId;
    }
    else if (playerList[0].userId !== currentTurnId) {
        nextPlayerId = playerList[0].userId;
    }

    return nextPlayerId;
}

export const remainingTimeFinder = async (redisClient: Redis, userId: string, tableGamePlay: Table) : Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {

            /**
             * find next turn
             */
            const nextTurn = await findNextPlayerTurn(tableGamePlay.playerList, userId);

            /**
             * get player game play data
             */
            let playerGamePlay = await getPlayerGamePlay(redisClient, userId);
            if (!playerGamePlay) reject(new Error("failed getting player game data in remainingTimeFinder"));

            /**
             * logic for finding remaining time
             */
            let remainingTime = 0;

        } catch(e) {
            reject(e)
        }
    })
}