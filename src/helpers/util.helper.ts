export const makeResponse = (obj: object) => {
  return JSON.stringify(obj);
};

export const convertStringtoObject = (obj: any): object => {
  try {
    return typeof obj === 'object' ? obj : JSON.parse(obj);
  } catch (error: any) {
    return error;
  }
};

export const isJsonString = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};
