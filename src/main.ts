import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config/envs';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('PAYMENTS');
  const app = await NestFactory.create(AppModule, {
    rawBody: true
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  await app.listen(envs.port);
  logger.log(`Server is running on: ${envs.port}`);
}
bootstrap();
