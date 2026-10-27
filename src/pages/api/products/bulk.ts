import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { validateProductPricing } from '../../../utils/validateProductPricing';
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

  let files: any[] = [];
  try {
    await runMiddleware(req, res, upload.any());
    files = req.files as any[];

    const productsData = req.body.products;
    if (!productsData) return res.status(400).json({ error: 'No product data provided.' });

    const products = JSON.parse(productsData);
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: 0, failed: 0, errors: ['The import file contains no product rows.'] });
    }

    // Validate the complete batch before any product is saved.
    const errors: string[] = [];
    const normalizedCodes = products.map((p: any) => String(p.code || '').trim().replace(/[^a-zA-Z0-9-_]/g, '').toUpperCase());
    const seenCodes = new Set<string>();
    const categories = await prisma.category.findMany({ select: { name: true } });
    const categoryNames = new Set(categories.map(category => category.name));
    products.forEach((p: any, index: number) => {
      const rowNum = p.rowNum || index + 2;
      const code = normalizedCodes[index];
      const label = `Row ${rowNum} (${p.code || 'no code'})`;
      if (!p.name?.trim()) errors.push(`${label}: Product name is required.`);
      if (!code) errors.push(`${label}: Product code is required.`);
      else if (seenCodes.has(code)) errors.push(`${label}: Product code is duplicated within this file.`);
      else seenCodes.add(code);
      if (!p.category?.trim()) errors.push(`${label}: Category is required.`);
      else if (!categoryNames.has(p.category.trim())) errors.push(`${label}: Category "${p.category}" does not exist.`);
      if (!p.description?.trim()) errors.push(`${label}: English description is required.`);
      if (p.stock === undefined || p.stock === null || p.stock === '' || !Number.isInteger(Number(p.stock)) || Number(p.stock) < 0) errors.push(`${label}: Stock must be a valid non-negative whole number.`);
      const pricingError = validateProductPricing(p);
      if (pricingError) errors.push(`${label}: ${pricingError}`);
      for (const [field, value] of [['Items_Per_Box', p.itemsPerBox], ['Items_Bundle', p.bundleQuantity]] as const) {
        if (value !== undefined && value !== null && value !== '' && (!Number.isInteger(Number(value)) || Number(value) < 0)) {
          errors.push(`${label}: ${field} must be a valid non-negative whole number.`);
        }
      }
      if (!p.imageFilename || !files.some(f => f.fieldname === `image_${p.imageFilename}`)) errors.push(`${label}: Product image is missing from the ZIP package.`);
      if (!['Live', 'Hold'].includes(p.status || 'Live')) errors.push(`${label}: Status must be Live or Hold.`);
    });

    const codesToCheck = normalizedCodes.filter(Boolean);
    if (codesToCheck.length > 0) {
      const existingProducts = await prisma.product.findMany({
        where: { code: { in: codesToCheck } },
        select: { code: true },
      });
      const existingCodes = new Set(existingProducts.map(product => product.code));
      products.forEach((p: any, index: number) => {
        if (existingCodes.has(normalizedCodes[index])) {
          errors.push(`Row ${p.rowNum || index + 2} (${p.code}): Product code already exists.`);
        }
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: 0, failed: products.length, errors });
    }

    // Upload images first; do not start the database write if any upload fails.
    const imageUrls: string[] = [];
    for (const p of products) {
      const imageFile = files.find(f => f.fieldname === `image_${p.imageFilename}`);
      const uploadResult = await cloudinary.uploader.upload(imageFile.path, {
        folder: 'cheng-boom/products',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });
      imageUrls.push(uploadResult.secure_url);
    }

    const productWrites = products.map((p: any, index: number) => prisma.product.create({
      data: {
        code: normalizedCodes[index],
        name: p.name.trim(),
        nameZh: p.nameZh?.trim() || null,
        nameMs: p.nameMs?.trim() || null,
        description: p.description.trim(),
        descriptionZh: p.descriptionZh?.trim() || null,
        videoUrl: p.videoUrl?.trim() || null,
        category: p.category.trim(),
        stock: Number(p.stock),
        sellerAPrice: Number(p.sellerAPrice),
        sellerBPrice: Number(p.sellerBPrice),
        itemsPerBox: p.itemsPerBox ? Number(p.itemsPerBox) : null,
        sellerABoxPrice: p.sellerABoxPrice != null ? Number(p.sellerABoxPrice) : null,
        sellerBBoxPrice: p.sellerBBoxPrice != null ? Number(p.sellerBBoxPrice) : null,
        bundleQuantity: p.bundleQuantity ? Number(p.bundleQuantity) : null,
        sellerABundlePrice: p.sellerABundlePrice != null ? Number(p.sellerABundlePrice) : null,
        sellerBBundlePrice: p.sellerBBundlePrice != null ? Number(p.sellerBBundlePrice) : null,
        status: p.status === 'Hold' ? 'Hold' : 'Live',
        images: [imageUrls[index]],
      },
    }));

    await prisma.$transaction(productWrites);
    return res.status(200).json({ success: products.length, failed: 0, errors: [] });
  } catch (error: any) {
    console.error('Bulk upload error:', error);
    return res.status(500).json({ error: error.message || 'Server error during bulk upload' });
  } finally {
    for (const file of files) {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Failed to delete temp file:', err);
      }
    }
  }
}
