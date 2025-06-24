// Multer: Multer is a Node.js middleware for handling multipart/form-data, which is the form encoding type used when uploading files from a client (e.g., a web form or API request). It processes uploaded files, making them accessible in your Express application (e.g., in req.file or req.files).

// Cloudinary: Cloudinary is a cloud-based media management platform that allows you to upload, store, transform, and deliver images (and other media) efficiently. It provides an API to upload files to its cloud storage and offers features like image optimization, resizing, and format conversion (e.g., to WebP).

// Multer’s Role: Multer handles the first part—receiving and parsing the file from the client’s request. It makes the file data available to your application, but it doesn’t decide where to store the file.

// Cloudinary’s Role: Cloudinary handles the storage, transformation, and delivery. Instead of saving files on your server’s disk (which isn’t scalable for large applications), you send the files to Cloudinary’s cloud storage. Cloudinary provides a URL for accessing the file and can apply transformations (e.g., resizing, cropping, or optimizing).

import { CloudinaryStorage } from "multer-storage-cloudinary";
import ApiError from "./ApiError.js";
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

// Configure the cloudinary - it required authentication everytime you upload or manage files. 
// The cloudinary credentials from the enc files told cloudinary who you are.
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

// You can skip. Just checking whether we have all envirnment variables or not.
const validateCloudinaryConfig = () => {
    const {cloud_name, api_key, api_secret} = cloudinary.config();
    if(!cloud_name || !api_key || !api_secret){
        throw new Error('Cloudinary configuration is incomplete. Please check environment variable.')
    }
}

// Configure multer to use cloudinary storage.
// Creates a storage engine that sends files to Cloudinary.
const storage = new CloudinaryStorage({
    cloudinary: cloudinary, // Cloudinary instance
    params: {
        folder: 'uploads', // uploads files in this folder on the cloud
        allowed_formats: ['.jpg', '.png', '.webpeg', '.jpeg']
    }
})

// Concept for deleting the cloudinary file
const deleteImageWithRetry = async (publicId) => {
    try{
            const result = cloudinary.uploader.destroy(publicId);
            if (result.result === 'ok' || result.result === 'not found'){
                return result;
            }
            throw new ApiError(400, `Deletion failed: ${result.result}`)
    } catch(error){
        if(error.http_code) {
            throw new ApiError(error.http_code, error.message || 'cloud storage deletion error.')
        }
        throw new ApiError(500, 'Failed to delete image from cloud storage.')
    }
}


// Synchronous loading
// Dynamic - you can conditionally require modules
// More established in Node.js ecosystem
// ES Modules (export/import):
// export default cloudinary;

// Asynchronous loading
// Static - imports must be at top level
// Standardized across browsers and Node.js
// Better for tree-shaking (dead code elimination)
// module.exports = {
//     cloudinary,
//     CloudinaryStorage,
//     validateCloudinaryConfig
// };
export default {cloudinary, CloudinaryStorage, validateCloudinaryConfig, storage, deleteImageWithRetry};
export { deleteImageWithRetry };