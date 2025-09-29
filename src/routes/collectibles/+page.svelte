<script lang="ts">
  import { ArrowUpToLine } from '@lucide/svelte';
  import CreateProfileAlert from '$lib/components/CreateProfileAlert.svelte';
  import { usePlayerState } from '$lib/player-state.svelte';
  import Item from './Item.svelte';

  const { data } = $props();
  const playerState = usePlayerState();

  const collectibles = $derived.by(() => {
    const profile = playerState.profile;
    return data.collectibles.map((type) => ({
      ...type,
      //items: type.items.map(item => )
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

<svelte:head>
  <title>Collectibles | Hogwarts Checklist</title>
</svelte:head>

{#if !playerState.profile}
  <CreateProfileAlert />
{/if}

<div class="container mx-auto p-2 space-y-2 md:space-y-4 lg:p-4 lg:space-y-6">
  <div class="grid grid-cols-1 gap-2 lg:gap-4 md:grid-cols-2 lg:grid-cols-4">
    {#each collectibles as type (type.id)}
      <a href="#{type.id}" class="card bg-base-200 transition-colors hover:bg-base-300">
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

  {#each collectibles as type (type.id)}
    <div id={type.id} class="space-y-2 lg:space-y-4">
      <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-2">
        <div class="flex flex-row items-center gap-2">
          {#if type.icon}
            <div aria-label={type.name} class="mask size-12 bg-base-content" style={`mask-image: url('${type.icon}')`}></div>
          {/if}
          <h1>{type.name}</h1>
        </div>
        <a href="#top" class="btn btn-sm lg:btn-md" title="Go to top"><ArrowUpToLine class="size-4" />Top</a>
      </div>
      {#if type.description}
        <p class="text-base-content/70">{type.description}</p>
      {/if}
      {#if type.subtypes && type.subtypes.length > 0}
        {#each type.subtypes as subtype (subtype.id)}
          <div class="flex flex-row items-center gap-2">
            {#if subtype.icon}
              <div aria-label={subtype.name} class="mask size-8 bg-base-content" style={`mask-image: url('${subtype.icon}')`}></div>
            {/if}
            <h2>{subtype.name}</h2>
          </div>
          <div class="grid grid-cols-1 mg:grid-cols-2 lg:grid-cols-4 gap-2">
            {#each type.items.filter(item => item.subtype === subtype.id) as item (item.id)}
              <Item {item} />
            {/each}
          </div>
        {/each}
      {:else}
        <div class="grid grid-cols-1 mg:grid-cols-2 lg:grid-cols-4 gap-2">
          {#each type.items as item (item.id)}
            <Item {item} />
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>
