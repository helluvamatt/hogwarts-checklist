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
</script>

{#snippet groupItems()}
  <div class="divider {dividerClass}">
    {#if group.icon}
      <div aria-label={group.name} class="mask size-16 bg-base-content" style={`mask-image: url('${group.icon}')`}></div>
    {/if}
    {#if group.name}
      <h2>{group.name}</h2>
    {/if}
  </div>
  {#if group.description}
    <div class="prose mb-6 lg:mb-8">{@html marked(group.description)}</div>
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
      {@render groupItems()}
      {#if !isObservable(currentPath)}
        {@render groupSubgroups(currentPath)}
      {/if}
    </section>
    {#if isObservable(currentPath)}
      {@render groupSubgroups(currentPath)}
    {/if}
  {:else}
    {@render groupItems()}
    {@render groupSubgroups(currentPath)}
  {/if}
{/if}
