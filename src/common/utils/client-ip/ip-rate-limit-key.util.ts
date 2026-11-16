import ipaddr from 'ipaddr.js';

export function getIpRateLimitKey(ip: string): string {
    if (!ipaddr.isValid(ip)) return ip;

    const address = ipaddr.process(ip);

    if (address.kind() === 'ipv4') return address.toString();

    return `${ipaddr.IPv6.networkAddressFromCIDR(`${address.toString()}/64`).toString()}/64`;
}
