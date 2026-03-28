import { ResetUserTrafficCalendarMonthRollingTask } from './reset-user-traffic-month-rolling';
import { ResetUserTrafficCalendarMonthTask } from './reset-user-traffic-month';
import { ResetUserTrafficCalendarWeekTask } from './reset-user-traffic-week';
import { ResetUserTrafficCalendarDayTask } from './reset-user-traffic-day';

export const RESET_USER_TRAFFIC_TASKS = [
    ResetUserTrafficCalendarMonthTask,
    ResetUserTrafficCalendarWeekTask,
    ResetUserTrafficCalendarDayTask,
    ResetUserTrafficCalendarMonthRollingTask,
];
