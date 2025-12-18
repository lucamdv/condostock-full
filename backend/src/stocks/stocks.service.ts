import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'; // <--- Imports novos
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto'; // Importe o DTO se não tiver
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StocksService {
  constructor(private prisma: PrismaService) {}

  async create(createStockDto: CreateStockDto) {
    const { productId, batchCode, expiryDate, quantity } = createStockDto;

    // 1. Verifica se o produto existe
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      // ERRO 404: Muito mais claro que um erro 500 genérico
      throw new NotFoundException('Produto não encontrado. Verifique o ID informado.');
    }

    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.batch.create({
        data: {
          code: batchCode,
          expiryDate: new Date(expiryDate),
          productId: productId,
        },
      });

      const stock = await tx.stock.create({
        data: {
          batchId: batch.id,
          quantity: quantity,
        },
      });

      return { batch, stock };
    });
  }

  async findAll() {
    return this.prisma.stock.findMany({
      include: {
        batch: { include: { product: true } },
      },
    });
  }

  // Método auxiliar para buscar e validar existência
  async findOne(id: string) {
    const stock = await this.prisma.stock.findUnique({
      where: { id },
      include: { batch: true },
    });

    if (!stock) {
      throw new NotFoundException(`Registro de estoque ${id} não encontrado.`);
    }
    return stock;
  }

  async update(id: string, updateStockDto: UpdateStockDto) {
    const { quantity, expiryDate, batchCode } = updateStockDto;

    // Reutiliza o findOne para garantir que existe (Lança 404 se falhar)
    const currentStock = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      if (expiryDate || batchCode) {
        await tx.batch.update({
          where: { id: currentStock.batchId },
          data: {
            code: batchCode,
            expiryDate: expiryDate ? new Date(expiryDate) : undefined,
          },
        });
      }

      if (quantity !== undefined) {
        await tx.stock.update({
          where: { id },
          data: { quantity },
        });
      }

      return tx.stock.findUnique({
        where: { id },
        include: { batch: true },
      });
    });
  }

  async remove(id: string) {
    // Garante que existe antes de tentar deletar
    const stock = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.stock.delete({ where: { id } });
      await tx.batch.delete({ where: { id: stock.batchId } });
      return { message: 'Estoque e Lote removidos com sucesso' };
    });
  }
}