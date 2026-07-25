export interface INodeRequestOpts {
    label: string;
    opts: INodeConnectionOpts;
    path: string;
    data?: unknown;
    compress?: boolean;
    handle500?: boolean;
    internalError?: boolean;
    logAxiosError?: boolean;
    method?: 'get' | 'post';
    timeout?: number;
}

export interface INodeConnectionOpts {
    address: string;
    port: number | null;
    proxyUrl: string | null;
}

export interface IMtlsOptions {
    ca: string;
    cert: string;
    key: string;
}
