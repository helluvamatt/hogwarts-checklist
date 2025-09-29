import { PlayerProfileSchema, type PlayerProfile } from './models/PlayerProfile';

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

export function deletePlayerProfile(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  window.localStorage.removeItem(STORAGE_KEY);
  return Promise.resolve();
}
