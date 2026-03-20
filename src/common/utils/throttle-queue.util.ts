import { Queue } from 'bullmq';

import { Logger } from '@nestjs/common';

import { sleep } from './sleep';

export async function throttleQueues(
    queues: Queue[],
    logger: Logger,
    maxAttempts = 10,
): Promise<() => Promise<void>> {
    await Promise.all(queues.map((q) => q.pause()));

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const activeCounts = await Promise.all(
            queues.map(async (q) => ({ name: q.name, active: await q.getActiveCount() })),
        );

        const busy = activeCounts.filter((q) => q.active > 0);

        if (busy.length === 0) break;

        for (const q of busy) {
            logger.log(
                `${q.name} has ${q.active} active workers (attempt ${attempt + 1}/${maxAttempts})`,
            );
        }

        await sleep(1_400);
    }

    const remaining = await Promise.all(
        queues.map(async (q) => ({ name: q.name, active: await q.getActiveCount() })),
    );
    for (const q of remaining.filter((q) => q.active > 0)) {
        logger.warn(
            `${q.name} still has ${q.active} active workers after ${maxAttempts} attempts.`,
        );
    }

    return async () => {
        await Promise.all(
            queues.map((q) => {
                logger.log(`Resuming ${q.name} queue after throttling.`);
                return q.resume();
            }),
        );
    };
}
