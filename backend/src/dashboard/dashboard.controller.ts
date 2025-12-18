import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Métricas gerais para o síndico (Vendas, Estoque Baixo, Contas a Receber)' })
  getMetrics() {
    return this.dashboardService.getMetrics();
  }
}