import { Queue } from 'bullmq';

import { Logger } from '@nestjs/common';

import { sleep } from './sleep';

/**
 * Throttle a BullMQ queue until there are no active workers
 * or the maximum number of attempts is reached. While throttling,
 * the queue is repeatedly paused, and the active worker count checked.
 *
 * @param {Queue} queue - The BullMQ queue to throttle.
 * @param {Logger} logger - Logger instance to log progress and status.
 * @returns {Promise<() => Promise<void>>} - Returns an async function that, when called, resumes the queue.
 * @throws {Error} If the queue still has active workers after 10 attempts.
 */
export async function throttleQueue(
    queue: Queue,
    logger: Logger,
    maxAttempts = 10,
): Promise<() => Promise<void>> {
    await queue.pause();

    let haveActiveWorkers = await queue.getActiveCount();
    let attempts = 0;

    logger.log(`Paused ${queue.name} queue. ${haveActiveWorkers} active workers.`);

    while (haveActiveWorkers > 0 && attempts < maxAttempts) {
        await sleep(1_400);
        haveActiveWorkers = await queue.getActiveCount();
        attempts++;
    }

    if (haveActiveWorkers > 0) {
        logger.warn(`${queue.name} queue is not empty after ${maxAttempts} attempts.`);
    }

    return async (): Promise<void> => {
        logger.log(`Resuming ${queue.name} queue after throttling.`);
        await queue.resume();
    };
}
