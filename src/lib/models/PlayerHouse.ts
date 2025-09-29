import { z } from 'zod';

export const PlayerHouseSchema = z.enum(['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin']);
export type PlayerHouse = z.infer<typeof PlayerHouseSchema>;
