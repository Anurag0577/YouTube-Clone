const express = require('express')
const app  = express()

app.use((error, req, res, next) => {
    const statusCode = error.statusCode;
    res.status(statusCode).json({
        statusCode: error.statusCode,
        message: error.message || 'Something went wrong!'
    })
    // does next() need to be called here?  
    // No, because you are sending a response. Calling next() would pass control to the next middleware, which is not needed here.
    // If you call next() after sending a response, it can lead to an error because the response has already been sent to the client.   
});

export default globalErrorHandler;