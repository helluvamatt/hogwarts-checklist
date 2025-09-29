import { z } from 'zod';

export const CollectibleSubtypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  icon: z.string().optional() // URL
});

export type CollectibleSubtype = z.infer<typeof CollectibleSubtypeSchema>;
