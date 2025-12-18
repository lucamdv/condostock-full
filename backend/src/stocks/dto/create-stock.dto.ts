import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsDateString, IsNotEmpty, Min } from 'class-validator';

export class CreateStockDto {
  @ApiProperty({ example: 'uuid-do-produto-aqui', description: 'ID do Produto' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'LOTE-2025-A', description: 'Código do lote impresso' })
  @IsString()
  @IsNotEmpty()
  batchCode: string;

  @ApiProperty({ example: '2025-12-31T00:00:00.000Z', description: 'Data de validade ISO8601' })
  @IsDateString()
  expiryDate: string;

  @ApiProperty({ example: 50, description: 'Quantidade entrando no estoque' })
  @IsInt()
  @Min(1)
  quantity: number;
}