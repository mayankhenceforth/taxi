import { Socket } from "socket.io";
export declare class RideGateway {
    private server;
    private connectedUsers;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    sendRideRequest(driverId: string, rideDetails: any): void;
    sendRideAccepted(userId: string, rideDetails: any): void;
    sendRideTerminated(userId: string, rideDetails: any): void;
    sendRidePaymentConfirmed(userId: string, rideDetails: any): void;
}
