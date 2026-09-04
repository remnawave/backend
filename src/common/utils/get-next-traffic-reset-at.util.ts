import dayjs from 'dayjs';

import { RESET_PERIODS, TResetPeriods } from '@libs/contracts/constants';

const RESET_OFFSET_MINUTES = {
    [RESET_PERIODS.DAY]: 5,
    [RESET_PERIODS.MONTH_ROLLING]: 10,
    [RESET_PERIODS.WEEK]: 15,
    [RESET_PERIODS.MONTH]: 20,
} as const;

const MONDAY = 1;

export function getNextTrafficResetAt(
    trafficLimitStrategy: TResetPeriods,
    createdAt: Date,
): Date | null {
    const now = dayjs();

    switch (trafficLimitStrategy) {
        case RESET_PERIODS.NO_RESET:
            return null;

        case RESET_PERIODS.DAY: {
            const next = now.startOf('day').add(RESET_OFFSET_MINUTES.DAY, 'minute');

            return (next.isAfter(now) ? next : next.add(1, 'day')).toDate();
        }

        case RESET_PERIODS.WEEK: {
            const daysUntilMonday = (MONDAY - now.day() + 7) % 7;
            const next = now
                .startOf('day')
                .add(daysUntilMonday, 'day')
                .add(RESET_OFFSET_MINUTES.WEEK, 'minute');

            return (next.isAfter(now) ? next : next.add(7, 'day')).toDate();
        }

        case RESET_PERIODS.MONTH: {
            const next = now.startOf('month').add(RESET_OFFSET_MINUTES.MONTH, 'minute');

            return (next.isAfter(now) ? next : next.add(1, 'month')).toDate();
        }

        case RESET_PERIODS.MONTH_ROLLING: {
            const anchorDay = dayjs(createdAt).date();

            const resetAtIn = (month: dayjs.Dayjs) => {
                const monthStart = month.startOf('month');

                return monthStart
                    .date(Math.min(anchorDay, monthStart.daysInMonth()))
                    .add(RESET_OFFSET_MINUTES.MONTH_ROLLING, 'minute');
            };

            const next = resetAtIn(now);
            const resolved = next.isAfter(now) ? next : resetAtIn(now.add(1, 'month'));
            const firstReset = resetAtIn(dayjs(createdAt).add(1, 'month'));

            return (resolved.isBefore(firstReset) ? firstReset : resolved).toDate();
        }
    }
}
