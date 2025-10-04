<script lang="ts">
  import { asset } from '$app/paths';
  import { UserRound } from '@lucide/svelte';
  import type { DeepReadonly, PlayerProfile } from '$lib';
  type PlayerHouse = PlayerProfile['playerHouse'];

  interface Props {
    profile?: DeepReadonly<PlayerProfile>;
    class?: string;
  }

  const {
    class: className,
    profile
  }: Props = $props();

  const houses: Record<PlayerHouse, { gradient: string, crest: string }> = {
    Gryffindor: { gradient: 'from-gryffindor-base to-gryffindor-accent', crest: asset('/gryffindor.png') },
    Hufflepuff: { gradient: 'from-hufflepuff-base to-hufflepuff-accent', crest: asset('/hufflepuff.png') },
    Ravenclaw: { gradient: 'from-ravenclaw-base to-ravenclaw-accent', crest: asset('/ravenclaw.png') },
    Slytherin: { gradient: 'from-slytherin-base to-slytherin-accent', crest: asset('/slytherin.png') }
  };
</script>

{#if profile}
  <div class="bg-gradient-to-br {houses[profile.playerHouse].gradient} text-white shadow-lg rounded-box {className}">
    <div class="card-body p-4">
      <div class="flex flex-col items-center text-center gap-3">
        <!-- Profile Picture or House Crest -->
        <div class="avatar">
          <div class="w-56 h-56 rounded ring ring-white/30 ring-offset-1 ring-offset-transparent">
            {#if profile.profilePicture}
              <img src={profile.profilePicture} alt="Profile" />
            {:else}
              <div class="size-full bg-gray-400 flex items-center justify-center opacity-70">
                <UserRound class="size-11/12" />
              </div>
            {/if}
          </div>
        </div>
        <!-- Player Name -->
        <div>
          <h3 class="font-bold">{profile.playerName || 'Player'}</h3>
          <p class="text-sm opacity-90">{profile.playerHouse}</p>
        </div>
        <!-- House Crest -->
        <div class="w-12 h-12">
          <img src={houses[profile.playerHouse].crest} alt="{profile.playerHouse} Crest" class="w-full h-full object-contain" />
        </div>
      </div>
    </div>
  </div>
{:else}
  <div class="flex flex-row items-center gap-2">
    <div class="loading loading-spinner"></div>
    <div>Loading...</div>
  </div>
{/if}
