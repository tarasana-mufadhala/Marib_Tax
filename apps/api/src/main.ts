import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { validateEnvironment } from './config/environment.js';

async function bootstrap(): Promise<void> {
  const environment = validateEnvironment(process.env);
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // رمز التجربة يتجاوز التحقق الحقيقي، فلا يمر مفعّلاً بلا أن يُرى.
  if (environment.DEV_OTP_CODE) {
    const logger = new Logger('Bootstrap');
    if (environment.NODE_ENV === 'production') {
      logger.error(
        '⚠ DEV_OTP_CODE مضبوط في بيئة الإنتاج — مُتجاهَل. أزِله من الإعدادات فوراً.',
      );
    } else {
      logger.warn(
        `⚠ رمز تحقق التجربة مُفعّل (DEV_OTP_CODE) في بيئة ${environment.NODE_ENV}. ` +
          'يجب ألا يُضبط في الإنتاج إطلاقاً.',
      );
    }
  }
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.enableShutdownHooks();
  await app.listen(environment.PORT, '0.0.0.0');
}

void bootstrap();
