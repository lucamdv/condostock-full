import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, IsOptional, IsUUID, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

// Define o formato de um item do carrinho
export class SaleItemDto {
  @ApiProperty({ example: 'colar-uuid-do-produto-aqui', description: 'ID do Produto' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 2, description: 'Quantidade comprada' })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateSaleDto {
  @ApiProperty({ type: [SaleItemDto], description: 'Carrinho de compras' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @ApiProperty({ 
    enum: ['CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'CASH', 'FIADO'], 
    example: 'CASH',
    description: 'Forma de pagamento'
  })
  @IsEnum(['CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'CASH', 'FIADO'])
  paymentType: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'CASH' | 'FIADO';

  @ApiPropertyOptional({ example: 'uuid-do-morador', description: 'Obrigatório apenas se for FIADO' })
  @IsOptional()
  @IsUUID()
  residentId?: string;
}