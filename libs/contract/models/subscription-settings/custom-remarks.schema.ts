import z from 'zod';

export const CustomRemarksSchema = z.object({
    expiredUsers: z.array(z.string()).min(1),
    limitedUsers: z.array(z.string()).min(1),
    disabledUsers: z.array(z.string()).min(1),
    emptyHosts: z.array(z.string()).min(1),
    HWIDMaxDevicesExceeded: z.array(z.string()).min(1),
    HWIDNotSupported: z.array(z.string()).min(1),
});

export type TCustomRemarks = z.infer<typeof CustomRemarksSchema>;
