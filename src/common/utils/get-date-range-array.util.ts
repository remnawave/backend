import dayjs from 'dayjs';

export function getDateRangeArrayUtil(
    start: Date,
    end: Date,
): {
    startDate: Date;
    endDate: Date;
    dates: string[];
} {
    const startDate = dayjs(start).utc().startOf('day');
    const endDate = dayjs(end).utc().startOf('day');
    const days = endDate.diff(startDate, 'day') + 1;

    return {
        startDate: startDate.toDate(),
        endDate: endDate.toDate(),
        dates: Array.from({ length: days }, (_, i) => startDate.add(i, 'day').format('YYYY-MM-DD')),
    };
}
