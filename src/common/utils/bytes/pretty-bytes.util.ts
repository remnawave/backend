import xbytes from 'xbytes';

export function prettyBytesUtil(
    bytesInput: bigint | number | string | undefined,
    sticky: boolean = false,
    prefixIndex?: number,
    returnZero: boolean = false,
): string {
    if (!bytesInput) {
        return returnZero ? '0' : '0';
    }
    if (typeof bytesInput === 'string') {
        bytesInput = Number(bytesInput);
    } else if (typeof bytesInput === 'bigint') {
        bytesInput = Number(bytesInput);
    }

    const res = xbytes.parseBytes(bytesInput, { iec: true, sticky, prefixIndex });

    return String(res.size);
}

export function parseRamToBytes(ram: string | null): number {
    if (!ram) return 0;
    return xbytes.parseSize(ram, { iec: true });
}
