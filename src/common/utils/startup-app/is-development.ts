export function isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
}

export function isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
}

/**
 * Checks if current instance is REST API
 * @returns {boolean} True if instance type is 'api'
 */
export function isRestApi(): boolean {
    return process.env.INSTANCE_TYPE === 'api';
}

/**
 * Checks if current instance is Scheduler
 * @returns {boolean} True if instance type is 'scheduler'
 */
export function isScheduler(): boolean {
    return process.env.INSTANCE_TYPE === 'scheduler';
}

/**
 * Checks if current instance is Processor
 * @returns {boolean} True if instance type is 'processor'
 */
export function isProcessor(): boolean {
    return process.env.INSTANCE_TYPE === 'processor';
}

/**
 * Determines if queue services should be enabled
 * @returns {boolean} True if instance is either Scheduler or REST API
 */
export function useQueueServices(): boolean {
    return isScheduler() || isRestApi();
}

/**
 * Determines if queue processor should be enabled
 * @returns {boolean} True if instance is Processor
 */
export function useQueueProcessor(): boolean {
    return isProcessor();
}

/**
 * Determines if Bull Board dashboard should be enabled
 * @returns {boolean} True if instance is REST API
 */
export function useBullBoard(): boolean {
    return isRestApi();
}

/**
 * Determines if frontend should be disabled
 * @returns {boolean} True if frontend should be disabled
 */
export function disableFrontend(): boolean {
    return process.env.DISABLE_FRONTEND === 'true';
}

export function isDebugLogsEnabled(): boolean {
    return process.env.ENABLE_DEBUG_LOGS === 'true';
}

export function isDevOrDebugLogsEnabled(): boolean {
    if (isDevelopment()) {
        return true;
    }

    if (isDebugLogsEnabled()) {
        return true;
    }

    return false;
}
