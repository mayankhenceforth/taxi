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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const api_response_1 = require("../../comman/helpers/api-response");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const user_schema_1 = require("../../comman/schema/user.schema");
const mongoose_2 = require("mongoose");
let AdminService = class AdminService {
    userModel;
    configService;
    constructor(userModel, configService) {
        this.userModel = userModel;
        this.configService = configService;
    }
    async seedSuperAdminData() {
        try {
            const contact = this.configService.get('SUPER_ADMIN_CONTACT');
            const password = this.configService.get('SUPER_ADMIN_PASSWORD');
            if (!contact || !password) {
                throw new Error('Super admin credentials not set in environment variables');
            }
            const isAlreadyExisting = await this.userModel.findOne({
                contactNumber: contact,
            });
            if (!isAlreadyExisting) {
                const hashedPassword = await bcrypt.hash(password, 10);
                const superAdmin = new this.userModel({
                    name: 'Super Admin',
                    contactNumber: contact,
                    password: hashedPassword,
                    role: 'super-admin',
                    isContactNumberVerified: true,
                });
                await superAdmin.save();
                console.log('Super admin seeded successfully');
            }
        }
        catch (error) {
            console.error(`Error occurred while seeding the admin data: ${error}`);
        }
    }
    async getUsersDetails(getUsersDto) {
        const { limit = 10, page = 1 } = getUsersDto;
        const users = await this.userModel.paginate({}, {
            page: Number(page),
            limit: Number(limit),
            select: '_id name contactNumber profilePic profilePicPublicId isContactNumberVerified role',
            sort: { name: -1 },
        });
        return new api_response_1.default(true, 'Users data fetched successfully!', common_1.HttpStatus.OK, users?.docs);
    }
    async createNewEntry(createNewEntryDto, role = 'user') {
        const existingUser = await this.userModel.findOne({
            contactNumber: createNewEntryDto.contactNumber,
        });
        if (existingUser) {
            throw new common_1.HttpException('A user already exists with the same contact number!', common_1.HttpStatus.BAD_REQUEST);
        }
        if (createNewEntryDto.password) {
            createNewEntryDto.password = await bcrypt.hash(createNewEntryDto.password, 10);
        }
        const newEntry = new this.userModel({
            ...createNewEntryDto,
            role,
            isContactNumberVerified: true,
        });
        await newEntry.save();
        const roleInSentenceCase = role.charAt(0).toUpperCase() + role.slice(1);
        return new api_response_1.default(true, `${roleInSentenceCase} created successfully!`, common_1.HttpStatus.CREATED, { _id: newEntry._id });
    }
    async deleteEntry(deleteEntryDto, role = 'user') {
        const id = new mongoose_2.Types.ObjectId(deleteEntryDto?._id);
        const existingUser = await this.userModel.findOne({ _id: id, role });
        const roleInSentenceCase = role.charAt(0).toUpperCase() + role.slice(1);
        if (!existingUser) {
            throw new common_1.HttpException(`${roleInSentenceCase} doesn't exist!`, common_1.HttpStatus.BAD_REQUEST);
        }
        await this.userModel.findByIdAndDelete(id);
        return new api_response_1.default(true, `${roleInSentenceCase} deleted successfully!`, common_1.HttpStatus.OK);
    }
    async updateEntry(updateEntryDto, role = 'user') {
        const id = new mongoose_2.Types.ObjectId(updateEntryDto?._id);
        const existingUser = await this.userModel.findOne({ _id: id, role });
        const roleInSentenceCase = role.charAt(0).toUpperCase() + role.slice(1);
        if (!existingUser) {
            throw new common_1.HttpException(`${roleInSentenceCase} doesn't exist!`, common_1.HttpStatus.BAD_REQUEST);
        }
        if (updateEntryDto.password) {
            updateEntryDto.password = await bcrypt.hash(updateEntryDto.password, 10);
        }
        const updatedEntry = await this.userModel
            .findByIdAndUpdate(id, { $set: { ...updateEntryDto } }, { new: true })
            .select('_id name contactNumber profilePic profilePicPublicId isContactNumberVerified role');
        return new api_response_1.default(true, `${roleInSentenceCase} updated successfully!`, common_1.HttpStatus.OK, updatedEntry);
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [Object, config_1.ConfigService])
], AdminService);
//# sourceMappingURL=admin.service.js.map