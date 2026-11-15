export const MAX_HEADER_LENGTH = 512;

export function truncateHeader(value: string | string[] | undefined): string | undefined {
    const header = Array.isArray(value) ? value[0] : value;

    return header?.slice(0, MAX_HEADER_LENGTH);
}
