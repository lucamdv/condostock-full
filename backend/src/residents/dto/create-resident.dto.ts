import { IsNotEmpty, IsOptional, IsString, IsEnum, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role, UnitRole, AccessStatus } from '@prisma/client';

export class CreateResidentDto {
  @ApiProperty({ example: 'João da Silva' })
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  name: string;

  @ApiProperty({ example: '12345678900' })
  @IsString()
  @IsNotEmpty({ message: 'O CPF é obrigatório' })
  cpf: string;

  // 👇 MUDANÇA AQUI: De IsNotEmpty para IsOptional
  @ApiProperty({ example: '302', required: false })
  @IsString()
  @IsOptional()
  apartment?: string;

  // 👇 MUDANÇA AQUI: De IsNotEmpty para IsOptional
  @ApiProperty({ example: 'A', required: false })
  @IsString()
  @IsOptional()
  block?: string;

  @ApiProperty({ required: false, example: '81999999999' })
  @IsString()
  @IsOptional()
  phone?: string;
  
  @ApiProperty({ required: false, example: 'joao@email.com' })
  @IsString()
  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido' }) // Adicionei validação de formato de email
  email?: string;

  @ApiProperty({ enum: Role, required: false })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiProperty({ enum: UnitRole, required: false })
  @IsEnum(UnitRole)
  @IsOptional()
  unitRole?: UnitRole;

  @ApiProperty({ enum: AccessStatus, required: false })
  @IsEnum(AccessStatus)
  @IsOptional()
  status?: AccessStatus;
}