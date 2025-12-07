import ms from 'enhanced-ms';

export function formatExecutionTime(startTime: number): string {
    return (
        ms(performance.now() - startTime, {
            extends: 'short',
            includeMs: true,
        }) || '0ms'
    );
}

export function getTime(): number {
    return performance.now();
}
