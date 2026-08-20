export const DEFAULT_TEMPLATE_MIHOMO = `mixed-port: 7890
socks-port: 7891
redir-port: 7892
allow-lan: true
mode: global
log-level: info
external-controller: 127.0.0.1:9090
dns:
  enable: true
  use-hosts: true
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  default-nameserver:
    - 1.1.1.1
    - 8.8.8.8
  nameserver:
    - 1.1.1.1
    - 8.8.8.8
  fake-ip-filter:
    - '*.lan'
    - stun.*.*.*
    - stun.*.*
    - time.windows.com
    - time.nist.gov
    - time.apple.com
    - time.asia.apple.com
    - '*.openwrt.pool.ntp.org'
    - pool.ntp.org
    - ntp.ubuntu.com
    - time1.apple.com
    - time2.apple.com
    - time3.apple.com
    - time4.apple.com
    - time5.apple.com
    - time6.apple.com
    - time7.apple.com
    - time1.google.com
    - time2.google.com
    - time3.google.com
    - time4.google.com
    - api.joox.com
    - joox.com
    - '*.xiami.com'
    - '*.msftconnecttest.com'
    - '*.msftncsi.com'
    - '+.xboxlive.com'
    - '*.*.stun.playstation.net'
    - xbox.*.*.microsoft.com
    - '*.ipv6.microsoft.com'
    - speedtest.cros.wr.pvp.net

proxies: # LEAVE THIS LINE!

proxy-groups:
  - name: '→ Remnawave'
    type: 'select'
    proxies: # LEAVE THIS LINE!

rules:
  - MATCH,→ Remnawave
`;

export const DEFAULT_TEMPLATE_STASH = `proxy-groups:
  - name: → Remnawave
    type: select
    proxies: # LEAVE THIS LINE!

proxies: # LEAVE THIS LINE!

rules:
  - SCRIPT,quic,REJECT
  - DOMAIN-SUFFIX,iphone-ld.apple.com,DIRECT
  - DOMAIN-SUFFIX,lcdn-locator.apple.com,DIRECT
  - DOMAIN-SUFFIX,lcdn-registration.apple.com,DIRECT
  - DOMAIN-SUFFIX,push.apple.com,DIRECT
  - PROCESS-NAME,v2ray,DIRECT
  - PROCESS-NAME,Surge,DIRECT
  - PROCESS-NAME,ss-local,DIRECT
  - PROCESS-NAME,privoxy,DIRECT
  - PROCESS-NAME,trojan,DIRECT
  - PROCESS-NAME,trojan-go,DIRECT
  - PROCESS-NAME,naive,DIRECT
  - PROCESS-NAME,CloudflareWARP,DIRECT
  - PROCESS-NAME,Cloudflare WARP,DIRECT
  - IP-CIDR,162.159.193.0/24,DIRECT,no-resolve
  - PROCESS-NAME,p4pclient,DIRECT
  - PROCESS-NAME,Thunder,DIRECT
  - PROCESS-NAME,DownloadService,DIRECT
  - PROCESS-NAME,qbittorrent,DIRECT
  - PROCESS-NAME,Transmission,DIRECT
  - PROCESS-NAME,fdm,DIRECT
  - PROCESS-NAME,aria2c,DIRECT
  - PROCESS-NAME,Folx,DIRECT
  - PROCESS-NAME,NetTransport,DIRECT
  - PROCESS-NAME,uTorrent,DIRECT
  - PROCESS-NAME,WebTorrent,DIRECT
  - GEOIP,LAN,DIRECT
  - MATCH,→ Remnawave
script:
  shortcuts:
    quic: network == 'udp' and dst_port == 443
dns:
  default-nameserver:
    - 1.1.1.1
    - 1.0.0.1
  nameserver:
    - 1.1.1.1
    - 1.0.0.1
log-level: warning
mode: rule

`;

export const DEFAULT_TEMPLATE_CLASH = `mixed-port: 7890
socks-port: 7891
redir-port: 7892
allow-lan: true
mode: global
log-level: info
external-controller: 127.0.0.1:9090
dns:
  enable: true
  use-hosts: true
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  default-nameserver:
    - 1.1.1.1
    - 8.8.8.8
  nameserver:
    - 1.1.1.1
    - 8.8.8.8
  fake-ip-filter:
    - '*.lan'
    - stun.*.*.*
    - stun.*.*
    - time.windows.com
    - time.nist.gov
    - time.apple.com
    - time.asia.apple.com
    - '*.openwrt.pool.ntp.org'
    - pool.ntp.org
    - ntp.ubuntu.com
    - time1.apple.com
    - time2.apple.com
    - time3.apple.com
    - time4.apple.com
    - time5.apple.com
    - time6.apple.com
    - time7.apple.com
    - time1.google.com
    - time2.google.com
    - time3.google.com
    - time4.google.com
    - api.joox.com
    - joox.com
    - '*.xiami.com'
    - '*.msftconnecttest.com'
    - '*.msftncsi.com'
    - '+.xboxlive.com'
    - '*.*.stun.playstation.net'
    - xbox.*.*.microsoft.com
    - '*.ipv6.microsoft.com'
    - speedtest.cros.wr.pvp.net

proxies: # LEAVE THIS LINE!

proxy-groups:
  - name: '→ Remnawave'
    type: 'select'
    proxies: # LEAVE THIS LINE!

rules:
  - MATCH,→ Remnawave`;

export const DEFAULT_TEMPLATE_SINGBOX = {
    dns: {
        rules: [
            {
                server: 'remote',
                query_type: ['A', 'AAAA'],
            },
        ],
        servers: [
            {
                tag: 'cf-dns',
                type: 'tls',
                server: '1.1.1.1',
            },
            {
                tag: 'local',
                type: 'udp',
                server: '1.1.1.1',
            },
            {
                tag: 'remote',
                type: 'fakeip',
                inet4_range: '198.18.0.0/15',
                inet6_range: 'fc00::/18',
            },
        ],
        independent_cache: true,
    },
    log: {
        level: 'debug',
        disabled: true,
        timestamp: true,
    },
    route: {
        rules: [
            {
                action: 'sniff',
            },
            {
                action: 'hijack-dns',
                protocol: 'dns',
            },
            {
                outbound: 'direct',
                ip_is_private: true,
            },
        ],
        auto_detect_interface: true,
        default_domain_resolver: 'local',
    },
    inbounds: [
        {
            mtu: 9000,
            tag: 'tun-in',
            type: 'tun',
            stack: 'mixed',
            address: ['172.19.0.1/30', 'fdfe:dcba:9876::1/126'],
            platform: {
                http_proxy: {
                    server: '127.0.0.1',
                    enabled: true,
                    server_port: 2412,
                },
            },
            auto_route: true,
            strict_route: true,
            interface_name: 'tun125',
            endpoint_independent_nat: true,
        },
        {
            tag: 'mixed-in',
            type: 'mixed',
            users: [],
            listen: '127.0.0.1',
            listen_port: 2412,
            set_system_proxy: false,
        },
    ],
    outbounds: [
        {
            tag: '→ Remnawave',
            type: 'selector',
            outbounds: null,
            interrupt_exist_connections: true,
        },
        {
            tag: 'direct',
            type: 'direct',
        },
    ],
    experimental: {
        clash_api: {
            external_ui: 'yacd',
            default_mode: 'rule',
            external_controller: '127.0.0.1:9090',
            external_ui_download_url: 'https://github.com/MetaCubeX/Yacd-meta/archive/gh-pages.zip',
            external_ui_download_detour: 'direct',
        },
        cache_file: {
            path: 'remnawave.db',
            enabled: true,
            cache_id: 'remnawave',
            store_fakeip: true,
        },
    },
};

export const DEFAULT_TEMPLATE_XRAY_JSON = {
    dns: {
        servers: ['1.1.1.1', '1.0.0.1'],
        queryStrategy: 'UseIP',
    },
    routing: {
        rules: [
            {
                type: 'field',
                protocol: ['bittorrent'],
                outboundTag: 'direct',
            },
        ],
        domainMatcher: 'hybrid',
        domainStrategy: 'IPIfNonMatch',
    },
    inbounds: [
        {
            tag: 'socks',
            port: 10808,
            listen: '127.0.0.1',
            protocol: 'socks',
            settings: {
                udp: true,
                auth: 'noauth',
            },
            sniffing: {
                enabled: true,
                routeOnly: false,
                destOverride: ['http', 'tls', 'quic'],
            },
        },
        {
            tag: 'http',
            port: 10809,
            listen: '127.0.0.1',
            protocol: 'http',
            settings: {
                allowTransparent: false,
            },
            sniffing: {
                enabled: true,
                routeOnly: false,
                destOverride: ['http', 'tls', 'quic'],
            },
        },
    ],
    outbounds: [
        {
            tag: 'direct',
            protocol: 'freedom',
        },
        {
            tag: 'block',
            protocol: 'blackhole',
        },
    ],
};
