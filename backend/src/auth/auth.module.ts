import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ResidentsModule } from '../residents/residents.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    ResidentsModule,
    PassportModule,
    PrismaModule,
    // 👇 AQUI ESTÁ O SEGREDO: A chave tem que ser idêntica à do jwt.strategy.ts
    JwtModule.register({
      secret: 'SEGREDO_SUPER_SECRETO', 
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}