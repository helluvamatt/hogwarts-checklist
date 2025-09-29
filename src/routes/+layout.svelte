<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { resolve, asset } from '$app/paths';
  import { page } from '$app/state';
  import { Menu, X } from '@lucide/svelte';
  import { providePlayerState } from '$lib/player-state.svelte';
  import '../app.css';

  let { children, data } = $props();
  const uid = $props.id();
  let drawerOpen = $state(false);
  const logo = asset('/logo.svg');

  afterNavigate(() => (drawerOpen = false));
  providePlayerState();
</script>

<svelte:head>
  <title>Hogwarts Checklist</title>
  <link rel="icon" href={logo} />
</svelte:head>

<div class="drawer">
  <input id="{uid}-drawer" type="checkbox" bind:checked={drawerOpen} class="drawer-toggle" />
  <div class="drawer-content flex flex-col min-h-screen">
    <div class="navbar w-full bg-base-300 p-0">
      <!-- Mobile hamburger menu (left side on mobile) -->
      <div class="flex-none lg:hidden">
        <label for="{uid}-drawer" aria-label="open sidebar" class="btn btn-square btn-ghost">
          <Menu />
        </label>
      </div>

      <!-- Logo - left aligned on large screens -->
      <div class="mx-2 flex-1 px-2 text-xl lg:hidden">Hogwarts Checklist</div>
      <div class="mx-2 hidden flex-1 px-2 lg:flex">
        <img src={logo} alt="Hogwarts Checklist" class="size-8 max-w-none" />
      </div>

      <!-- Desktop menu items (center on large screens) -->
      <div class="navbar-start hidden lg:flex">
        <ul class="menu menu-horizontal px-1">
          <li><a href={resolve('/')} class:menu-active={page.route.id === '/'}>Summary</a></li>
          <li><a href={resolve('/collectibles')} class:menu-active={page.route.id === '/collectibles'}>Collectibles</a></li>
        </ul>
      </div>

      <!-- Right-aligned items -->
      <div class="navbar-end hidden lg:flex">
        <ul class="menu menu-horizontal px-1">
          <li>
            <a href={resolve('/profile')} class:menu-active={page.route.id === '/profile'}>Profile</a>
          </li>
        </ul>
      </div>
    </div>
    <!-- Page content here -->
    <main class="flex-grow">
      {@render children?.()}
    </main>
    <!-- Footer -->
    <footer class="footer sm:footer-horizontal bg-base-200 items-center justify-center p-4 mt-6">
      <aside>
        <p>Copyright © {new Date().getFullYear()} Matt Schneeberger - All rights reserved</p>
        <p>Hogwarts house crests created by <a href="https://www.deviantart.com/crystallynnblud" class="link-hover text-primary">CrystalLynnblud on DeviantArt</a></p>
      </aside>
    </footer>
  </div>
  <div class="drawer-side">
    <label for="{uid}-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
    <div class="min-h-full w-80 bg-base-200">
      <div class="navbar w-full bg-base-300">
        <!-- Mobile hamburger menu (left side on mobile) -->
        <div class="flex-none lg:hidden">
          <label for="{uid}-drawer" aria-label="open sidebar" class="btn btn-square btn-ghost">
            <X />
          </label>
        </div>

        <!-- Logo - left aligned on large screens -->
        <div class="mx-2 flex-1 px-2 text-xl">Hogwarts Checklist</div>
      </div>
      <ul class="menu p-4">
        <li><a href={resolve('/')} class:menu-active={page.route.id === '/'}>Summary</a></li>
        <li>
          <a href={resolve('/collectibles')} class:menu-active={page.route.id === '/collectibles'}>Collectibles</a>
          <ul>
            {#each data.collectibles as type (type.id)}
              <li><a href="{resolve('/collectibles')}#{type.id}">{type.name}</a></li>
            {/each}
          </ul>
        </li>
        <li><a href={resolve('/profile')} class:menu-active={page.route.id === '/profile'}>Profile</a></li>
      </ul>
    </div>
  </div>
</div>
