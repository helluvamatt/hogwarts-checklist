<script lang="ts">
  import { asset } from '$app/paths';
  import { UserRound } from '@lucide/svelte';
  import type { PlayerProfile } from '$lib/models/PlayerProfile';
  import type { PlayerHouse } from '$lib/models/PlayerHouse';

  interface Props {
    profile?: PlayerProfile;
    class?: string;
  }

  const {
    class: className,
    profile
  }: Props = $props();

  const houseColors: Record<PlayerHouse, string> = {
    Gryffindor: 'from-red-600 to-yellow-500',
    Hufflepuff: 'from-yellow-500 to-amber-800',
    Ravenclaw: 'from-blue-600 to-indigo-800',
    Slytherin: 'from-green-600 to-emerald-800'
  };

  const houseGradient = $derived(() => {
    if (!profile) return 'from-gray-700 to-gray-800';
    return houseColors[profile.player.house];
  });
</script>

<div class="bg-gradient-to-br {houseGradient()} text-white shadow-lg rounded-box {className}">
  <div class="card-body p-4">
    <div class="flex flex-col items-center text-center gap-3">
      <!-- Profile Picture or House Crest -->
      <div class="avatar">
        <div class="w-56 h-56 rounded ring ring-white/30 ring-offset-1 ring-offset-transparent">
          {#if profile?.player.profilePicture}
            <img src={profile.player.profilePicture} alt="Profile" />
          {:else}
            <div class="size-full bg-gray-400 flex items-center justify-center opacity-70">
              <UserRound class="size-11/12" />
            </div>
          {/if}
        </div>
      </div>
      {#if profile}
        <!-- Player Name -->
        <div>
          <h3 class="font-bold">{profile.player.name}</h3>
          <p class="text-sm opacity-90">{profile.player.house}</p>
        </div>
        <!-- House Crest -->
        <div class="w-12 h-12">
          <img src={asset(`/${profile.player.house.toLowerCase()}.png`)} alt="{profile.player.house} Crest" class="w-full h-full object-contain" />
        </div>
      {:else}
        <div>
          <h3 class="font-bold">No Profile</h3>
          <p class="text-sm opacity-90">Create a profile to get started!</p>
        </div>
      {/if}
    </div>
  </div>
</div>
