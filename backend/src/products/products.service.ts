import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'; // <--- Importe as exceptions
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client'; // Import para tipar o erro

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    try {
      return await this.prisma.product.create({
        data: createProductDto,
      });
    } catch (error) {
      // P2002 é o código do Prisma para violação de chave única (ex: barcode repetido)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe um produto com este código de barras.');
      }
      throw error; // Se for outro erro, repassa (vira 500)
    }
  }

 async findAll() {
    // Busca produtos incluindo os Lotes e os Estoques
    const products = await this.prisma.product.findMany({
      include: {
        batches: {
          include: { stock: true },
        },
      },
      orderBy: { name: 'asc' }
    });

    // Mapeia para retornar um campo extra 'totalStock'
    return products.map((product) => {
      const totalStock = product.batches.reduce((acc, batch) => {
        return acc + (batch.stock?.quantity || 0);
      }, 0);

      // Removemos a sujeira (batches) e retornamos o objeto limpo com o total
      const { batches, ...productData } = product;
      return {
        ...productData,
        totalStock, // <--- O campo mágico novo
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

  async update(id: string, updateProductDto: UpdateProductDto) {
    // Verifica se existe antes de tentar atualizar
    await this.findOne(id); // Já lança o 404 se não achar

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: string) {
    // Verifica se existe antes de tentar deletar
    await this.findOne(id); // Já lança o 404 se não achar

    return this.prisma.product.delete({
      where: { id },
    });
  }
}