import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // <--- Adicione isso para não precisar importar em todo lugar
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // <--- Exporta para outros módulos usarem
})
export class PrismaModule {}