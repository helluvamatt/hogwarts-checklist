import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { CollectibleItem, CollectibleType, Location, ResolvedCollectibleItem, ResolvedCollectibleType } from '$lib';

function resolveItem(item: CollectibleItem, type: CollectibleType, locations: Location[]): ResolvedCollectibleItem {
  const subtype = type.subtypes?.find(st => st.id === item.subtypeId);
  const location = locations.find(loc => loc.id === item.locationId);
  const sublocation = location?.sublocations?.find(sl => sl.id === item.sublocationId);
  return { ...item, type, subtype, location, sublocation };
}

export const load: PageServerLoad = async ({ parent, params }): Promise<{ type: ResolvedCollectibleType }> => {
  const { collectibles, locations } = await parent();
  const { typeId } = params;
  const type = collectibles.find(t => t.id === typeId);
  if (!type) return error(404, { id: typeId, code: '404', message: 'Type not found' });

  return {
    type: {
      ...type,
      items: type.items.map(item => resolveItem(item, type, locations))
    }
  };
};
