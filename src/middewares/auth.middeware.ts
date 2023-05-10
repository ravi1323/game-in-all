import { CONSTANTS } from '../config/constants.config';
import { Validation, UserErrorInterface } from '../config/interfaces.config';
import { comparePassword } from '../helpers/util.helper';

export const validateSignupPayload = (data: any): Validation => {
  const errors : UserErrorInterface = {
    name: [],
    deviceId: [],
  };

  /**
   * required validation
   */
  if (!data.deviceId || data.deviceId === '') errors.deviceId.push("'deviceId' is required.");
  if (!data.name || data.name === '') errors.name.push("'name' is required.");

  if (
    errors.deviceId.length > 0 ||
    errors.name.length > 0
  ) {
    Object.keys(errors).map((key: string, index: number): void => {
      if (errors[key].length < 1) delete errors[key];
    });
    return {
      valid: false,
      errors,
    };
  } else
    return {
      valid: true,
    };
};

export const validateJoinDebug = (data: any) : Validation => {
  const errors : { password: string[] } = {
    password: []
  }

  if (!data.password || data.password === '') errors.password.push(`'password' is required.`)
  else {
    const isCorrect : boolean = comparePassword(data.password, CONSTANTS.AUTH.HASH, CONSTANTS.AUTH.SALT);
    if (!isCorrect) errors.password.push("'password' is wrong.")
  }
  
  if (errors.password.length > 0) {
    Object.keys(errors).map((key: string, index: number): void => {
      if (errors[key].length < 1) delete errors[key];
    });
    return {
      valid: false,
      errors,
    };
  } else
    return {
      valid: true,
    };
}