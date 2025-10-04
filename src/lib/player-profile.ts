import { PlayerProfileSchema, type PlayerProfile, type ImportPlayerProfile, type CollectibleType } from './models';

const STORAGE_KEY = 'playerProfile';

export function getPlayerProfile(): Promise<PlayerProfile | undefined> {
  if (typeof window === 'undefined') return Promise.resolve(undefined);

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return Promise.resolve(undefined);

    const parsed = JSON.parse(stored);
    return Promise.resolve(PlayerProfileSchema.parse(parsed));
  } catch (error) {
    console.error('Failed to load player profile from localStorage:', error);
    return Promise.resolve(undefined);
  }
}

export function setPlayerProfile(profile: PlayerProfile): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Failed to save player profile to localStorage:', error);
  }
  return Promise.resolve();
}

export function migratePlayerProfile(imported: ImportPlayerProfile, collectibles: CollectibleType[]): PlayerProfile {
  if (imported.version === 2) return imported;

  if (imported.version === 1) {
    console.log('Migrating version 1 profile to version 2...', imported);
    const migrated: PlayerProfile = {
      ...imported,
      version: 2,
      completedItems: collectibles.reduce<Record<string, Record<string, boolean>>>((agg, type) => {
        agg[type.id] = type.items.reduce<Record<string, boolean>>((typeAgg, item) => {
          if (imported.completedItems[item.id]) typeAgg[item.id] = true;
          return typeAgg;
        }, {});
        return agg;
      }, {}),
    }
    console.log('Migrated version 1 profile to version 2:', migrated);
    return migrated;
  }

  throw new Error('Invalid profile version.');
}
