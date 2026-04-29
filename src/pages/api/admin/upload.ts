import type { NextApiRequest, NextApiResponse } from 'next';
import cloudinary from '../../../lib/cloudinary';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Setup multer (disk storage for temporary local file before uploading to cloud)
const storage = multer.diskStorage({
  destination: '/tmp', // Note: Vercel supports /tmp
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// For Windows/Local dev, ensure /tmp exists or use os.tmpdir()
const upload = multer({ storage });

export const config = {
  api: {
    bodyParser: false,
  },
};

function runMiddleware(req: any, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Run multer middleware to handle multi-file upload
    await runMiddleware(req, res, upload.array('files'));

    const files = req.files as any[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const uploadPromises = files.map(async (file) => {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'cheng-boom/products',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });
      
      // Cleanup: delete local temp file
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Failed to delete temp file:', err);
      }

      return result.secure_url;
    });

    const urls = await Promise.all(uploadPromises);

    return res.status(200).json({ urls });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
}
