import dayjs from 'dayjs';

export function getDateRangeArrayUtil(
    start: Date,
    end: Date,
): {
    startDate: Date;
    endDate: Date;
    dates: string[];
} {
    const startDate = dayjs.utc(start).startOf('day');
    const endDate = dayjs.utc(end).endOf('day');
    const days = endDate.diff(startDate, 'day') + 1;

    return {
        startDate: startDate.toDate(),
        endDate: endDate.toDate(),
        dates: Array.from({ length: days }, (_, i) => startDate.add(i, 'day').format('YYYY-MM-DD')),
    };
}
