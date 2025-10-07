<script lang="ts">
  import { marked } from 'marked';
  import type { SortGroupWithSubgroups } from '$lib';
  import ItemGroup from './ItemGroup.svelte';
  import ItemList from './ItemList.svelte';
  import { observable } from './ObservableContainer.svelte';

  interface Props {
    group: SortGroupWithSubgroups;
    path?: string[];
    hideTags?: boolean;
    maxObservable?: number;
  }

  const dividerVariants = ['divider-primary', 'divider-secondary', 'divider-accent', 'divider-neutral', 'divider-default'];

  let { group, path, hideTags, maxObservable}: Props = $props();
  let dividerClass = dividerVariants[(path?.length ?? 0) % dividerVariants.length];

  function isObservable(p?: string[]) {
    return maxObservable === undefined || (p?.length ?? 0) < maxObservable;
  }

  function getCompletionBadgeClass(percentage: number): string {
    if (percentage === 100) return 'badge-success';
    if (percentage >= 75) return 'badge-info';
    if (percentage >= 50) return 'badge-warning';
    return 'badge-error';
  }
</script>

{#snippet groupItems(level: number)}
  <div class="divider {dividerClass}">
    {#if group.icon}
      <div aria-label={group.name} class="mask size-16 bg-base-content" style={`mask-image: url('${group.icon}')`}></div>
    {/if}
    {#if level === 1}
      <h2>{group.name}</h2>
    {:else if level === 2}
      <h3>{group.name}</h3>
    {:else if level === 3}
      <h4>{group.name}</h4>
    {:else if level === 4}
      <h5>{group.name}</h5>
    {:else if level === 5}
      <h6>{group.name}</h6>
    {:else}
      <p>{group.name}</p>
    {/if}
    {#if group.playerItemCount !== undefined}
      {@const percentage = group.playerItemCount / group.totalItemCount * 100}
      <div class="hidden lg:block badge {getCompletionBadgeClass(percentage)}">{percentage.toFixed(0)}%</div>
      <div class="hidden lg:block badge badge-secondary">{group.playerItemCount} of {group.totalItemCount} collected</div>
    {:else}
      <div class="hidden lg:block badge badge-secondary">{group.totalItemCount} items</div>
    {/if}
  </div>
  <div class="lg:hidden mb-6">
    {#if group.playerItemCount !== undefined}
      {@const percentage = group.playerItemCount / group.totalItemCount * 100}
      <div class="badge {getCompletionBadgeClass(percentage)}">{percentage.toFixed(0)}%</div>
      <div class="badge badge-secondary">{group.playerItemCount} of {group.totalItemCount} collected</div>
    {:else}
      <div class="badge badge-secondary">{group.totalItemCount} items</div>
    {/if}
  </div>
  {#if group.description}
    <div class="prose mb-6">{@html marked(group.description)}</div>
  {/if}
  {#if !group.hasItems}
    <p class="text-base-content/50 italic">No items here.</p>
  {/if}
  {#if group.items.length > 0}
    <ItemList items={group.items} {hideTags} hideType />
  {/if}
{/snippet}

{#snippet groupSubgroups(currentPath: string[])}
  {#if group.subgroups && group.subgroups.length > 0}
    {#each group.subgroups as subgroup (subgroup.id)}
      <ItemGroup group={subgroup} path={currentPath} {hideTags} {maxObservable} />
    {/each}
  {/if}
{/snippet}

{#if group.hasItems || group.showIfEmpty}
  {@const currentPath = path ? [...path, group.id] : [group.id]}
  {#if isObservable(path)}
    <section id={currentPath.join('/')} use:observable>
      {@render groupItems(currentPath.length)}
      {#if !isObservable(currentPath)}
        {@render groupSubgroups(currentPath)}
      {/if}
    </section>
    {#if isObservable(currentPath)}
      {@render groupSubgroups(currentPath)}
    {/if}
  {:else}
    {@render groupItems(currentPath.length)}
    {@render groupSubgroups(currentPath)}
  {/if}
{/if}
