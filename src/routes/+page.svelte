<script lang="ts">
  import { resolve } from '$app/paths';
  import { usePlayerState } from '$lib';
  import ProfileCard from '$lib/components/ProfileCard.svelte';

  const { data } = $props();
  const playerState = usePlayerState();

  const collectibles = $derived.by(() => {
    const profile = playerState.profile;
    return data.collectibles.map((type) => ({
      ...type,
      playerItems: profile ? type.items.filter((item) => profile.completedItems[item.id]).map(item => item.id) : undefined
    }));
  });

  function getCompletionBadgeClass(percentage: number): string {
    if (percentage === 100) return 'badge-success';
    if (percentage >= 75) return 'badge-info';
    if (percentage >= 50) return 'badge-warning';
    return 'badge-error';
  }
</script>

<div class="container mx-auto flex-grow flex flex-row items-start p-2 gap-2 lg:p-4 lg:gap-4 relative">
  <aside class="hidden lg:block w-64 shrink-0 sticky top-2 lg:top-4 left-0 space-y-2 lg:space-y-4">
    <ProfileCard profile={playerState.profile} />
  </aside>
  <main class="flex-grow">
    <div class="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      {#each collectibles as type (type.id)}
        <a href={resolve('/collectibles/[typeId]', { typeId: type.id })} class="card card-xs md:card-sm bg-base-200 transition-colors hover:bg-base-300">
          <div class="card-body">
            <div class="flex flex-row">
              {#if type.icon}
                <div aria-label={type.name} class="mr-2 mask size-8 bg-base-content" style={`mask-image: url('${type.icon}')`}></div>
              {/if}
              <h2 class="card-title">{type.name}</h2>
            </div>
            {#if type.description}
              <p>{type.description}</p>
            {/if}
            <div class="flex flex-row flex-wrap gap-2">
              {#if type.playerItems !== undefined}
                <div class="badge badge-primary">{type.playerItems.length} / {type.items.length} collected</div>
                {@const percentage = (type.playerItems.length / type.items.length) * 100}
                <div class="badge {getCompletionBadgeClass(percentage)}">{percentage.toFixed(0)}%</div>
              {:else}
                <div class="badge badge-primary">{type.items.length} items</div>
              {/if}
            </div>
          </div>
        </a>
      {/each}
    </div>
  </main>
</div>
