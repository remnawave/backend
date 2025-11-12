import { GetSumByDtRangeHandler } from './get-sum-by-dt-range/get-sum-by-dt-range.handler';
import { GetSumLifetimeHandler } from './get-sum-lifetime/get-sum-lifetime.handler';
import { Get7DaysStatsHandler } from './get-7days-stats/get-7days-stats.handler';

export const QUERIES = [GetSumByDtRangeHandler, Get7DaysStatsHandler, GetSumLifetimeHandler];
