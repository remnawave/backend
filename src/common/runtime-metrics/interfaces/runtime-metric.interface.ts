export interface RuntimeMetric {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
    eventLoopDelayMs: number;
    eventLoopP99Ms: number;
    activeHandles: number;
    uptime: number;
    pid: number;
    timestamp: number;
    instanceId: string;
    instanceType: string;
}
