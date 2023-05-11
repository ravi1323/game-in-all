import { Redis } from "ioredis";
import { Table } from "../config/interfaces.config";
import { CONSTANTS } from "../config/constants.config";

export const getTableGamePlay = (redisClient: Redis, tableId: string, isEmptyTable: boolean = false) : Promise<Table> => {
    return new Promise(async (resolve, reject) => {
        try {
            const prefix = isEmptyTable ? CONSTANTS.EMPTY_TABLE.DB_PREFIX : CONSTANTS.TABLE.DB_PREFIX;
            const key = `${prefix}~${tableId}`;
            const tableGamePlay = await redisClient.get(key);

            if (tableGamePlay) {
                resolve(JSON.parse(tableGamePlay) as Table);
            } else {
                reject({ message: 'failed getting tableGamePlay on redis.'})
            }
        } catch(e) {
            reject(e);
        }
    })
}

export const deleteTableGamePlay = (redisClient: Redis, tableId: string, isEmptyTable: boolean = false, getDeleted: boolean = false) : Promise<Table | boolean> => {
    return new Promise(async (resolve, reject) => {
        try {
            const prefix = isEmptyTable ? CONSTANTS.EMPTY_TABLE.DB_PREFIX : CONSTANTS.TABLE.DB_PREFIX;
            const key = `${prefix}~${tableId}`;
            if (getDeleted) {

                const tableGamePlay = await redisClient.get(key);
                if (tableGamePlay) {

                    await redisClient.del(key);
                    resolve(JSON.parse(tableGamePlay) as Table);
                } else {
                    reject({ message: "you are deleting tableGamePlay that does not exist!"});
                }

            } else {
                await redisClient.del(key);
                resolve(true);
            }

        } catch(e) {
            reject(e);
        }
    })
}