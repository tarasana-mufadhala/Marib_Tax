import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { validateEnvironment } from './config/environment.js';

async function bootstrap(): Promise<void> {
  const environment = validateEnvironment(process.env);
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.enableShutdownHooks();
  await app.listen(environment.PORT, '0.0.0.0');
}

void bootstrap();
