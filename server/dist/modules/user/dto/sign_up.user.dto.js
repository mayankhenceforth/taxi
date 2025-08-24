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
exports.SignUpDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class DriverLicenseDto {
    licenseNumber;
    issueDate;
    expiryDate;
    issuingAuthority;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'DL123456789',
        description: 'Driver license number',
        required: false,
        type: String,
    }),
    (0, class_validator_1.ValidateIf)(o => o.role === 'driver'),
    (0, class_validator_1.IsNotEmpty)({ message: 'License number is required for drivers' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DriverLicenseDto.prototype, "licenseNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '2023-01-15',
        description: 'License issue date',
        required: false,
        type: String,
        format: 'date',
    }),
    (0, class_validator_1.ValidateIf)(o => o.role === 'driver'),
    (0, class_validator_1.IsNotEmpty)({ message: 'Issue date is required for drivers' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], DriverLicenseDto.prototype, "issueDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '2033-01-15',
        description: 'License expiry date',
        required: false,
        type: String,
        format: 'date',
    }),
    (0, class_validator_1.ValidateIf)(o => o.role === 'driver'),
    (0, class_validator_1.IsNotEmpty)({ message: 'Expiry date is required for drivers' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], DriverLicenseDto.prototype, "expiryDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'State RTO',
        description: 'Issuing authority',
        required: false,
        type: String,
    }),
    (0, class_validator_1.ValidateIf)(o => o.role === 'driver'),
    (0, class_validator_1.IsNotEmpty)({ message: 'Issuing authority is required for drivers' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DriverLicenseDto.prototype, "issuingAuthority", void 0);
class VehicleDetailsDto {
    numberPlate;
    type;
    model;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'ABC1234',
        description: 'Vehicle number plate',
        required: false,
        type: String,
    }),
    (0, class_validator_1.ValidateIf)(o => o.role === 'driver'),
    (0, class_validator_1.IsNotEmpty)({ message: 'Number plate is required for drivers' }),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => value.toUpperCase()),
    __metadata("design:type", String)
], VehicleDetailsDto.prototype, "numberPlate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'car',
        description: 'Vehicle type',
        enum: ['car', 'bike', 'truck'],
        required: false,
        type: String,
    }),
    (0, class_validator_1.ValidateIf)(o => o.role === 'driver'),
    (0, class_validator_1.IsNotEmpty)({ message: 'Vehicle type is required for drivers' }),
    (0, class_validator_1.IsEnum)(['car', 'bike', 'truck']),
    __metadata("design:type", String)
], VehicleDetailsDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Toyota Camry',
        description: 'Vehicle model',
        required: false,
        type: String,
    }),
    (0, class_validator_1.ValidateIf)(o => o.role === 'driver'),
    (0, class_validator_1.IsNotEmpty)({ message: 'Vehicle model is required for drivers' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VehicleDetailsDto.prototype, "model", void 0);
class LocationDto {
    type;
    longitude;
    latitude;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Point',
        description: 'Location type',
        required: false,
        type: String,
        default: 'Point'
    }),
    (0, class_validator_1.ValidateIf)(o => o.role === 'driver'),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LocationDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 77.2090,
        description: 'Longitude coordinate',
        required: false,
        type: Number,
    }),
    (0, class_validator_1.ValidateIf)(o => o.role === 'driver'),
    (0, class_validator_1.IsNotEmpty)({ message: 'Longitude is required for drivers' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], LocationDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 28.6139,
        description: 'Latitude coordinate',
        required: false,
        type: Number,
    }),
    (0, class_validator_1.ValidateIf)(o => o.role === 'driver'),
    (0, class_validator_1.IsNotEmpty)({ message: 'Latitude is required for drivers' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], LocationDto.prototype, "latitude", void 0);
class SignUpDto {
    name;
    password;
    contactNumber;
    countryCode;
    email;
    role;
    profilePic;
    driverLicenseNumber;
    licenseIssueDate;
    licenseExpiryDate;
    issuingAuthority;
    vehicleNumberPlate;
    vehicleType;
    vehicleModel;
    coordinates;
}
exports.SignUpDto = SignUpDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'John Doe',
        description: 'Full name of the user',
        required: true,
        type: String,
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2, { message: 'Name must be at least 2 characters long' }),
    __metadata("design:type", String)
], SignUpDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'password123',
        description: 'User password (min 6 characters)',
        required: true,
        type: String,
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6, { message: 'Password must be at least 6 characters long' }),
    __metadata("design:type", String)
], SignUpDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 1234567890,
        description: '10-digit contact number',
        required: true,
        type: String,
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1000000000, { message: 'Contact number must be 10 digits' }),
    (0, class_validator_1.Max)(9999999999, { message: 'Contact number must be 10 digits' }),
    __metadata("design:type", Number)
], SignUpDto.prototype, "contactNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '+91',
        description: 'Country calling code (e.g., +91)',
        required: true,
        type: String,
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignUpDto.prototype, "countryCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'user@example.com',
        description: 'Email address',
        required: false,
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'Please provide a valid email address' }),
    __metadata("design:type", String)
], SignUpDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'user',
        description: 'User role',
        required: true,
        enum: ['user', 'driver'],
        type: String,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Role is required' }),
    (0, class_validator_1.IsEnum)(['user', 'driver'], {
        message: 'Role must be either "user" or "driver"'
    }),
    __metadata("design:type", String)
], SignUpDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'https://example.com/profile.jpg',
        description: 'Profile picture URL',
        required: false,
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignUpDto.prototype, "profilePic", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'DL123456789',
        description: 'Driver license number (required for drivers)',
        required: false,
        type: String,
    }),
    (0, class_validator_1.ValidateIf)(o => o.role === 'driver'),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignUpDto.prototype, "driverLicenseNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '2023-01-15',
        description: 'License issue date (required for drivers)',
        required: false,
        type: String,
        format: 'date',
    }),
    (0, class_validator_1.ValidateIf)(o => o.role === 'driver'),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SignUpDto.prototype, "licenseIssueDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '2033-01-15',
        description: 'License expiry date (required for drivers)',
        required: false,
        type: String,
        format: 'date',
    }),
    (0, class_validator_1.ValidateIf)(o => o.role === 'driver'),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SignUpDto.prototype, "licenseExpiryDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'State RTO',
        description: 'Issuing authority (required for drivers)',
        required: false,
        type: String,
    }),
    (0, class_validator_1.ValidateIf)(o => o.role === 'driver'),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignUpDto.prototype, "issuingAuthority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'ABC1234',
        description: 'Vehicle number plate (required for drivers)',
        required: false,
        type: String,
    }),
    (0, class_validator_1.ValidateIf)(o => o.role === 'driver'),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignUpDto.prototype, "vehicleNumberPlate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'car',
        description: 'Vehicle type (required for drivers)',
        enum: ['car', 'bike', 'truck'],
        required: false,
        type: String,
    }),
    (0, class_validator_1.ValidateIf)(o => o.role === 'driver'),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['car', 'bike', 'truck']),
    __metadata("design:type", String)
], SignUpDto.prototype, "vehicleType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Toyota Camry',
        description: 'Vehicle model (required for drivers)',
        required: false,
        type: String,
    }),
    (0, class_validator_1.ValidateIf)(o => o.role === 'driver'),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignUpDto.prototype, "vehicleModel", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)(o => o.role === 'driver'),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ example: [30.7068928, 76.7688704] }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], SignUpDto.prototype, "coordinates", void 0);
//# sourceMappingURL=sign_up.user.dto.js.map