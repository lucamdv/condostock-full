import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Configuração de Validação Global (já ajuda o Swagger a ler os DTOs)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // 2. Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('CondoStock API')
    .setDescription('API de gestão de estoque e PDV para condomínios')
    .setVersion('1.0')
    .addTag('products')
    .addTag('stocks')
    .addTag('sales')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Acessível em /api

  app.enableCors(); // Bom deixar ativado para o futuro Frontend
  await app.listen(3000);
}
bootstrap();