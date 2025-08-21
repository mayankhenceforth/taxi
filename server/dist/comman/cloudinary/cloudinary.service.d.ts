import { ConfigService } from '@nestjs/config';
import { UploadApiResponse } from "cloudinary";
export declare class CloudinaryService {
    private configService;
    constructor(configService: ConfigService);
    uploadFile(file: any): Promise<UploadApiResponse | undefined>;
    deleteFile(publicId: string): Promise<any>;
}
