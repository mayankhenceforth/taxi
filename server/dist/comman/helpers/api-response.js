"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ApiResponse {
    success;
    message;
    data;
    statusCode;
    constructor(success, message, statusCode, data) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.statusCode = statusCode;
    }
}
exports.default = ApiResponse;
//# sourceMappingURL=api-response.js.map