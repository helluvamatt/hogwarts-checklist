import collectibles from '$lib/data/collectibles.json';
import locations from '$lib/data/locations.json';
import { type CollectibleType, CollectibleTypeSchema } from '$lib/models/CollectibleType';
import { type Location, LocationSchema } from '$lib/models/Location';

export function getCollectiblesAsync(): Promise<CollectibleType[]> {
  return Promise.resolve(CollectibleTypeSchema.array().parse(collectibles));
}

export function getLocationsAsync(): Promise<Location[]> {
  return Promise.resolve(LocationSchema.array().parse(locations));
}
