export default class ApiError extends Error{
    status;
    errors;

    constructor(status, message, errors = []){
        super(message);
        this.status = status;
        this.errors = errors;
    }

    static Unauthorized(message, errors = []) {
        return new ApiError(401, message, errors);
    }

    static BadRequest(message, errors = []){
        return new ApiError(400, message, errors);
    }

    static NoConnectDB(message, errors = []){
        return new ApiError(500, message, errors);
    }

}
