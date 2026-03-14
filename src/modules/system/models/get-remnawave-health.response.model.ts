import { RuntimeMetric } from '@common/runtime-metrics/interfaces';

export class GetRemnawaveHealthResponseModel {
    runtimeMetrics: RuntimeMetric[];

    constructor(data: RuntimeMetric[]) {
        this.runtimeMetrics = data;
    }
}
