export function maskString(str: string | null | undefined, delimiter?: string): string | null {
    if (str === null || str === undefined) {
        return null;
    }

    if (delimiter) {
        const parts = str.split(delimiter);
        const lastIndex = parts.length - 1;
        return parts
            .map((part, index) => (index === lastIndex ? part.replace(/./g, '*') : part))
            .join(delimiter);
    }

    return str
        .split('')
        .map(() => '*')
        .join('');
}
