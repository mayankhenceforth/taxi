export declare class SignUpDto {
    readonly name: string;
    readonly password: string;
    readonly contactNumber: number;
    readonly countryCode: string;
    readonly email?: string;
    readonly role: 'user' | 'driver';
    readonly profilePic?: string;
    driverLicenseNumber?: string;
    licenseIssueDate?: string;
    licenseExpiryDate?: string;
    issuingAuthority?: string;
    vehicleNumberPlate?: string;
    vehicleType?: string;
    vehicleModel?: string;
    readonly coordinates?: [number, number];
}
