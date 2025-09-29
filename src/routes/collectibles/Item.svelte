<script lang="ts">
  import { Square, SquareCheckBig } from '@lucide/svelte';
  import type { CollectibleItem } from '$lib/models/CollectibleItem';
  import { usePlayerState } from '$lib/player-state.svelte';

  interface Props {
    item: CollectibleItem
  }

  const { item }: Props = $props();
  const playerState = usePlayerState();

  function isItemCollected(itemId: string): boolean {
    return playerState.profile?.completedItems?.[itemId] === true;
  }

  function toggleItemCollection(itemId: string, checked: boolean) {
    if (!playerState.profile) return;

    playerState.profile = {
      ...playerState.profile,
      completedItems: {
        ...playerState.profile.completedItems,
        [itemId]: checked
      },
      lastUpdated: new Date().toISOString()
    };
  }
</script>

<div class="card card-xs sm:card-sm md:card-md lg:card-lg bg-base-200 card-border shadow-sm">
  <div class="card-body">
    <h3 class="card-title">{item.name}</h3>
    {#if item.description}
      <p>{item.description}</p>
    {/if}
    {#if playerState.profile}
      <div class="card-actions">
        <label class="swap cursor-pointer">
          <input type="checkbox" checked={isItemCollected(item.id)} onchange={(e) => toggleItemCollection(item.id, e.currentTarget.checked)} />
          <span class="swap-on btn btn-primary justify-start" title="Click or tap to mark as not collected"><SquareCheckBig class="size-4" /> Collected</span>
          <span class="swap-off btn btn-secondary justify-start" title="Click or tap to mark as collected"><Square class="size-4" /> Collect</span>
        </label>
      </div>
    {/if}
  </div>
</div>
