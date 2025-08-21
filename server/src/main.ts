import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { raw } from 'express';
import * as bodyParser from 'body-parser';
import * as net from 'net';

async function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      server.close(() => resolve(startPort));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: '*', // allow all origins, you can restrict this
    
  });

  app.use('/stripe/webhook', bodyParser.raw({ type: 'application/json' }));

  const config = new DocumentBuilder()
    .setTitle('Taxi Booking API')
    .setDescription('API documentation for Taxi Booking system')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = await findAvailablePort(Number(process.env.PORT) || 3000);
  await app.listen(port);

  console.log(`🚖 Taxi Booking API is running on: http://localhost:${port}`);
  console.log(`📘 Swagger Docs: http://localhost:${port}/api`);
}
bootstrap();

