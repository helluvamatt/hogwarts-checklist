import type { LayoutLoad } from './$types';
import { getCollectiblesAsync, getLocationsAsync } from '$lib';

export const prerender = true;
export const ssr = true;

export const load: LayoutLoad = async () => {
  const collectibles = await getCollectiblesAsync();
  const locations = await getLocationsAsync();
  return { collectibles, locations };
};
