

// utils/cloudinary.js - Enhanced version
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');

// Configure Cloudinary with validation
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Validate Cloudinary configuration (Check all the required environment variables)
const validateCloudinaryConfig = () => {
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error('Cloudinary configuration is incomplete. Please check your environment variables.');
  }
};

// Custom filename generator
const generateFileName = (req, file) => {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(6).toString('hex');
  const ext = file.originalname.split('.').pop();
  return `${timestamp}_${randomBytes}.${ext}`;
};

// Enhanced Profile Photo Storage
const profilePhotoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile_photos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    public_id: (req, file) => generateFileName(req, file),
    transformation: [
      { width: 300, height: 300, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' },
      { format: 'webp' } // Convert to WebP for better performance
    ]
  }
});

// Enhanced General Storage
const generalStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    public_id: (req, file) => generateFileName(req, file),
    transformation: [
      { width: 1000, height: 1000, crop: 'limit' },
      { quality: 'auto:good' },
      { format: 'auto' }
    ]
  }
});

// Utility function to delete image with retry logic
const deleteImageWithRetry = async (publicId, maxRetries = 3) => {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result === 'ok' || result.result === 'not found') {
        return result;
      }
      throw new Error(`Deletion failed: ${result.result}`);
    } catch (error) {
      attempts++;
      console.error(`Attempt ${attempts} to delete ${publicId} failed:`, error.message);
      
      if (attempts >= maxRetries) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
    }
  }
};

// Enhanced error handling for Cloudinary operations
const handleCloudinaryOperation = async (operation, ...args) => {
  try {
    return await operation(...args);
  } catch (error) {
    console.error('Cloudinary operation failed:', error);
    
    // Map Cloudinary errors to user-friendly messages
    if (error.http_code === 400) {
      throw new Error('Invalid file or parameters');
    } else if (error.http_code === 401) {
      throw new Error('Cloudinary authentication failed');
    } else if (error.http_code === 403) {
      throw new Error('Cloudinary access forbidden');
    } else if (error.http_code === 404) {
      throw new Error('Resource not found in cloud storage');
    } else if (error.http_code === 413) {
      throw new Error('File too large for cloud storage');
    } else if (error.http_code >= 500) {
      throw new Error('Cloud storage service temporarily unavailable');
    }
    
    throw new Error('Cloud storage error occurred');
  }
};

module.exports = {
  cloudinary,
  profilePhotoStorage,
  generalStorage,
  validateCloudinaryConfig,
  deleteImageWithRetry,
  handleCloudinaryOperation
};

// ===================================

// middleware/upload.js - Enhanced version
const multer = require('multer');
const { profilePhotoStorage, generalStorage } = require('../utils/cloudinary');
const ApiError = require('../utils/ApiError');

// Enhanced file filter with more detailed validation
const createFileFilter = (options = {}) => {
  const { 
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxSize = 5 * 1024 * 1024,
    allowAnimated = false
  } = options;

  return (req, file, cb) => {
    // Check MIME type
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new ApiError(400, `File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
    }

    // Check for animated GIFs if not allowed
    if (!allowAnimated && file.mimetype === 'image/gif') {
      return cb(new ApiError(400, 'Animated images are not allowed'), false);
    }

    // Additional security check - validate file extension matches MIME type
    const ext = file.originalname.split('.').pop().toLowerCase();
    const mimeToExt = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
      'image/gif': ['gif']
    };

    const allowedExts = mimeToExt[file.mimetype] || [];
    if (!allowedExts.includes(ext)) {
      return cb(new ApiError(400, 'File extension does not match file type'), false);
    }

    cb(null, true);
  };
};

// Enhanced Profile Photo Upload
const uploadProfilePhoto = multer({
  storage: profilePhotoStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1
  },
  fileFilter: createFileFilter({
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxSize: 2 * 1024 * 1024
  })
});

// Enhanced General Image Upload
const uploadImage = multer({
  storage: generalStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5 // Allow multiple files
  },
  fileFilter: createFileFilter({
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    maxSize: 5 * 1024 * 1024,
    allowAnimated: true
  })
});

// Middleware to handle upload errors gracefully
const handleUploadError = (uploadMiddleware) => { // talk middleware as a input - either upload.sigle() or upload.array()
  return (req, res, next) => { // create a new middleware
    uploadMiddleware(req, res, (error) => {  // now that upload.single() let say support req, res and a callback and it pass the error in call back that why we pass a param like this
      if (error) {
        // Log the error for debugging
        console.error('Upload error:', error);
        
        if (error instanceof multer.MulterError) {
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
        
        return next(error);
      }
      next();
    });
  };
};

module.exports = {
  uploadProfilePhoto: handleUploadError(uploadProfilePhoto.single('profilePhoto')),
  uploadImage: handleUploadError(uploadImage.array('images', 5)),
  uploadSingleImage: handleUploadError(uploadImage.single('image'))
};

// ===================================

// controllers/userController.js - Enhanced version with better error handling
const { catchAsync } = require('../middleware/errorHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { cloudinary, deleteImageWithRetry, handleCloudinaryOperation } = require('../utils/cloudinary');
const User = require('../models/User');

// Enhanced createUser with transaction-like behavior
const createUser = catchAsync(async (req, res, next) => {
  const { name, email, bio } = req.body;

  // Validate required fields
  if (!name?.trim() || !email?.trim()) {
    // Clean up uploaded file if validation fails
    if (req.file) {
      await deleteImageWithRetry(req.file.filename).catch(console.error);
    }
    return next(new ApiError(400, 'Name and email are required'));
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    if (req.file) {
      await deleteImageWithRetry(req.file.filename).catch(console.error);
    }
    return next(new ApiError(400, 'Please provide a valid email address'));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    if (req.file) {
      await deleteImageWithRetry(req.file.filename).catch(console.error);
    }
    return next(new ApiError(400, 'User with this email already exists'));
  }

  // Prepare user data
  const userData = {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    bio: bio?.trim() || ''
  };

  // Add profile photo if uploaded
  if (req.file) {
    userData.profilePhoto = {
      url: req.file.path,
      publicId: req.file.filename
    };
  }

  try {
    const user = await User.create(userData);

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      profilePhotoUrl: user.profilePhoto?.url || null,
      createdAt: user.createdAt
    };

    return res.status(201).json(
      new ApiResponse(201, userResponse, 'User created successfully')
    );
  } catch (error) {
    // Clean up uploaded file if database operation fails
    if (req.file) {
      await deleteImageWithRetry(req.file.filename).catch(console.error);
    }
    return next(error);
  }
});

// Enhanced updateProfilePhoto with better error handling
const updateProfilePhoto = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  if (!req.file) {
    return next(new ApiError(400, 'No photo uploaded'));
  }

  const user = await User.findById(userId);
  if (!user) {
    await deleteImageWithRetry(req.file.filename).catch(console.error);
    return next(new ApiError(404, 'User not found'));
  }

  const oldPhotoPublicId = user.profilePhoto?.publicId;
  
  try {
    // Update user with new photo first
    user.profilePhoto = {
      url: req.file.path,
      publicId: req.file.filename
    };

    await user.save();

    // Delete old photo only after successful update
    if (oldPhotoPublicId) {
      await deleteImageWithRetry(oldPhotoPublicId).catch(error => {
        console.error('Failed to delete old photo:', error);
        // Log but don't fail the request
      });
    }

    return res.status(200).json(
      new ApiResponse(200, { 
        profilePhotoUrl: user.profilePhoto.url,
        updatedAt: user.updatedAt 
      }, 'Profile photo updated successfully')
    );
  } catch (error) {
    // If database update fails, clean up new uploaded file
    await deleteImageWithRetry(req.file.filename).catch(console.error);
    return next(error);
  }
});

// Enhanced removeProfilePhoto with better error handling
const removeProfilePhoto = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return next(new ApiError(404, 'User not found'));
  }

  if (!user.profilePhoto?.publicId) {
    return next(new ApiError(400, 'User has no profile photo to remove'));
  }

  const photoPublicId = user.profilePhoto.publicId;

  try {
    // Remove photo from user record first
    user.profilePhoto = undefined;
    await user.save();

    // Delete from Cloudinary after database update
    await deleteImageWithRetry(photoPublicId).catch(error => {
      console.error('Failed to delete photo from Cloudinary:', error);
      // Log but don't fail the request since user record is already updated
    });

    return res.status(200).json(
      new ApiResponse(200, { updatedAt: user.updatedAt }, 'Profile photo removed successfully')
    );
  } catch (error) {
    return next(new ApiError(500, 'Failed to remove profile photo'));
  }
});

module.exports = {
  createUser,
  updateProfilePhoto,
  removeProfilePhoto,
  // ... other controller methods
};

// ===================================

// middleware/validation.js - Additional validation middleware
const { body, param, validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Validation rules
const userValidationRules = () => {
  return [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Name can only contain letters and spaces'),
    
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Bio cannot exceed 200 characters')
  ];
};

const userIdValidationRules = () => {
  return [
    param('userId')
      .isMongoId()
      .withMessage('Invalid user ID format')
  ];
};

// Validation error handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return next(new ApiError(400, `Validation failed: ${errorMessages.join(', ')}`));
  }
  next();
};

module.exports = {
  userValidationRules,
  userIdValidationRules,
  validate
};