import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.setGlobalPrefix('p4u-api');
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://illp4u.kr',
    ],
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();
