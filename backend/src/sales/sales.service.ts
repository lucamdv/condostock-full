import { BadRequestException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateSaleDto } from './dto/create-sale.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async create(createSaleDto: CreateSaleDto) {
    const { items, paymentType, residentId } = createSaleDto;

    // REGRA 1: Fiado obriga identificar morador
    if (paymentType === 'FIADO' && !residentId) {
      throw new BadRequestException('Para vendas no FIADO, é obrigatório informar o ID do morador.');
    }

    // Tratativa para garantir que residentId seja null se não for enviado
    const finalResidentId = paymentType === 'FIADO' ? residentId : null;

    // INÍCIO DA TRANSAÇÃO (Estoque + Financeiro + Venda)
    return this.prisma.$transaction(async (tx) => {
      let totalSale = 0;
      const saleItemsToCreate: any[] = []; // O 'any[]' resolve aquele erro do TypeScript

      // --- PASSO 1: Calcular Total e Baixar Estoque ---
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });

        if (!product) {
          throw new NotFoundException(`Produto ${item.productId} não encontrado.`);
        }

        const itemTotal = Number(product.price) * item.quantity;
        totalSale += itemTotal;

        // FEFO - Baixa de Estoque Inteligente
        const stocks = await tx.stock.findMany({
          where: {
            batch: { productId: item.productId },
            quantity: { gt: 0 },
          },
          include: { batch: true },
          orderBy: { batch: { expiryDate: 'asc' } },
        });

        const totalAvailable = stocks.reduce((acc, s) => acc + s.quantity, 0);

        if (totalAvailable < item.quantity) {
          throw new BadRequestException(
            `Estoque insuficiente para '${product.name}'. Disponível: ${totalAvailable}`
          );
        }

        let quantityRemaining = item.quantity;

        for (const stock of stocks) {
          if (quantityRemaining <= 0) break;
          const deduction = Math.min(stock.quantity, quantityRemaining);
          
          await tx.stock.update({
            where: { id: stock.id },
            data: { quantity: stock.quantity - deduction },
          });

          quantityRemaining -= deduction;
        }

        saleItemsToCreate.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.price,
        });
      }
      // --- FIM DO CÁLCULO E ESTOQUE ---

      // --- PASSO 2: Gestão Financeira (FIADO) ---
      if (paymentType === 'FIADO') {
        // Busca a conta do morador
        const account = await tx.residentAccount.findUnique({
          where: { residentId: finalResidentId as string },
        });

        if (!account) {
          throw new NotFoundException('Conta do morador não encontrada para cobrança.');
        }

        if (account.status === 'BLOCKED') {
          throw new ConflictException('Conta do morador está BLOQUEADA por inadimplência.');
        }

        // Verifica Limite: (Saldo Devedor Atual + Nova Compra) > Limite?
        const currentDebt = Number(account.balance);
        const limit = Number(account.creditLimit);

        if (currentDebt + totalSale > limit) {
          throw new BadRequestException(
            `Compra negada. Limite excedido. Saldo devedor: R$ ${currentDebt}, Limite: R$ ${limit}, Tentativa: R$ ${totalSale}`
          );
        }

        // Atualiza a dívida do morador
        await tx.residentAccount.update({
          where: { id: account.id },
          data: {
            balance: { increment: totalSale }, // Soma a nova venda ao saldo
          },
        });
      }

      // --- PASSO 3: Registrar a Venda ---
      const sale = await tx.sale.create({
        data: {
          total: totalSale,
          paymentType,
          residentId: finalResidentId,
          status: 'COMPLETED',
          items: {
            create: saleItemsToCreate,
          },
        },
        include: { items: { include: { product: true } } },
      });

      return sale;
    });
  }

  async findAll() {
    return this.prisma.sale.findMany({
      include: {
        items: { include: { product: true } },
        resident: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
    if (!sale) throw new NotFoundException('Venda não encontrada.');
    return sale;
  }
}