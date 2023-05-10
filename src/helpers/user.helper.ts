import { NewUser } from '../config/interfaces.config';
import { CONSTANTS } from '../config/constants.config';
import { Redis } from 'ioredis';

export const createNewUser = async (redisClient: Redis, userData: NewUser): Promise<NewUser> => {
  return new Promise(async (resolve, reject) => {
    try {
      const key = `${CONSTANTS.USER.DB_PREFIX}~${userData.deviceId}`;
      const stored = await redisClient.set(key, JSON.stringify(userData));

      if (stored === 'OK') {
        resolve(userData);
      } else {
        reject({
          success: false,
          message: 'failed storing value on redis server',
        });
      }
    } catch (e) {
      reject({
        success: false,
        message: `something went wrong : ${e.message}`,
      });
    }
  });
};

export const getUser = async (redisClient: Redis, deviceId: string): Promise<NewUser> => {
  return new Promise(async (resolve, reject) => {
    try {
      const key = `${CONSTANTS.USER.DB_PREFIX}~${deviceId}`;
      const stored = await redisClient.get(key);

      if (stored) {
        resolve(JSON.parse(stored) as NewUser);
      } else {
        reject({
          success: false,
          message: 'failed storing value on redis server',
        });
      }
    } catch (e) {
      reject({
        success: false,
        message: `something went wrong : ${e.message}`,
      });
    }
  });
};
