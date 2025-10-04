<script lang="ts">
  import { resolve } from '$app/paths';
  import { ChevronRight } from '@lucide/svelte';

  const { data } = $props();
  const { collectibles } = data;
</script>

<main class="flex-1 container mx-auto my-4">
  <h1 class="mb-2 lg:mb-4">Collectibles</h1>
  <div class="list space-y-2 lg:space-y-4">
    {#each collectibles as type (type.id)}
      <a href={resolve('/collectibles/[typeId]', { typeId: type.id })} class="list-row bg-base-200 transition-colors hover:bg-base-300">
        <div>
          {#if type.icon}
            <div aria-label={type.name} class="mask size-8 bg-base-content" style={`mask-image: url('${type.icon}')`}></div>
          {/if}
        </div>
        <h2>{type.name}</h2>
        {#if type.description}
          <p class="list-col-wrap text-xs text-base-content/70">{type.description}</p>
        {/if}
        <div class="badge badge-primary">{type.items.length} items</div>
        <ChevronRight class="size-4 text-base-content/50" />
      </a>
    {/each}
  </div>
</main>
