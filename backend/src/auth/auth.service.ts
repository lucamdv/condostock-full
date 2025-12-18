import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Validar usuário (AGORA COM CPF)
  async validateUser(cpf: string, pass: string): Promise<any> {
    // Busca o usuário pelo CPF no banco de dados
    const user = await this.prisma.resident.findUnique({ where: { cpf } });

    if (user && (await bcrypt.compare(pass, user.password))) {
      // Retorna o usuário sem a senha
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  // Gerar o Token de Acesso
  async login(user: any) {
    // Payload agora carrega roles de sistema e de família
    const payload = { 
      sub: user.id, 
      cpf: user.cpf, 
      name: user.name,
      role: user.role,         // ADMIN ou RESIDENT
      unitRole: user.unitRole  // OWNER ou MEMBER (Novo)
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      // Enviamos todos os dados críticos para o Frontend salvar no LocalStorage
      user: {
        id: user.id,
        name: user.name,
        cpf: user.cpf,
        role: user.role,           // Permissão do App
        unitRole: user.unitRole,   // Permissão da Família (Novo)
        status: user.status,       // Se está ACTIVE ou PENDING (Novo)
        apartment: user.apartment,
        block: user.block,
        isFirstLogin: user.isFirstLogin 
      }
    };
  }

  // Método auxiliar para criar senha criptografada (Hash)
  async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }
}