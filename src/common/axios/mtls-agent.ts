import { SocksProxyAgent } from 'socks-proxy-agent';

import { IMtlsOptions } from './axios.interfaces';

type SocksConnectOpts = Parameters<SocksProxyAgent['connect']>[1];

export class MtlsSocksProxyAgent extends SocksProxyAgent {
    constructor(
        uri: string,
        private readonly mtls: IMtlsOptions,
        private readonly sni: string,
    ) {
        super(uri, { keepAlive: true });
    }

    async connect(
        req: Parameters<SocksProxyAgent['connect']>[0],
        opts: SocksConnectOpts,
    ): ReturnType<SocksProxyAgent['connect']> {
        return super.connect(req, {
            ...opts,
            ...this.mtls,
            checkServerIdentity: () => undefined,
            minVersion: 'TLSv1.3',
            rejectUnauthorized: true,
            servername: this.sni,
        } as SocksConnectOpts);
    }
}
