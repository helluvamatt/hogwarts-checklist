import { z } from 'zod';

export const PlayerProfileSchema = z.object({
  version: z.literal(2), // For import/export versioning
  playerName: z.string(),
  playerHouse: z.enum(['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin']),
  profilePicture: z.string().optional(), // Base64 from file input
  completedItems: z.record(z.string(), z.record(z.string(), z.boolean())), // By type ID, collectible item IDs, true if collected, otherwise, false/undefined
  lastUpdated: z.iso.datetime({ offset: true })
});
export type PlayerProfile = z.infer<typeof PlayerProfileSchema>;
