import { createZodDto } from 'nestjs-zod';

import {
    RemnawaveWebhookCrmEvents,
    RemnawaveWebhookErrorsEvents,
    RemnawaveWebhookNodeEvents,
    RemnawaveWebhookServiceEvents,
    RemnawaveWebhookUserEvents,
    RemnawaveWebhookUserHwidDevicesEvents,
    RemnawaveWebhookTorrentBlockerEvents,
} from '@libs/contracts/models';

export class RemnawaveWebhookUserEventsDto extends createZodDto(RemnawaveWebhookUserEvents) {}
export class RemnawaveWebhookUserHwidDevicesEventsDto extends createZodDto(
    RemnawaveWebhookUserHwidDevicesEvents,
) {}
export class RemnawaveWebhookNodeEventsDto extends createZodDto(RemnawaveWebhookNodeEvents) {}
export class RemnawaveWebhookServiceEventsDto extends createZodDto(RemnawaveWebhookServiceEvents) {}
export class RemnawaveWebhookErrorsEventsDto extends createZodDto(RemnawaveWebhookErrorsEvents) {}
export class RemnawaveWebhookCrmEventsDto extends createZodDto(RemnawaveWebhookCrmEvents) {}
export class RemnawaveWebhookTorrentBlockerEventsDto extends createZodDto(
    RemnawaveWebhookTorrentBlockerEvents,
) {}
