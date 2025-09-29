import { z } from 'zod';

export const CollectibleItemSchema = z.object({
  id: z.string(),
  subtype: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  internalGameId: z.string().optional() // For future savegame import feature
});

export type CollectibleItem = z.infer<typeof CollectibleItemSchema>;
