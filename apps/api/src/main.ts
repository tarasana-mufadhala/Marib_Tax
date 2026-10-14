import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { validateEnvironment } from './config/environment.js';

async function bootstrap(): Promise<void> {
  const environment = validateEnvironment(process.env);
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  if (environment.DEV_OTP_CODE) {
    const logger = new Logger('Bootstrap');
    logger.warn(
      `⚠ رمز تحقق التجربة مُفعّل (DEV_OTP_CODE) في بيئة ${environment.NODE_ENV}. ` +
        'يجب ألا يُضبط في الإنتاج إطلاقاً.',
    );
  }

  const configuredOrigins = (environment.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin:
      configuredOrigins.length > 0
        ? configuredOrigins
        : environment.NODE_ENV === 'production'
          ? false
          : true,
    credentials: true,
  });

  app.enableShutdownHooks();
  await app.listen(environment.PORT, '0.0.0.0');
}

void bootstrap();
