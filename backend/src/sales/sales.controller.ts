import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('sales') // Organiza no Swagger
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar uma nova venda e baixar estoque' })
  create(@Body() createSaleDto: CreateSaleDto) {
    return this.salesService.create(createSaleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar histórico de vendas' })
  findAll() {
    return this.salesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de uma venda específica' })
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }
}