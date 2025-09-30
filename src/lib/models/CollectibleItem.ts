import { z } from 'zod';

export const CollectibleItemSchema = z.object({
  id: z.string(),
  subtypeId: z.string().optional(),
  locationId: z.string().optional(),
  sublocationId: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  internalGameId: z.string().optional() // For future savegame import feature
});

export type CollectibleItem = z.infer<typeof CollectibleItemSchema>;
