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
        reject({ message: 'failed storing value on redis.'});
      }
    } catch (e) {
      reject(e);
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
        reject({ message: 'failed getting value on redis.'});
      }
    } catch (e) {
      reject(e);
    }
  });
};

export const updateUser = async (redisClient: Redis, userData: NewUser) : Promise<NewUser> => {
  return new Promise(async (resolve, reject) => {
    try {
      const key = `${CONSTANTS.USER.DB_PREFIX}~${userData.deviceId}`;
      const stored = await redisClient.set(key, JSON.stringify(userData));

      if (stored === 'OK') {
        resolve(userData);
      } else {
        reject({ message: 'failed updating value on redis.'});
      }
    } catch(e) {
      reject(e);
    }
  })
}