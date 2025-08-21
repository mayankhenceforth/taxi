import { CreateNewEntryDto } from "./create-admin.dto";
declare const UpdateEntryDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateNewEntryDto>>;
export declare class UpdateEntryDto extends UpdateEntryDto_base {
    readonly _id: string;
}
export {};
