import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // --- 1. CRIAÇÃO INTELIGENTE (Adaptada ao Schema Atual) ---
  async create(data: any) { 
    // 1. Tratamento de dados padrão
    const stockQuantity = Number(data.stock) || 0;
    const price = Number(data.price) || 0;
    
    // Gera dados automáticos para o Lote (obrigatórios no seu schema)
    const batchCode = `LOTE-${Date.now()}`; // Ex: LOTE-170123456789
    const defaultExpiry = new Date();
    defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1); // Validade de 1 ano

    // 2. Verifica se já existe produto com esse código de barras
    const existing = await this.prisma.product.findUnique({
      where: { barcode: data.barcode },
    });

    // CENÁRIO A: Produto já existe (Atualiza preço e soma estoque)
    if (existing) {
      return this.prisma.product.update({
        where: { id: existing.id },
        data: {
          price: price, 
          // Cria um NOVO LOTE ligado a este produto
          batches: {
            create: {
              code: batchCode, // Campo obrigatório do seu schema
              expiryDate: defaultExpiry, // Campo se chama expiryDate no seu schema
              stock: {
                create: {
                  quantity: stockQuantity,
                },
              },
            },
          },
        },
      });
    }

    // CENÁRIO B: Produto Novo
    return this.prisma.product.create({
      data: {
        name: data.name,
        barcode: data.barcode,
        price: price,
        description: data.description || '',
        imageUrl: data.imageUrl || '',
        
        // Cria o Lote Inicial
        batches: {
          create: {
            code: batchCode,
            expiryDate: defaultExpiry,
            stock: {
              create: {
                quantity: stockQuantity,
              },
            },
          },
        },
      },
    });
  }

  // --- 2. LISTAGEM COM CÁLCULO DE ESTOQUE TOTAL ---
  async findAll() {
    const products = await this.prisma.product.findMany({
      include: {
        batches: {
          include: { stock: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return products.map((product) => {
      // Soma a quantidade de todos os stocks de todos os batches
      const totalStock = product.batches.reduce((acc, batch) => {
        return acc + (batch.stock?.quantity || 0);
      }, 0);

      const { batches, ...productData } = product;
      return {
        ...productData,
        totalStock, 
      };
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    
    if (!product) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado.`);
    }
    return product;
  }

  // --- ATUALIZAÇÃO SEGURA ---
  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id); 

    // 👇 AQUI ESTÁ A CORREÇÃO:
    // Removemos o 'stock' do objeto updateProductDto, pois ele não existe na tabela Product.
    // O estoque deve ser gerido apenas na criação (novo lote) ou em rotas específicas de ajuste.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { stock, ...dataToUpdate } = updateProductDto;

    return this.prisma.product.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  // --- 3. REMOÇÃO SEGURA (Cascata Manual) ---
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      // 1. Busca os lotes desse produto
      const batches = await tx.batch.findMany({
        where: { productId: id },
        select: { id: true }
      });

      // 2. Deleta os estoques ligados a esses lotes
      for (const batch of batches) {
        await tx.stock.delete({
          where: { batchId: batch.id }
        });
      }

      // 3. Deleta os lotes
      await tx.batch.deleteMany({
        where: { productId: id }
      });

      // 4. Deleta itens de venda (se houver, para não quebrar integridade)
      await tx.saleItem.deleteMany({
        where: { productId: id }
      });

      // 5. Finalmente, deleta o produto
      return tx.product.delete({
        where: { id },
      });
    });
  }
}