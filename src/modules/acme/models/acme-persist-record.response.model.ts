/**
 * The persistent authorization record for dns-persist-01: what has to exist in
 * DNS, whether it is already there, and whether the panel can publish it itself
 * (it cannot with MANUAL credentials).
 */
export class AcmePersistRecordResponseModel {
    public name: string;
    public value: string;
    public isPublished: boolean;
    public canPublish: boolean;

    constructor(data: { canPublish: boolean; isPublished: boolean; name: string; value: string }) {
        this.name = data.name;
        this.value = data.value;
        this.isPublished = data.isPublished;
        this.canPublish = data.canPublish;
    }
}

/** What a credential test reports about itself. */
export class AcmeCredentialTestResponseModel {
    public isOk: boolean;
    public message: string;
    public allow: string[];
    public zones: string[];

    constructor(data: { allow: string[]; isOk: boolean; message: string; zones: string[] }) {
        this.isOk = data.isOk;
        this.message = data.message;
        this.allow = data.allow;
        this.zones = data.zones;
    }
}
