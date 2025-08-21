"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RideGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let RideGateway = class RideGateway {
    server;
    connectedUsers = new Map();
    handleConnection(client) {
        const userId = client.handshake.query.userId;
        this.connectedUsers.set(userId, client.id);
        console.log(`User ${userId} connected to ride gateway with socketId ${client.id}`);
    }
    handleDisconnect(client) {
        const userId = client.handshake.query.userId;
        this.connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected from ride gateway`);
    }
    sendRideRequest(driverId, rideDetails) {
        const driverSocketId = this.connectedUsers.get(driverId);
        if (driverSocketId) {
            this.server.to(driverSocketId).emit('ride-request', rideDetails);
        }
    }
    sendRideAccepted(userId, rideDetails) {
        const userSocketId = this.connectedUsers.get(userId);
        if (userSocketId) {
            this.server.to(userSocketId).emit('ride-accepted', rideDetails);
        }
    }
    sendRideTerminated(userId, rideDetails) {
        const userSocketId = this.connectedUsers.get(userId);
        if (userSocketId) {
            this.server.to(userSocketId).emit('ride-terminated', rideDetails);
        }
    }
    sendRidePaymentConfirmed(userId, rideDetails) {
        const userSocketId = this.connectedUsers.get(userId);
        if (userSocketId) {
            this.server.to(userSocketId).emit('ride-payment-confirmed', rideDetails);
        }
    }
};
exports.RideGateway = RideGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RideGateway.prototype, "server", void 0);
exports.RideGateway = RideGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ namespace: '/ride' })
], RideGateway);
//# sourceMappingURL=ride.gateway.js.map