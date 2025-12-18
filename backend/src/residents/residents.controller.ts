import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccessStatus } from '@prisma/client';

@ApiTags('residents')
@Controller('residents')
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo morador (Titular)' })
  create(@Body() createResidentDto: CreateResidentDto) {
    return this.residentsService.create(createResidentDto);
  }

  // --- 👇 ROTAS DE CONTEXTO DO USUÁRIO 👇 ---

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me/unit')
  @ApiOperation({ summary: 'Listar minha unidade (Família)' })
  getMyUnit(@Request() req) {
    return this.residentsService.getMyUnit(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('me/dependent')
  @ApiOperation({ summary: 'Adicionar dependente na minha unidade' })
  requestDependent(@Request() req, @Body() createResidentDto: CreateResidentDto) {
    return this.residentsService.requestDependent(req.user.id, createResidentDto);
  }

  // --- 👇 ROTAS ADMINISTRATIVAS (SÍNDICO) 👇 ---

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('pending')
  @ApiOperation({ summary: 'Listar solicitações de cadastro pendentes' })
  getPending() {
    return this.residentsService.getPendingRequests();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id/status')
  @ApiOperation({ summary: 'Aprovar ou Rejeitar um morador' })
  updateStatus(
    @Param('id') id: string, 
    @Body() body: { status: AccessStatus }
  ) {
    return this.residentsService.updateStatus(id, body.status);
  }

  // --- 👇 ROTAS PADRÃO 👇 ---

  @Get()
  @ApiOperation({ summary: 'Listar todos os moradores' })
  findAll() {
    return this.residentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar morador por ID' })
  findOne(@Param('id') id: string) {
    return this.residentsService.findOne(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Histórico de compras do morador' })
  getHistory(@Param('id') id: string) {
    return this.residentsService.getHistory(id);
  }

  @Post(':id/change-password')
  @ApiOperation({ summary: 'Troca de senha' })
  changePassword(@Param('id') id: string, @Body() body: { password: string }) {
    return this.residentsService.changePassword(id, body.password);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados do morador' })
  update(@Param('id') id: string, @Body() updateResidentDto: UpdateResidentDto) {
    return this.residentsService.update(id, updateResidentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover morador definitivamente' })
  remove(@Param('id') id: string) {
    return this.residentsService.remove(id);
  }
}