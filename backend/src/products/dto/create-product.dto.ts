import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Coca-Cola 2L', description: 'Nome do produto' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Refrigerante de cola', description: 'Descrição detalhada' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '7894900011517', description: 'Código de barras EAN' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiProperty({ example: 10.50, description: 'Preço de venda' })
  @IsNumber()
  price: number;

  @ApiProperty({ example: 10, description: 'Estoque mínimo para alerta', default: 5 })
  @IsNumber()
  @IsOptional()
  minStock?: number;
}