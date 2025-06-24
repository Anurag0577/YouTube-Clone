import CloudinaryDB from '../utilities/CloudinaryDB.js';
import multer from "multer";
import ApiError from '../../src/utilities/ApiError.js';
const storage = CloudinaryDB.storage;

// Custom file filter for the validation.
// Question: Why use validation again here? When you already did it during cloudinary configuration.
// Answer: Cloudinary will block invalid files after they're uploaded. But the file still reaches Cloudinary's servers first (costing bandwidth/time).

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if(!allowedTypes.includes(file.mimetype)){
        cb(new ApiError(`File type ${file.mimetype} `) , false)
    } else {
        cb(null, true)
    }
}


// Configure multer with cloudinary engine storage
const upload = multer({
    storage: storage, // storageEngine
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 *1024
    }
})

// We wrap the multer middleware-uploadMiddleware in a uploadErrorHandler so we can pass any middleware (upload.single() and upload.array()) and dont neet to write it twice for each one. 
// Question: Why we can not handle this multer error in the upload route? Answer: Multer errors occur during the middleware execution (before your route runs). By the time the route executes, Multer has already failed.
//  This Errorhandler fucntion retrun a middleware that will handle the multer error. This middleware handle the error using the callback. Multer middleware (upload.single()) indeed uses a callback to report errors. Your wrapper intercepts this. This multer middleware talking about upload.single('image') here support (args, callback) so we pass the req, res and a callback in it when error occured it pass that error to the callback and callback handles it.
// This like size_limit, invalid file are the multer issues or errors.
 const uploadErrorHandler = (uploadMiddleware) => {
    return (req, res, next) => {
        uploadMiddleware(req, res, (error) => {
                if(error instanceof multer.MulterError){
                    switch (error.code) {
                        case 'LIMIT_FILE_SIZE':
                        return next(new ApiError(400, 'File too large. Please select a smaller file.'));
                        case 'LIMIT_FILE_COUNT':
                        return next(new ApiError(400, 'Too many files. Maximum allowed is 5.'));
                        case 'LIMIT_UNEXPECTED_FILE':
                        return next(new ApiError(400, 'Unexpected file field.'));
                        default:
                        return next(new ApiError(400, 'File upload failed.'));  
                    }
                }
                if(error){
                    next(error)
                }
                next();
        })
        
    }
    
}


export default upload;