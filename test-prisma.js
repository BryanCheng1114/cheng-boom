import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const order = await prisma.order.findFirst({ include: { customer: true } });
  console.log(order);
}
check().finally(() => prisma.$disconnect());
