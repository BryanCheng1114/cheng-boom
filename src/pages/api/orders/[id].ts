import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

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

      return res.status(200).json(order);
    } catch (error) {
      console.error('Fetch order error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  if (req.method === 'PATCH') {
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
            let restoreQty = item.quantity;
            
            if (item.variant === 'Box') {
              const product = await tx.product.findUnique({
                where: { id: item.productId },
                select: { itemsPerBox: true }
              });
              if (product && product.itemsPerBox) {
                restoreQty = item.quantity * product.itemsPerBox;
              }
            }

            await tx.product.updateMany({
              where: { id: item.productId },
              data: {
                stock: { increment: restoreQty }
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
