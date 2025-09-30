import { z } from 'zod';

export const SublocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().optional() // URL
});

export type Sublocation = z.infer<typeof SublocationSchema>;
