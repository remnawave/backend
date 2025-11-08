import { z } from 'zod';

export const ExternalSquadResponseHeadersSchema = z.nullable(z.record(z.string(), z.string()));
