const cloudinary = require('cloudinary').v2;
const log = require('../log');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Error response helper - consistent with template's error format
const sendError = (res, status, message, details = null) => {
  const errorResponse = {
    name: 'UploadError',
    message,
    status,
    statusText: message,
    ...(details && { data: details }),
  };

  log.error(new Error(message), 'upload-document-error', details);
  return res.status(status).json(errorResponse);
};

module.exports = (req, res) => {
  // Check Cloudinary configuration
  if (!process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET) {
    return sendError(res, 500, 'Document upload service is not configured', {
      code: 'CLOUDINARY_NOT_CONFIGURED',
    });
  }

  // Check if file was provided
  if (!req.file) {
    return sendError(res, 400, 'No file uploaded', {
      code: 'NO_FILE',
    });
  }

  const file = req.file;

  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return sendError(res, 400, 'Invalid file type. Only PDF and DOCX files are allowed.', {
      code: 'INVALID_FILE_TYPE',
      mimetype: file.mimetype,
      allowedTypes: ALLOWED_MIME_TYPES,
    });
  }

  // Validate file size (multer should handle this, but double-check)
  if (file.size > MAX_FILE_SIZE) {
    return sendError(res, 400, 'File size exceeds the maximum limit of 10MB.', {
      code: 'FILE_TOO_LARGE',
      size: file.size,
      maxSize: MAX_FILE_SIZE,
    });
  }

  // Upload to Cloudinary as raw file (for documents)
  const uploadOptions = {
    resource_type: 'raw',
    folder: 'listing-documents',
    // Use original filename for better identification
    public_id: `${Date.now()}_${file.originalname.replace(/\.[^/.]+$/, '')}`,
  };

  // Upload from buffer using stream
  const uploadStream = cloudinary.uploader.upload_stream(
    uploadOptions,
    (error, result) => {
      if (error) {
        return sendError(res, 500, 'Failed to upload document to storage', {
          code: 'CLOUDINARY_UPLOAD_FAILED',
          cloudinaryError: error.message,
        });
      }

      // Success response
      res.status(200).json({
        data: {
          id: result.public_id,
          url: result.secure_url,
          name: file.originalname,
          format: result.format || file.originalname.split('.').pop(),
          size: result.bytes,
          createdAt: result.created_at,
        },
      });
    }
  );

  // Write buffer to stream
  uploadStream.end(file.buffer);
};
