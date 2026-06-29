import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { dateRange, sellerLevel, status, search } = req.query;

    // Determine date range (mock logic for "Last 30 Days")
    const now = new Date();
    let startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);
    
    if (dateRange === 'last_7_days') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (dateRange === 'all_time') {
      startDate = new Date(0);
    }

    // Build seller query filters
    const sellerFilter: any = { role: 'Seller' };
    if (sellerLevel && sellerLevel !== 'all') {
      sellerFilter.sellerLevelId = sellerLevel;
    }
    if (status && status !== 'all') {
      sellerFilter.isActive = status === 'active';
    }
    if (search && search !== '') {
      sellerFilter.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Fetch Sellers
    const sellers = await prisma.customer.findMany({
      where: sellerFilter,
      include: {
        sellerLevel: true,
      },
    });

    const sellerIds = sellers.map(s => s.id);

    // Fetch Orders within date range for these sellers
    const orders = await prisma.order.findMany({
      where: {
        customerId: { in: sellerIds },
        createdAt: { gte: startDate, lte: now }
      },
      include: {
        customer: {
          include: { sellerLevel: true }
        }
      }
    });

    // Fetch All Levels
    const levels = await prisma.sellerLevel.findMany();

    // 1. Summary Overview
    let totalSales = 0;
    let totalDiscounts = 0;

    orders.forEach(order => {
      totalSales += order.totalAmount;
      // Mock discount calculation: (totalAmount * discountPercent) / (100 - discountPercent)
      const discountPercent = order.customer?.sellerLevel?.discountPercent || 0;
      if (discountPercent > 0) {
        totalDiscounts += (order.totalAmount * discountPercent) / (100 - discountPercent);
      }
    });

    const totalOrdersCount = orders.length;
    const averageOrderValue = totalOrdersCount > 0 ? totalSales / totalOrdersCount : 0;
    
    const activeSellers = sellers.filter(s => s.isActive).length;
    const inactiveSellers = sellers.filter(s => !s.isActive).length;

    // Mock trend percentages for UI
    const metrics = {
      totalSales,
      salesTrend: 18.2,
      totalOrders: totalOrdersCount,
      ordersTrend: 12.5,
      averageOrderValue,
      aovTrend: 5.1,
      totalDiscounts,
      discountsTrend: 8.7,
      totalSellers: sellers.length,
      activeSellers,
      inactiveSellers,
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    };

    // 2. Charts Data
    // Group orders by date (YYYY-MM-DD)
    const groupedOrders: Record<string, { date: string, sales: number, orders: number }> = {};
    
    // Initialize chart with empty days
    const loopDate = new Date(startDate);
    while (loopDate <= now) {
      const dateStr = loopDate.toISOString().split('T')[0];
      groupedOrders[dateStr] = { date: dateStr, sales: 0, orders: 0 };
      loopDate.setDate(loopDate.getDate() + 1);
    }

    orders.forEach(order => {
      const dateStr = order.createdAt.toISOString().split('T')[0];
      if (groupedOrders[dateStr]) {
        groupedOrders[dateStr].sales += order.totalAmount;
        groupedOrders[dateStr].orders += 1;
      }
    });

    const chartData = Object.values(groupedOrders).sort((a, b) => a.date.localeCompare(b.date));

    // 3. Performance By Tier
    const tierPerformance = levels.map(level => {
      const tierSellers = sellers.filter(s => s.sellerLevelId === level.id);
      const tierOrders = orders.filter(o => o.customer.sellerLevelId === level.id);
      const tierSales = tierOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const tierOrdersCount = tierOrders.length;
      return {
        level,
        sellersCount: tierSellers.length,
        sellersPercentage: sellers.length > 0 ? (tierSellers.length / sellers.length) * 100 : 0,
        totalSales: tierSales,
        salesTrend: (Math.random() * 20).toFixed(1), // Mock trend for UI
        totalOrders: tierOrdersCount,
        ordersTrend: (Math.random() * 15).toFixed(1),
        averageOrderValue: tierOrdersCount > 0 ? tierSales / tierOrdersCount : 0,
        aovTrend: (Math.random() * 10).toFixed(1),
      };
    });

    // 4. Seller Performance List
    const sellerStats = sellers.map(seller => {
      const sellerOrders = orders.filter(o => o.customerId === seller.id);
      const sales = sellerOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      return {
        seller,
        totalSales: sales,
        totalOrders: sellerOrders.length
      };
    });

    sellerStats.sort((a, b) => b.totalSales - a.totalSales);
    const topSellers = sellerStats.slice(0, 5);
    const lowestSellers = sellerStats.slice(-5).reverse();

    return res.status(200).json({
      metrics,
      chartData,
      tierPerformance,
      topSellers,
      lowestSellers,
      allSellers: sellerStats,
      levels
    });

  } catch (error) {
    console.error('Seller Performance API Error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error });
  }
}
