// Write this asyncHandler function in different different function not in arrow functions

const asyncHandler = (fn) => async(req, res, next) => {

    // function asyncHandler(fn){
    //     return async function(req, res, next) {
    //         Promise.resolve(fn(req, res, next)).catch(next);
    //     }
    // }

    // try {
    //     await fn(req, res, next);
    // } catch (error) {
    //     res.status(error.code || 500).json({
    //         message: error.message,
    //         success: false
    //     })
    // }

    // This will catch any error that occurs in the async function and pass it to the next middleware (error handler).
    // This is a more concise way to handle async errors in Express.js.    
    Promise.resolve(fn(req, res, next)).catch((err) => next(err)); 

}

export default asyncHandler;