export function toNonEmptyRecord(value: object | null | undefined): Record<string, unknown> | null {
    if (value == null) return null;
    return Object.keys(value).length > 0 ? (value as Record<string, unknown>) : null;
}
