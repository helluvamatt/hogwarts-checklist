<script module lang="ts">
  import type { ResolvedCollectibleItem } from '$lib';
  import ItemGroup from './ItemGroup.svelte';
  import ItemList from './ItemList.svelte';

  export type SortGroup = { id: string, name?: string, description?: string, icon?: string, items: ResolvedCollectibleItem[], showIfEmpty?: boolean };
  export type SortGroupWithSubgroups = SortGroup & { subgroups?: SortGroupWithSubgroups[], hasItems?: boolean };
</script>

<script lang="ts">
import { marked } from 'marked';

interface Props {
  group: SortGroupWithSubgroups;
  level?: number;
  hideTags?: boolean;
}

const dividerVariants = ['divider-primary', 'divider-secondary', 'divider-accent', 'divider-neutral', 'divider-default'];

let { group, level = 0, hideTags}: Props = $props();
let dividerClass = dividerVariants[level % dividerVariants.length];
</script>

{#if group.hasItems || group.showIfEmpty}
  <div class="divider {dividerClass}">
    {#if group.icon}
      <div aria-label={group.name} class="mask size-16 bg-base-content" style={`mask-image: url('${group.icon}')`}></div>
    {/if}
    {#if group.name}
      <h2>{group.name}</h2>
    {/if}
  </div>
  {#if group.description}
    <div class="text-base-content/50">{@html marked(group.description)}</div>
  {/if}
  {#if !group.hasItems}
    <p class="text-base-content/50 italic">No items here.</p>
  {/if}
  {#if group.items.length > 0}
    <ItemList items={group.items} {hideTags} hideType />
  {/if}
  {#if group.subgroups && group.subgroups.length > 0}
    {#each group.subgroups as subgroup (subgroup.id)}
      <ItemGroup group={subgroup} level={level + 1} {hideTags} />
    {/each}
  {/if}
{/if}
