import type { PlayerProfile } from '$lib/models/PlayerProfile';
import { getPlayerProfile, setPlayerProfile } from '$lib/player-profile';
import { getContext, hasContext, onMount, setContext } from 'svelte';

type PlayerState = { profile: Readonly<PlayerProfile> | undefined };

export function providePlayerState() {
  if (hasContext('playerProfile')) return;

  const state = $state.raw<PlayerState>({ profile: undefined });

  $effect(() => {
    if (!state.profile) return;
    setPlayerProfile(state.profile).catch(); // TODO Handle error
  });

  setContext('playerProfile', state);
  onMount(async () => {
    state.profile = await getPlayerProfile();
  });
  return state;
}

export function usePlayerState(): PlayerState {
  return getContext<PlayerState>('playerProfile');
}
