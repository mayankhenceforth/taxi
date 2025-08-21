"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadInterceptor = UploadInterceptor;
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
function UploadInterceptor() {
    return (0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
    });
}
//# sourceMappingURL=file-upload.interceptor.js.map