"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ConfigureDB;
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
function ConfigureDB() {
    return mongoose_1.MongooseModule.forRootAsync({
        imports: [config_1.ConfigModule],
        useFactory: (configService) => ({
            uri: configService.get('MONGODB_URI'),
        }),
        inject: [config_1.ConfigService],
    });
}
//# sourceMappingURL=db.js.map