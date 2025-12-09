export class GetTopUsersByHwidDevicesResponseModel {
    public readonly users: {
        userUuid: string;
        id: number;
        username: string;
        devicesCount: number;
    }[];
    public readonly total: number;

    constructor(data: GetTopUsersByHwidDevicesResponseModel) {
        this.users = data.users;
        this.total = data.total;
    }
}
