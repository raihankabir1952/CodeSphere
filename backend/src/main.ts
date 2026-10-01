import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const frontendUrl =
    process.env.FRONTEND_URL || 'http://localhost:3000';

  const port =
    Number(process.env.PORT) || 3001;

  app.enableCors({
    origin: frontendUrl,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);
}

bootstrap();
