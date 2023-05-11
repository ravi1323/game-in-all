import Bull from "bull";
import { CONSTANTS } from "../config/constants.config";

export const UserInternetIssueQueue = (redisOptions: Bull.QueueOptions) => new Bull(CONSTANTS.BULL.INTERNET_ISSUE_QUEUE, redisOptions);
export const getInternetIssueTimer = (redisOptions: Bull.QueueOptions) => Bull(CONSTANTS.BULL.INTERNET_ISSUE_QUEUE, redisOptions);

export const UserTurnQueue = (redisOptions: Bull.QueueOptions) => new Bull(CONSTANTS.USER.USER_TURN_TIMER, redisOptions);
export const UserTurnTimer = (redisOptions: Bull.QueueOptions) => new Bull(CONSTANTS.USER.USER_TURN_TIMER, redisOptions);