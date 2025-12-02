import dayjs from 'dayjs';

export function getCalendarMonthRanges(timezone: string): [[Date, Date], [Date, Date]] {
    const now = dayjs().tz(timezone);

    const currentEnd = now.endOf('day');
    const currentStart = now.startOf('month');

    const previousMonth = now.subtract(1, 'month');
    const previousStart = previousMonth.startOf('month');
    const previousEnd = previousMonth.endOf('month');

    return [
        [previousStart.utc().toDate(), previousEnd.utc().toDate()],
        [currentStart.utc().toDate(), currentEnd.utc().toDate()],
    ];
}

export function getCalendarYearRanges(timezone: string): [[Date, Date], [Date, Date]] {
    const now = dayjs().tz(timezone);

    const currentEnd = now.endOf('day');
    const currentStart = now.startOf('year');

    const previousYear = now.subtract(1, 'year');
    const previousStart = previousYear.startOf('year');
    const previousEnd = previousYear.endOf('year');

    return [
        [previousStart.utc().toDate(), previousEnd.utc().toDate()],
        [currentStart.utc().toDate(), currentEnd.utc().toDate()],
    ];
}

export function getDateRange(timezone: string, substractDays: number = 0): [Date, Date] {
    const now = dayjs().tz(timezone);
    const start = now.startOf('day').subtract(substractDays, 'day');
    const end = now.endOf('day').subtract(substractDays, 'day');

    const startUTC = start.utc().toDate();
    const endUTC = end.utc().toDate();
    return [startUTC, endUTC];
}

export function getLast30DaysRanges(timezone: string): [[Date, Date], [Date, Date]] {
    const now = dayjs().tz(timezone);

    const currentEnd = now.endOf('day');
    const currentStart = now.subtract(29, 'days').startOf('day');

    const previousEnd = currentStart.subtract(1, 'day').endOf('day');
    const previousStart = previousEnd.subtract(29, 'days').startOf('day');

    return [
        [previousStart.utc().toDate(), previousEnd.utc().toDate()],
        [currentStart.utc().toDate(), currentEnd.utc().toDate()],
    ];
}

export function getLastTwoWeeksRanges(timezone: string): [[Date, Date], [Date, Date]] {
    const now = dayjs().tz(timezone);

    const currentEnd = now.endOf('day');
    const currentStart = now.subtract(6, 'days').startOf('day');

    const previousEnd = currentStart.subtract(1, 'day').endOf('day');
    const previousStart = previousEnd.subtract(6, 'days').startOf('day');

    return [
        [previousStart.utc().toDate(), previousEnd.utc().toDate()],
        [currentStart.utc().toDate(), currentEnd.utc().toDate()],
    ];
}
