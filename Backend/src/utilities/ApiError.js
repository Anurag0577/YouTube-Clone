class ApiError extends Error{
    constructor(
        statusCode,
        message='Something went wrong!',
        errors = []
    ){
        super(message)
        this.statusCode = statusCode,
        this.data = null,
        this.message = message,
        this.success = this.success,
        this.error = errors

        if(this.stack){
            this.stack = this.stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }

    }
}

export default ApiError;