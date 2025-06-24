import express from 'express';
import upload from '../middlewares/upload.js';
import { deleteImageWithRetry } from '../utilities/CloudinaryDB.js';
import ApiError from '../utilities/ApiError.js';
import ApiResponse from '../utilities/ApiResponse.js';
import User from '../models/user.model.js';

const router = express.Router();

// Upload a single image
// router.post('/upload', (req, res, next) => {
//     upload.single('image')(req, res, function (err) {
//         if (err) {
//             if (err instanceof ApiError) {
//                 return res.status(err.statusCode || 400).json({ error: err.message });
//             }
//             return res.status(400).json({ error: err.message || 'File upload failed.' });
//         }
//         if (!req.file) {
//             return res.status(400).json({ error: 'No file uploaded' });
//         }
//         res.json({
//             message: 'File uploaded successfully',
//             url: req.file.path, // Cloudinary URL
//             publicId: req.file.filename // Cloudinary public ID
//         });
//     });
// });

// 'image' is the name attribute of the <input type="file"> in your HTML form or the key in your FormData if uploading via frontend (e.g., React, Axios, or Fetch).
  // how my upload.single('image') know that the frontend feild name is 'image'?
  // It is the name attribute of the <input type="file"> in your HTML form or the key in your FormData if uploading via frontend (e.g., React, Axios, or Fetch).
  // If you are using upload.array('images', 5) then it will accept multiple files with the same field name 'images'.
router.post('/upload', upload.uploadErrorHandler(upload.single('image')), (req, res, next) => {
    if(!req.file){
        return next(new ApiError(400, 'No file uploaded'));
    }

    res.status(200).json(
        new ApiResponse(200, 'File uploaded successfully', {
        url: req.file.path,
        publicId: req.file.filename
    }))
})

// Delete an image by publicId
router.delete('/delete/:publicId', async (req, res, next) => {
    try {
        const {publicId} = req.params;
        await deleteImageWithRetry(publicId);
        res.status(200).json(
            new ApiResponse(200, 'File deleted successfully', null)
        );
    } catch(error) {
        next(error);
    }
});

export default router;
