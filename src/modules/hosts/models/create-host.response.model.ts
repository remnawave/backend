import { HostsEntity } from '../entities/hosts.entity';

export class CreateHostResponseModel {
    public uuid: string;
    public inboundUuid: string;
    public viewPosition: number;
    public remark: string;
    public address: string;
    public port: number;
    public path: string | null;
    public sni: string | null;
    public host: string | null;
    public alpn: string | null;
    public fingerprint: string | null;
    public allowInsecure: boolean;
    public isDisabled: boolean;

    constructor(data: HostsEntity) {
        this.uuid = data.uuid;
        this.inboundUuid = data.inboundUuid;
        this.viewPosition = data.viewPosition;
        this.remark = data.remark;
        this.address = data.address;
        this.port = data.port;
        this.path = data.path;
        this.sni = data.sni;
        this.host = data.host;
        this.alpn = data.alpn;
        this.fingerprint = data.fingerprint;
        this.allowInsecure = data.allowInsecure;
        this.isDisabled = data.isDisabled;
    }
}