import type { LayoutServerLoad } from './$types';
import { getCollectiblesAsync } from '$lib/collectibles';

export const load: LayoutServerLoad = async () => {
  const collectibles = await getCollectiblesAsync();
  return { collectibles };
};
