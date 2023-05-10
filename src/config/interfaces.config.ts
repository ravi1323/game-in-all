export interface NewUser {
  deviceId: string;
  name: string;
}
export interface Validation {
  valid: boolean;
  errors?: object;
}

export interface UserErrorInterface {
  name: string[];
  deviceId: string[];
}

export interface Password {
  hash: string;
  salt: string;
}
