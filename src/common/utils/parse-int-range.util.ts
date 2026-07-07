export interface IntRange {
    from: number | null;
    to: number | null;
}

export function parseIntRangeUtil(value: string | number | undefined): IntRange {
    if (value === undefined || value === '') return { from: null, to: null };

    const [left, right = left] = String(value).split('-', 2);
    const from = parseIntPart(left);
    const to = parseIntPart(right);

    if (from !== null && to !== null && from > to) {
        return { from: to, to: from };
    }

    return { from, to };
}

function parseIntPart(part: string): number | null {
    if (part === '') return null;

    const parsed = Number(part);

    return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}
