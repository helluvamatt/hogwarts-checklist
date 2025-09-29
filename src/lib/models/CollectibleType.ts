import { z } from 'zod';
import { CollectibleSubtypeSchema } from './CollectibleSubtype';
import { CollectibleItemSchema } from './CollectibleItem';

export const CollectibleTypeSchema = CollectibleSubtypeSchema.extend({
  subtypes: z.array(CollectibleSubtypeSchema).optional(),
  items: z.array(CollectibleItemSchema)
});

export type CollectibleType = z.infer<typeof CollectibleTypeSchema>;
