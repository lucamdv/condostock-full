import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UnitRole, AccessStatus, Role } from '@prisma/client';

@Injectable()
export class ResidentsService {
  constructor(private prisma: PrismaService) {}

  // --- 1. CRIAÇÃO PELO SÍNDICO (Cria um Titular Ativo) ---
  async create(createResidentDto: CreateResidentDto) {
    const cleanCpf = createResidentDto.cpf.replace(/\D/g, '');
    
    // Se não vier senha (DTO do frontend), gera padrão
    const defaultPassword = cleanCpf.substring(0, 4);

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    return this.prisma.resident.create({
      data: {
        ...createResidentDto,
        password: hashedPassword,
        isFirstLogin: true,
        // Garantia de string para o Prisma não dar erro de undefined
        apartment: createResidentDto.apartment ?? '',
        block: createResidentDto.block ?? '',
        status: createResidentDto.status ?? 'ACTIVE',
        account: {
          create: {
            balance: 0,
            status: 'ACTIVE',
          },
        },
      },
    });
  }

  // --- 2. SOLICITAÇÃO DE DEPENDENTE (Pai cadastra Filho pelo Frontend) ---
  async requestDependent(ownerId: string, data: CreateResidentDto) {
    const owner = await this.prisma.resident.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      throw new NotFoundException('Dono da unidade não encontrado');
    }

    // CPF limpo para gerar senha padrão caso necessário
    const cleanCpf = data.cpf.replace(/\D/g, '');
    const defaultPassword = cleanCpf.substring(0, 4);
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    return this.prisma.resident.create({
      data: {
        name: data.name,
        cpf: data.cpf,
        email: data.email || undefined,
        phone: data.phone || undefined,
        password: hashedPassword, // Dependente ganha sua própria senha inicial
        apartment: owner.apartment ?? '',
        block: owner.block ?? '',
        role: 'RESIDENT',
        unitRole: 'MEMBER',
        status: 'PENDING',
        ownerId: owner.id,
        isFirstLogin: true,
      },
    });
  }

  // --- 3. SÍNDICO APROVA (OU REJEITA) ---
  async updateStatus(id: string, status: AccessStatus) {
    const resident = await this.prisma.resident.findUnique({ where: { id } });
    if (!resident) throw new NotFoundException('Morador não encontrado');

    return this.prisma.resident.update({
      where: { id },
      data: { status },
    });
  }

  // --- 4. LISTAR FAMÍLIA (Lógica Blindada para o Frontend) ---
  async getMyUnit(userId: string) {
    const user = await this.prisma.resident.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    let mainOwnerId = user.id;

    // Se for dependente, busca os dados a partir do dono da unidade
    if (user.role !== 'ADMIN' && user.unitRole === 'MEMBER' && user.ownerId) {
      mainOwnerId = user.ownerId;
    }

    return this.prisma.resident.findMany({
      where: {
        OR: [{ id: mainOwnerId }, { ownerId: mainOwnerId }],
      },
      orderBy: { unitRole: 'asc' },
      include: { account: true },
    });
  }

  // --- 5. LISTAR PENDENTES (Para o Dashboard/Fila de Aprovação) ---
  async getPendingRequests() {
    return this.prisma.resident.findMany({
      where: { status: 'PENDING' },
      include: {
        owner: {
          select: { name: true, apartment: true, block: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- MÉTODOS DE CONSULTA E HISTÓRICO ---

  findAll() {
    return this.prisma.resident.findMany({
      include: { account: true, dependents: true },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.resident.findUnique({
      where: { id },
      include: { account: true, dependents: true, owner: true },
    });
  }

  async getHistory(id: string) {
    return this.prisma.sale.findMany({
      where: { residentId: id },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- ATUALIZAÇÕES ---

  async update(id: string, updateResidentDto: UpdateResidentDto) {
    return this.prisma.resident.update({
      where: { id },
      data: updateResidentDto,
    });
  }

  async changePassword(id: string, newPass: string) {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(newPass, salt);

    return this.prisma.resident.update({
      where: { id },
      data: {
        password: hash,
        isFirstLogin: false,
      },
    });
  }

  // --- REMOÇÃO SEGURA (Cascata Manual) ---
  // Substitui o delete simples para evitar erro de Foreign Key
  async remove(id: string) {
    const resident = await this.prisma.resident.findUnique({
      where: { id },
      include: { dependents: true },
    });

    if (!resident) {
      throw new NotFoundException('Morador não encontrado');
    }

    return this.prisma.$transaction(async (tx) => {
      
      // A. Se for um Titular, deleta dependentes e seus dados
      if (resident.dependents.length > 0) {
        for (const dep of resident.dependents) {
           await tx.sale.deleteMany({ where: { residentId: dep.id } });
           await tx.residentAccount.deleteMany({ where: { residentId: dep.id } });
        }
        await tx.resident.deleteMany({
          where: { ownerId: id },
        });
      }

      // B. Deleta dados do próprio usuário alvo
      await tx.sale.deleteMany({
        where: { residentId: id },
      });

      await tx.residentAccount.deleteMany({
        where: { residentId: id },
      });

      // C. Deleta o usuário final
      return tx.resident.delete({
        where: { id },
      });
    });
  }
}