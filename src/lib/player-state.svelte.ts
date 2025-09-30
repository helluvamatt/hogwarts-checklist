import type { PlayerProfile } from '$lib/models/PlayerProfile';
import { deletePlayerProfile, getPlayerProfile, setPlayerProfile } from '$lib/player-profile';
import { getContext, hasContext, onMount, setContext } from 'svelte';

interface PlayerState {
  readonly loading: boolean;
  readonly profile: Readonly<PlayerProfile> | undefined;
  setPlayerProfile(value: PlayerProfile): Promise<void>;
  deletePlayerProfile(): Promise<void>;
}

export function providePlayerState(): PlayerState {
  if (hasContext('playerProfile')) return getContext<PlayerState>('playerProfile');

  let loading = $state<boolean>(true);
  let profile = $state.raw<PlayerProfile|undefined>(undefined);

  const state: PlayerState = {
    get loading() {
      return loading;
    },
    get profile() {
      return profile;
    },
    async setPlayerProfile(value: PlayerProfile): Promise<void> {
      profile = value;
      await setPlayerProfile(value);
    },
    async deletePlayerProfile(): Promise<void> {
      profile = undefined;
      await deletePlayerProfile();
    }
  }

  setContext('playerProfile', state);
  onMount(async () => {
    profile = await getPlayerProfile();
    loading = false;
  });
  return state;
}

export function usePlayerState(): PlayerState {
  return getContext<PlayerState>('playerProfile');
}
