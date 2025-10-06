import type { LayoutLoad } from './$types';
import { getCollectiblesAsync, getLocationsAsync } from '$lib';

export const load: LayoutLoad = async () => {
  const collectibles = await getCollectiblesAsync();
  const locations = await getLocationsAsync();
  return { collectibles, locations };
};
