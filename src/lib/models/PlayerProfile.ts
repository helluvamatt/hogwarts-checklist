import { PlayerInformationSchema } from '$lib/models/PlayerInformation';
import { z } from 'zod';

export const PlayerProfileSchema = z.object({
  version: z.literal(0), // For import/export versioning
  player: PlayerInformationSchema,
  completedItems: z.record(z.string(), z.boolean()), // Collectible item IDs, true if collected, otherwise, false/undefined
  lastUpdated: z.iso.datetime({ offset: true })
});
export type PlayerProfile = z.infer<typeof PlayerProfileSchema>;
