import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('products')
@UseGuards(JwtAuthGuard) // Protege todas as rotas (apenas logados)
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar ou Atualizar produto (Manual ou via XML)' })
  create(@Body() body: any) {
    // Usamos 'any' aqui para permitir que o Frontend envie o campo 'stock'
    // que será tratado pelo Service para criar o Lote/Batch inicial.
    return this.productsService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'Listar produtos com estoque somado' })
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar detalhes de um produto' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados cadastrais do produto' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover produto e todo seu estoque' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}