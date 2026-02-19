import * as Sentry from '@sentry/nestjs';

// Initialize Sentry (before anything else)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  });
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix (exclude health endpoints for Docker health checks)
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'health/live', 'health/ready'],
  });

  // CORS
  const corsOrigins = process.env.CORS_ORIGINS?.split(',');
  if (!corsOrigins && process.env.NODE_ENV === 'production') {
    console.error('FATAL: CORS_ORIGINS must be set in production');
    process.exit(1);
  }
  app.enableCors({
    origin: corsOrigins || ['http://localhost:3000'],
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger API Documentation (disabled in production)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle(process.env.APP_NAME ? `${process.env.APP_NAME} API` : 'Plexo Operations API')
      .setDescription('API for retail operations management')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('auth', 'Autenticación')
      .addTag('users', 'Gestión de usuarios')
      .addTag('stores', 'Gestión de tiendas')
      .addTag('tasks', 'Plan del día - Tareas')
      .addTag('receiving', 'Recepciones')
      .addTag('issues', 'Incidencias')
      .addTag('checklists', 'Checklists / SOPs')
      .addTag('store-audits', 'Auditorias e Inspecciones')
      .addTag('planograms', 'Visual Merchandising / Planogramas')
      .addTag('corrective-actions', 'Acciones Correctivas (CAPA)')
      .addTag('gamification', 'Gamificacion')
      .addTag('training', 'Entrenamiento / LMS')
      .addTag('platform', 'Platform Administration')
      .addTag('invitations', 'User Invitations')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);

  const appName = process.env.APP_NAME || 'Plexo';
  console.log(`${appName} API running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
