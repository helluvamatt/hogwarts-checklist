import { z } from 'zod';
import { PlayerHouseSchema } from './PlayerHouse';

export const PlayerInformationSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty'),
  house: PlayerHouseSchema,
  profilePicture: z.string().optional() // Base64 from file input
});
export type PlayerInformation = z.infer<typeof PlayerInformationSchema>;
