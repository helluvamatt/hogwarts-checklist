import type { DeepReadonly } from '$lib/models/DeepReadonly';
import type { PlayerProfile } from '$lib/models/PlayerProfile';
import { getPlayerProfile, setPlayerProfile } from '$lib/player-profile';
import { getContext, hasContext, onMount, setContext } from 'svelte';
import { SvelteDate } from 'svelte/reactivity';

interface PlayerState {
  readonly loading: boolean;
  readonly profile: DeepReadonly<PlayerProfile>;
  setPlayerProfile(value: PlayerProfile): Promise<void>;
}

const CONTEXT_KEY = 'playerState';

export function providePlayerState(): PlayerState {
  if (hasContext(CONTEXT_KEY)) return getContext<PlayerState>(CONTEXT_KEY);

  let loading = $state<boolean>(true);
  const now = new SvelteDate().toISOString();
  let profile = $state.raw<PlayerProfile>({
    version: 1,
    playerName: '',
    playerHouse: 'Gryffindor',
    completedItems: {},
    lastUpdated: now,
  });

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
    }
  }

  setContext(CONTEXT_KEY, state);
  onMount(async () => {
    const read = await getPlayerProfile();
    if (read) profile = read;
    loading = false;
  });
  return state;
}

export function usePlayerState(): PlayerState {
  if (!hasContext(CONTEXT_KEY)) throw new Error('Player state context is missing. You must call providePlayerState() in a parent component.');
  return getContext<PlayerState>(CONTEXT_KEY);
}
