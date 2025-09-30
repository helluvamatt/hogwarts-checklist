<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { activeId } from '$lib';
  import type { CollectibleType } from '$lib';

  interface Props {
    collectibles: CollectibleType[]
  }
  let { collectibles }: Props = $props();
</script>

<ul class="menu w-full p-2 lg:p-4">
  <li class="menu-title">Player</li>
  <li><a href={resolve('/')} class:menu-active={page.route.id === '/'}>Summary</a></li>
  <li><a href={resolve('/profile')} class:menu-active={page.route.id === '/profile'}>Profile</a></li>
  <li class="menu-title">Collectibles</li>
  {#each collectibles as type (type.id)}
    <li>
      <a href="{resolve('/')}#{type.id}" class="flex flex-row items-center gap-2" class:menu-active={activeId.current === type.id}>
        {#if type.icon}
          <div aria-label={type.name} class="mask size-4 bg-base-content" style={`mask-image: url('${type.icon}')`}></div>
        {/if}
        <div>{type.name}</div>
      </a>
    </li>
  {/each}
</ul>
