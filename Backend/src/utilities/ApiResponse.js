class ApiResponse{
    // What happens when this constructor is called? What happens when everything is set? Does it return an object directly? Does is log anything?
    // Answer: When this constructor is called, it initializes an instance of ApiResponse with a status code, message, and optional data. It sets the properties of the instance such as statusCode, message, data, and success. It does not return an object directly; instead, it creates an instance of ApiResponse which can be used to send responses in the application. It does not log anything by default.
    constructor(statusCode, message = 'Success', data) {
        super(message);
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode >= 200 && statusCode < 300;
    }
}

export default ApiResponse()