import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'SEGREDO_SUPER_SECRETO', // Certifique-se que é a mesma chave do AuthModule
    });
  }

  async validate(payload: any) {
    // 👇 LOG DE DEBUG: Para vermos o que tem dentro do Token
    console.log('🔍 PAYLOAD DO TOKEN RECEBIDO:', payload);

    // Tenta pegar o ID de 'sub' (padrão JWT) OU de 'id' (padrão antigo)
    const userId = payload.sub || payload.id;

    if (!userId) {
      console.error('❌ ERRO: Token não tem ID nem sub!');
      throw new UnauthorizedException('Token inválido: ID do usuário não encontrado.');
    }

    // Retorna o usuário para o Request
    return { id: userId, email: payload.email, role: payload.role };
  }
}