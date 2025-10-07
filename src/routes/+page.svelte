<script lang="ts">
  import { resolve } from '$app/paths';
  import { usePlayerState } from '$lib';
  import ProfileCard from '$lib/components/ProfileCard.svelte';

  const { data } = $props();
  const playerState = usePlayerState();

  const collectibles = $derived.by(() => {
    const profile = playerState.profile;
    return data.collectibles.map((type) => {
      const playerItemIds = type.items.filter(i => profile?.completedItems[type.id]?.[i.id]).map(i => i.id);

      // Calculate per-location progress for this type
      const locationProgress = data.locations.map(location => {
        const locationItems = type.items.filter(item => item.locationId === location.id);
        const collectedInLocation = locationItems.filter(item =>
          profile?.completedItems[type.id]?.[item.id]
        ).length;

        return {
          locationId: location.id,
          locationName: location.name,
          total: locationItems.length,
          collected: collectedInLocation,
          percentage: locationItems.length > 0 ? (collectedInLocation / locationItems.length) * 100 : 0
        };
      }).filter(loc => loc.total > 0); // Only include locations that have items of this type

      return {
        ...type,
        playerItemIds,
        locationProgress
      };
    });
  });

  type ProgressEntry = {
    id: string;
    label: string;
    totalItemCount: number;
    playerItemCount: number;
  };
  const progress: ProgressEntry[] = $derived.by(() => {
    let results: ProgressEntry[] = [];
    const profile = playerState.profile;
    const allItems = collectibles.flatMap(group => group.items);
    const allPlayerItemIds = collectibles.flatMap(group => group.playerItemIds);

    // Total Completion
    results.push({
      id: 'all',
      label: 'Total Completion',
      totalItemCount: allItems.length,
      playerItemCount: allPlayerItemIds.length
    });

    // By Location
    const byLocation = collectibles.reduce<ProgressEntry[]>((agg, group) => {
      for (const item of group.items) {
        if (item.locationId) {
          const entry = agg.find(e => e.id === item.locationId);
          if (entry) {
            entry.totalItemCount++;
            if (profile?.completedItems[group.id]?.[item.id]) entry.playerItemCount++;
          }
        }
      }
      return agg;
    }, data.locations.map(l => ({ id: l.id, label: l.name, totalItemCount: 0, playerItemCount: 0 })));
    results = results.concat(byLocation);

    return results;
  });

  function getCompletionTextClass(percentage: number): string {
    if (percentage === 100) return 'text-success';
    if (percentage >= 75) return 'text-info';
    if (percentage >= 50) return 'text-warning';
    return 'text-error';
  }

  function getCompletionBadgeClass(percentage: number): string {
    if (percentage === 100) return 'badge-success';
    if (percentage >= 75) return 'badge-info';
    if (percentage >= 50) return 'badge-warning';
    return 'badge-error';
  }
</script>

<div class="container mx-auto flex-grow flex flex-col lg:flex-row lg:items-start p-4 gap-4 relative">
  <aside class="w-64 mx-auto shrink-0 lg:sticky lg:top-4 lg:left-0 space-y-4">
    <ProfileCard profile={playerState.profile} />
  </aside>
  <main class="flex-grow space-y-4">
    <div class="grid grid-cols-2 md:grid-cols-4 mx-auto gap-4">
      {#each progress as entry(entry.id)}
        {@const percentage = entry.playerItemCount / entry.totalItemCount * 100}
        <div class="stat shadow bg-base-200 rounded-box" style="border: none;">
          <div class="stat-title">{entry.label}</div>
          <div class="stat-value {getCompletionTextClass(percentage)}">{percentage.toFixed(0)}%</div>
          <div class="stat-desc">{entry.playerItemCount} of {entry.totalItemCount} collected</div>
        </div>
      {/each}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              {#if type.playerItemIds !== undefined}
                <div class="badge badge-primary">{type.playerItemIds.length} / {type.items.length} collected</div>
                {@const percentage = (type.playerItemIds.length / type.items.length) * 100}
                <div class="badge {getCompletionBadgeClass(percentage)}">{percentage.toFixed(0)}%</div>
              {:else}
                <div class="badge badge-primary">{type.items.length} items</div>
              {/if}
            </div>
            {#if type.locationProgress && type.locationProgress.length > 0}
              <div class="mt-2 space-y-1">
                <div class="text-xs font-semibold opacity-70">By Location:</div>
                {#each type.locationProgress as location (location.locationId)}
                  <div class="flex items-center justify-between text-xs">
                    <span class="opacity-70">{location.locationName}</span>
                    <div class="flex items-center gap-2">
                      <span class="opacity-50">{location.collected}/{location.total}</span>
                      <span class="badge badge-xs {getCompletionBadgeClass(location.percentage)}">{location.percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </a>
      {/each}
    </div>
  </main>
</div>
