import { PlayerListPlayer } from "../config/interfaces.config";

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