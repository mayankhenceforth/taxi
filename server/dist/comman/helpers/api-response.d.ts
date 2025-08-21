export default class ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    statusCode: number;
    constructor(success: boolean, message: string, statusCode: number, data?: T);
}
