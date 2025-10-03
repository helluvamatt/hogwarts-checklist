<script lang="ts">
  import TagBadge from '$lib/components/TagBadge.svelte';
  import { type ResolvedCollectibleItem, usePlayerState } from '$lib';

  interface Props {
    items: ResolvedCollectibleItem[];
    hideTags?: boolean;
    hideType?: boolean;
    hideSubtype?: boolean;
    hideLocation?: boolean;
    hideSublocation?: boolean;
  }
  const { items, hideTags, hideType, hideSubtype, hideLocation, hideSublocation }: Props = $props();
  const playerState = usePlayerState();

  function isItemCollected(itemId: string): boolean {
    return playerState.profile?.completedItems?.[itemId] === true;
  }

  function toggleItemCollection(itemId: string, checked: boolean) {
    playerState.setPlayerProfile({
      ...playerState.profile,
      completedItems: {
        ...playerState.profile.completedItems,
        [itemId]: checked
      },
      lastUpdated: new Date().toISOString()
    });
  }
</script>

<div class="list space-y-2 lg:space-y-4">
  {#each items as item (item.id)}
    <label class="list-row bg-base-200 hover:bg-base-300 rounded-box shadow-md">
      <input type="checkbox" checked={isItemCollected(item.id)} onchange={(e) => toggleItemCollection(item.id, e.currentTarget.checked)} class="checkbox checkbox-primary checkbox-lg" />
      <h5>{item.name}</h5>
      <div class="list-col-wrap">
        {#if item.description}
          <p class="text-xs">{item.description}</p>
        {/if}
      </div>
      {#if !hideTags}
        <div class="flex flex-col lg:flex-row gap-2">
          {#if item.type && !hideType}
            <TagBadge tag={item.type} type="primary" soft />
          {/if}
          {#if item.subtype && !hideSubtype}
            <TagBadge tag={item.subtype} type="primary" soft />
          {/if}
          {#if item.location && !hideLocation}
            <TagBadge tag={item.location} type="accent" soft />
          {/if}
          {#if item.sublocation && !hideSublocation}
            <TagBadge tag={item.sublocation} type="neutral" soft />
          {/if}
        </div>
      {/if}
    </label>
  {/each}
</div>
