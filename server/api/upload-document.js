const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const file = req.file;
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return res.status(400).json({ error: 'Invalid file type. Only PDF and DOCX files are allowed.' });
  }

  // Upload to Cloudinary as raw file (for documents)
  const uploadOptions = {
    resource_type: 'raw',
    folder: 'listing-documents',
    // Use original filename for better identification
    public_id: `${Date.now()}_${file.originalname.replace(/\.[^/.]+$/, '')}`,
  };

  // Upload from buffer
  const uploadStream = cloudinary.uploader.upload_stream(
    uploadOptions,
    (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({ error: 'Failed to upload document' });
      }

      res.json({
        id: result.public_id,
        url: result.secure_url,
        name: file.originalname,
        format: result.format,
        size: result.bytes,
      });
    }
  );

  // Write buffer to stream
  uploadStream.end(file.buffer);
};
