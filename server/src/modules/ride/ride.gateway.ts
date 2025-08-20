import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({ namespace: '/ride' })
export class RideGateway {
    @WebSocketServer() private server: Server; 
    private connectedUsers: Map<string, string> = new Map();

    handleConnection(client: Socket) {
        const userId = client.handshake.query.userId as string;
        this.connectedUsers.set(userId, client.id);
        console.log(`User ${userId} connected to ride gateway with socketId ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        const userId = client.handshake.query.userId as string;
        this.connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected from ride gateway`);
    }

    sendRideRequest(driverId: string, rideDetails: any) {
        const driverSocketId = this.connectedUsers.get(driverId);
        if (driverSocketId) {
            this.server.to(driverSocketId).emit('ride-request', rideDetails);
        }
    }

    sendRideAccepted(userId: string, rideDetails: any) {
        const userSocketId = this.connectedUsers.get(userId);
        if (userSocketId) {
            this.server.to(userSocketId).emit('ride-accepted', rideDetails);
        }
    }

    sendRideTerminated(userId: string, rideDetails: any) {
        const userSocketId = this.connectedUsers.get(userId); 
        if (userSocketId) {
            this.server.to(userSocketId).emit('ride-terminated', rideDetails);
        }
    }
}
