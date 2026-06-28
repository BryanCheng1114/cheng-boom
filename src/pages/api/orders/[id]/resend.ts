import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { sendCustomerOrderReceiptEmail } from '../../../../lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    const order = await prisma.order.findUnique({
      where: { id: String(id) },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.customer.email) {
      return res.status(400).json({ message: 'Customer has no email address' });
    }

    // Enrich items with sellerPrice/boxSellerPrice for accurate email discount labeling
    const productIds = [...new Set(order.items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, sellerPrice: true, boxSellerPrice: true, itemsPerBox: true },
    });
    const productMap: Record<string, any> = {};
    products.forEach((p) => { productMap[p.id] = p; });
    const enrichedItems = order.items.map((item) => {
      const pd = productMap[item.productId];
      return { ...item, sellerPrice: pd?.sellerPrice ?? null, boxSellerPrice: pd?.boxSellerPrice ?? null, itemsPerBox: pd?.itemsPerBox ?? null };
    });

    // Check if customer has a seller level
    let sellerLevelName = null;
    let discountPercent = 0;
    let isFreeShipping = false;
    
    if (order.customer.sellerLevelId) {
      const sellerLevel = await prisma.sellerLevel.findUnique({
        where: { id: order.customer.sellerLevelId }
      });
      if (sellerLevel) {
        sellerLevelName = sellerLevel.name;
        discountPercent = sellerLevel.discountPercent;
        isFreeShipping = sellerLevel.freeShipping;
      }
    }

    const customerInfo = {
      name: order.customer.name,
      phone: order.customer.phone || '',
      email: order.customer.email,
      address: order.address || order.customer.address || '',
      paymentMethod: order.paymentMethod || '',
      deliveryMode: order.deliveryMode || '',
      notes: order.notes || '',
      role: order.customer.role
    };
    
    await sendCustomerOrderReceiptEmail(
      order, 
      customerInfo, 
      enrichedItems, 
      order.totalAmount,
      order.totalAmount, // We don't store originalAmount, email template will just show total
      0,                 // totalDiscount
      sellerLevelName || undefined,
      discountPercent,
      isFreeShipping
    );

    return res.status(200).json({ message: 'Receipt resent successfully' });
  } catch (error) {
    console.error('Error resending receipt:', error);
    return res.status(500).json({ message: 'Failed to resend receipt' });
  }
}
