class ApiResponse{
    constructor(statusCode, message = 'Success', data) {
        super(message);
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode >= 200 && statusCode < 300;
    }
}

export default ApiResponse()