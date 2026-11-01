import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { getAdminFromRequest } from '../../../utils/adminAuth';
import { getCustomerFromRequest } from '../../../utils/customerAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const admin = await getAdminFromRequest(req);
  const customer = admin ? null : await getCustomerFromRequest(req);
  if (!admin && !customer) return res.status(401).json({ message: 'Please sign in.' });

  if (req.method === 'GET') {
    try {
      const order = await prisma.order.findUnique({
        where: { id: String(id) },
        include: {
          customer: {
            select: {
              name: true,
              phone: true,
              email: true,
              address: true,
              preferredPayment: true,
              orderMode: true,
            }
          },
          items: true
        }
      });

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      if (!admin && order.customerId !== customer?.id) return res.status(403).json({ message: 'You can only access your own orders.' });

      // Fetch translated product names manually
      for (const item of order.items) {
        if (item.productId) {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { code: true, nameZh: true, nameMs: true }
          });
          if (product) {
            (item as any).code = product.code;
            (item as any).nameZh = product.nameZh;
            (item as any).nameMs = product.nameMs;
          }
        }
      }

      return res.status(200).json(order);

    } catch (error) {
      console.error('Fetch order error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  if (req.method === 'PATCH') {
    if (!admin) return res.status(403).json({ message: 'Admin sign-in is required to update orders.' });
    try {
      const { status, address } = req.body;
      
      if (!status && address === undefined) {
        return res.status(400).json({ message: 'No valid fields provided for update' });
      }

      const existingOrder = await prisma.order.findUnique({
        where: { id: String(id) },
        include: { items: true }
      });

      if (!existingOrder) {
        return res.status(404).json({ message: 'Order not found' });
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (address !== undefined) updateData.address = address;

      // Handle stock restoration if order is being cancelled
      if (status === 'Cancelled' && existingOrder.status !== 'Cancelled') {
        const updatedOrder = await prisma.$transaction(async (tx) => {
          // 1. Update order status
          const order = await tx.order.update({
            where: { id: String(id) },
            data: updateData,
          });

          // 2. Restore stock for each item
          for (const item of existingOrder.items) {
            await tx.product.updateMany({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity }
              }
            });
          }
          
          return order;
        });

        return res.status(200).json(updatedOrder);
      } else {
        // Standard update (no stock changes)
        const updatedOrder = await prisma.order.update({
          where: { id: String(id) },
          data: updateData,
        });
        return res.status(200).json(updatedOrder);
      }
    } catch (error) {
      console.error('Update order error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
