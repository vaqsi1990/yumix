import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpErrorFilter } from './common/http-error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalFilters(new HttpErrorFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const corsOrigin = config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000';
  app.enableCors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  });

  const port = Number(config.get('PORT') ?? process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
  console.log(`Yumix API listening on http://0.0.0.0:${port}`);
}
bootstrap();
