import { RejoinDataErrors, Validation } from "../config/interfaces.config";

export const validateRejoinPayload = (data: any): Validation => {
    const errors: RejoinDataErrors = {
        tableId: [],
        userId: []
    }

    if (!data.tableId || data.tableId === '') errors.tableId.push("'tableId is required.'");
    if (!data.userId || data.userId) errors.userId.push("'userId' is required.");

    if (errors.tableId.length > 0 || errors.userId.length > 0) {
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