import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: String(id) },
        include: {
          orders: {
            include: {
              items: true
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      return res.status(200).json(customer);
    } catch (error) {
      console.error('Error fetching customer details:', error);
      return res.status(500).json({ error: 'Failed to fetch customer details' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { name, phone, address, role, preferredPayment, orderMode, deliveryDetails, notes, password } = req.body;
      
      const updateData: any = {};
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (address) updateData.address = address;
      if (role) updateData.role = role;
      if (preferredPayment) updateData.preferredPayment = preferredPayment;
      if (orderMode) updateData.orderMode = orderMode;
      if (deliveryDetails) updateData.deliveryDetails = deliveryDetails;
      if (notes) updateData.notes = notes;
      
      if (password) {
        const bcrypt = require('bcryptjs');
        updateData.password = await bcrypt.hash(password, 10);
      }

      const updatedCustomer = await prisma.customer.update({
        where: { id: String(id) },
        data: updateData,
      });

      const { password: _, ...customerWithoutPassword } = updatedCustomer;
      return res.status(200).json(customerWithoutPassword);
    } catch (error) {
      console.error('Error updating customer:', error);
      return res.status(500).json({ error: 'Failed to update customer' });
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
