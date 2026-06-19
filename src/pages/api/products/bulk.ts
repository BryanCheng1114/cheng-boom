import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import cloudinary from '../../../lib/cloudinary';
import multer from 'multer';
import fs from 'fs';
import os from 'os';

// Setup multer
const storage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
  }
});

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

export default async function handler(req: any, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Run multer to process all files and fields
    await runMiddleware(req, res, upload.any());

    const productsData = req.body.products;
    if (!productsData) {
      return res.status(400).json({ error: 'No product data provided.' });
    }

    const products = JSON.parse(productsData);
    const files = req.files as any[];

    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    // Process each product sequentially to avoid db/cloudinary rate limits on huge uploads
    for (const p of products) {
      try {
        const fileField = `image_${p.imageFilename}`;
        const file = files.find(f => f.fieldname === fileField);
        
        let imageUrl = '';
        if (file) {
          // Upload to Cloudinary
          const uploadResult = await cloudinary.uploader.upload(file.path, {
            folder: 'cheng-boom/products',
            transformation: [
              { width: 1200, height: 1200, crop: 'limit' },
              { quality: 'auto', fetch_format: 'auto' },
            ],
          });
          imageUrl = uploadResult.secure_url;
        } else {
          errors.push(`Row ${p.rowNum} (${p.code}): Image file missing during upload.`);
          failedCount++;
          continue; // Skip product creation if image is absolutely required
        }

        // Clean code
        const cleanCode = p.code.trim().replace(/[^a-zA-Z0-9-_]/g, '').toUpperCase();

        // Check if product exists (Upsert logic: updating if exists based on Code, else create)
        const existing = await prisma.product.findUnique({
          where: { code: cleanCode }
        });

        if (existing) {
          // If the admin uploaded a product with an existing code, you could either update it or error out.
          // Let's create an error for duplicates for strictness, or update. Usually bulk upload updates.
          // The instructions say "No duplicated products", but it's simpler to reject or update. Let's reject.
          errors.push(`Row ${p.rowNum} (${p.code}): Product with this code already exists.`);
          failedCount++;
          continue;
        }

        // Insert to DB
        await prisma.product.create({
          data: {
            code: cleanCode,
            name: p.name.trim(),
            nameZh: p.nameZh?.trim() || null,
            nameMs: p.nameMs?.trim() || null,
            description: p.description?.trim() || null,
            descriptionZh: p.descriptionZh?.trim() || null,
            videoUrl: p.videoUrl?.trim() || null,
            category: p.category.trim(),
            stock: Number(p.stock),
            price: Number(p.price),
            promotion: p.promotion ? Number(p.promotion) : null,
            sellerPrice: p.sellerPrice ? Number(p.sellerPrice) : null,
            itemsPerBox: p.itemsPerBox ? Number(p.itemsPerBox) : null,
            boxPrice: p.boxPrice ? Number(p.boxPrice) : null,
            boxSellerPrice: p.boxSellerPrice ? Number(p.boxSellerPrice) : null,
            boxPromotion: p.boxPromotion ? Number(p.boxPromotion) : null,
            status: p.status === 'Hold' ? 'Hold' : 'Live',
            images: [imageUrl],
          }
        });

        successCount++;
      } catch (err: any) {
        console.error(`Error processing row ${p.rowNum}:`, err);
        errors.push(`Row ${p.rowNum} (${p.code}): ${err.message || 'Database error'}`);
        failedCount++;
      }
    }

    // Cleanup: delete local temp files
    for (const file of files) {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Failed to delete temp file:', err);
      }
    }

    return res.status(200).json({
      success: successCount,
      failed: failedCount,
      errors
    });

  } catch (error: any) {
    console.error('Bulk upload error:', error);
    return res.status(500).json({ error: error.message || 'Server error during bulk upload' });
  }
}
