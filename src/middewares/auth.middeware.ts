import { UserValidate } from "../config/interfaces.config";

export const validateSignupPayload = (data: any) : UserValidate => {

    const errors = {
        deviceId: []
    }

    /**
     * required validation
     */
    if ( !data.deviceId || data.deviceId === "" ) errors.deviceId.push("'deviceId' is required.")

    if (
        errors.deviceId.length > 0
    ) {
        Object.keys(errors).map( (key: string, index: number) : void => {
            if (errors[key].length < 1) delete errors[key];
        })
        return {
            valid: false,
            errors: errors
        }
    } else return {
        valid: true
    }
}