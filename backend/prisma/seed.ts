import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Senha padrão do síndico (pode manter admin123 ou mudar)
  const password = await bcrypt.hash('admin123', 10);

  // CPF fictício do Síndico: 000.000.000-00 (apenas números)
  const sindicoCpf = '00000000000';

  await prisma.resident.upsert({
    where: { cpf: sindicoCpf },
    update: {},
    create: {
      name: 'Síndico Geraldo',
      cpf: sindicoCpf,
      password: password,
      role: 'ADMIN',
      apartment: '100',
      block: 'A',
      isFirstLogin: false, // Síndico já entra configurado
      account: {
        create: { balance: 0, status: 'ACTIVE' }
      }
    },
  });

  console.log('🌱 Banco semeado com o Síndico (CPF: 00000000000)!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());