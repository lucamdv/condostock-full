import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

async getMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Vendas de Hoje
    const salesToday = await this.prisma.sale.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: { createdAt: { gte: today } },
    });

    // 2. Vendas do Mês
    const salesMonth = await this.prisma.sale.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: firstDayOfMonth } },
    });

    // 3. Total a Receber
    const totalReceivable = await this.prisma.residentAccount.aggregate({
      _sum: { balance: true },
    });

    // 4. Produtos com Estoque Baixo (CORRIGIDO)
    // Buscamos: Produto -> Lotes -> Estoque
    const allProducts = await this.prisma.product.findMany({
      include: {
        batches: {
          include: { stock: true } // <--- O caminho correto é através de 'batches'
        }
      },
    });

    const lowStockProducts = allProducts.filter((product: any) => {
      // Navega pelos lotes para somar o estoque total
      const totalQuantity = product.batches.reduce((acc, batch) => {
        return acc + (batch.stock?.quantity || 0);
      }, 0);

      return totalQuantity <= (product.minStock || 5);
    }).map((p: any) => ({
      name: p.name,
      minStock: p.minStock,
      currentStock: p.batches.reduce((acc, batch) => acc + (batch.stock?.quantity || 0), 0)
    }));

    return {
      revenue: {
        today: salesToday._sum.total || 0,
        month: salesMonth._sum.total || 0,
        ordersToday: salesToday._count.id || 0,
      },
      finance: {
        totalReceivable: totalReceivable._sum.balance || 0,
      },
      alerts: {
        lowStockCount: lowStockProducts.length,
        items: lowStockProducts,
      },
    };
}
}