"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
const bodyParser = require("body-parser");
const net = require("net");
async function findAvailablePort(startPort) {
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
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: '*',
    });
    app.use('/stripe/webhook', bodyParser.raw({ type: 'application/json' }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Taxi Booking API')
        .setDescription('API documentation for Taxi Booking system')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    const port = await findAvailablePort(Number(process.env.PORT) || 3000);
    await app.listen(port);
    console.log(`🚖 Taxi Booking API is running on: http://localhost:${port}`);
    console.log(`📘 Swagger Docs: http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map