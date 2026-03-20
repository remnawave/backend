/** Host override → inbound default → null */
export function override<T>(
    hostValue: T | null | undefined,
    inboundValue: T | null | undefined,
): T | null {
    return (hostValue || inboundValue) ?? null;
}
