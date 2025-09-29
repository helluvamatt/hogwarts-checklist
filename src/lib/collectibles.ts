import collectibles from '$lib/data/collectibles.json';
import { type CollectibleType, CollectibleTypeSchema } from '$lib/models/CollectibleType';

export function getCollectiblesAsync(): Promise<CollectibleType[]> {
  return Promise.resolve(CollectibleTypeSchema.array().parse(collectibles));
}
