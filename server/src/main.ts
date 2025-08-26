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




// env 

// MONGODB_URI =mongodb+srv://mayankhenceforth:mayank@cluster0.i9wbho7.mongodb.net/taxi
// ACCESS_TOKEN_SECRET =hello
// ACCESS_TOKEN_EXPIRY =15m
// REFRESH_TOKEN_SECRET =texi_booking
// REFRESH_TOKEN_EXPIRY =7d
// MAIL_HOST=
// MAIL_PORT=
// MAIL_USER=
// MAIL_PASS=
// RESET_PASSWORD_TOKEN=
// TWILIO_ACCOUNT_SID=AC222c0ca6b05080458862cf896fdbd156
// TWILIO_AUTH_TOKEN=a1df1044634cbed1f48711294f1c6435
// TWILIO_PHONE_NUMBER=+16402321206
// TWILIO_MY_NUMBER =+
// CLOUDINARY_CLOUD_NAME=dmedhsl41
// CLOUDINARY_API_KEY=466353179338123
// CLOUDINARY_API_SECRET=TJgPg12PJfX-ZXO4ATSssP1cHrE
// SUPER_ADMIN_EMAIL=
// SUPER_ADMIN_CONTACT=
// SUPER_ADMIN_PASSWORD=
// STRIPE_PUBLIC_KEY =pk_test_51Rurq8RI89TvMUR3Fh5CQJIs3SsLiDMZompM6TB1tG4251h42gbDwyiFqA4eByKSkpVkptzjfAQvd1pmWeUTxdXG00LUeFsfSU
// STRIPE_SECRET_KEY =sk_test_51Rurq8RI89TvMUR39dQnxdS2p39QVqbTd4pCykdEFgBpu0pbOfgFNWA7wD1YAKSaFDzQgTyVIu2h3FSqi8ZxZC7j00PI3G6B8d
// STRIPE_WEBHOOK_ENDPOINT_SECRET =whsec_4IRLZgK3xFEpaH1eIT4epQeY4b4yVKPe
// TWILIO_ACCOUNT_RECOVERY_CODE=N2N8RZLD6R7XPFFV4C94EDXJ
// FRONTEND_URL=http://localhost:5173
// RIDE_BIKE_FARE=15
// RIDE_BIKE_GST=12
// RIDE_CAR_FARE=20
// RIDE_CAR_GST=16

