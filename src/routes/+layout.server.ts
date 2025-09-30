import type { LayoutServerLoad } from './$types';
import { getCollectiblesAsync, getLocationsAsync } from '$lib';

export const load: LayoutServerLoad = async () => {
  const collectibles = await getCollectiblesAsync();
  const locations = await getLocationsAsync();
  return { collectibles, locations };
};
