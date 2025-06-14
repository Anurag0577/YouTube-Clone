class ApiError extends Error{
    // Question: What happens when this constructor is called? What happen when everything is set? Does it return an object?
    // Answer: When this constructor is called, it initializes the error object with a status code, message, and optional errors. It sets the properties of the error object and captures the stack trace if available. It does not return an object explicitly; instead, it creates an instance of ApiError which can be used to throw or handle errors in the application.

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