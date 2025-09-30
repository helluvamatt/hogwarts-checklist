import { z } from 'zod';
import { SublocationSchema } from './Sublocation';

export const LocationSchema = SublocationSchema.extend({
  sublocations: z.array(SublocationSchema).optional(),
});

export type Location = z.infer<typeof LocationSchema>;
