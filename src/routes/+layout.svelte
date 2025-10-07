<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { asset, resolve } from '$app/paths';
  import { page } from '$app/state';
  import { Menu, X, ChevronDown } from '@lucide/svelte';
  import { providePlayerState } from '$lib';
  import '../app.css';

  let { children, data } = $props();
  const uid = $props.id();
  let drawerOpen = $state<boolean>(false);
  const logo = asset('/logo.svg');

  providePlayerState();

  afterNavigate(() => {
    drawerOpen = false;
  });
</script>

<svelte:head>
  <title>Hogwarts Checklist</title>
  <link rel="icon" href={logo} />
</svelte:head>

<div class="drawer">
  <input id="{uid}-drawer" type="checkbox" bind:checked={drawerOpen} class="drawer-toggle" />
  <div class="drawer-content flex flex-col min-h-screen">
    <!-- Header (Navbar) -->
    <nav class="navbar w-full bg-base-300 sticky lg:relative top-0 z-10">
      <!-- Mobile hamburger menu (left side on mobile) -->
      <div class="flex-none lg:hidden">
        <label for="{uid}-drawer" aria-label="open sidebar" class="btn btn-square btn-ghost">
          <Menu />
        </label>
      </div>
      <!-- Logo (only shown on large screens) -->
      <div class="px-2 hidden lg:flex">
        <img src={logo} alt="Hogwarts Checklist" class="size-8 max-w-none" />
      </div>
      <div class="px-2 text-xl font-headings">Hogwarts Checklist</div>
      <div class="flex-none hidden lg:flex gap-4 px-2">
        <a href={resolve('/')} class="btn btn-ghost btn-neutral" class:btn-active={page.route.id === '/'}>Summary</a>
        <a href={resolve('/profile')} class="btn btn-ghost btn-neutral" class:btn-active={page.route.id === '/profile'}>Profile</a>
        <div class="dropdown">
          <span tabindex=0 role="button" class="btn btn-ghost btn-neutral group" class:btn-active={page.route.id === '/collectibles' || page.route.id === '/collectibles/[typeId]'}>Collectibles <ChevronDown class="size-3 transition-transform group-focus:rotate-180" /></span>
          <ul tabindex=0 role="menu" class="dropdown-content menu bg-base-300 rounded-b-box z-1 w-52 p-2 shadow-sm ms-0">
            <li>
              <a href={resolve('/collectibles')} class:menu-active={page.route.id === '/collectibles'}>Summary</a>
            </li>
            <li></li>
            {#each data.collectibles as type (type.id)}
              <li>
                <a href={resolve('/collectibles/[typeId]', { typeId: type.id })} class:menu-active={page.route.id === '/collectibles/[typeId]' && page.params.typeId === type.id}>{type.name}</a>
              </li>
            {/each}
          </ul>
        </div>
      </div>
      <div class="ms-auto grid-flow-row items-center px-2">
        <a href={APP_REPOSITORY_URL} target="_blank" aria-label="GitHub repository" class="hover:text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="24" height="24" fill="currentColor" class="bi bi-github">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/>
          </svg>
        </a>
      </div>
    </nav>
    <!-- Page content here -->
    {@render children?.()}
    <!-- Footer -->
    <footer class="footer sm:footer-horizontal bg-base-200 items-center justify-center p-4 mt-6">
      <aside>
        <p>Copyright © {new Date().getFullYear()} {APP_AUTHOR} - All rights reserved</p>
        <p>Hogwarts house crests created by <a href="https://www.deviantart.com/crystallynnblud" class="link-hover text-primary">CrystalLynnblud on DeviantArt</a></p>
      </aside>
    </footer>
  </div>
  <div class="drawer-side lg:hidden">
    <label for="{uid}-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
    <div class="min-h-full w-80 bg-base-200 space-y-2 lg:space-y-4">
      <!-- Small navbar for inside the drawer -->
      <div class="navbar w-full bg-base-300 sticky top-0 z-10">
        <div class="flex-none">
          <label for="{uid}-drawer" aria-label="open sidebar" class="btn btn-square btn-ghost">
            <X />
          </label>
        </div>
        <div class="mx-2 px-2 flex-1 text-xl font-headings">Hogwarts Checklist</div>
      </div>
      <ul class="menu w-full p-2 lg:p-4">
        <li><a href={resolve('/')} class:menu-active={page.route.id === '/'}>Summary</a></li>
        <li><a href={resolve('/profile')} class:menu-active={page.route.id === '/profile'}>Profile</a></li>
        <li>
          <details>
            <summary>Collectibles</summary>
            <ul>
              {#each data.collectibles as type (type.id)}
                <li>
                  <a href={resolve('/collectibles/[typeId]', { typeId: type.id })} class="flex flex-row items-center gap-2" class:menu-active={page.route.id === '/collectibles/[typeId]' && page.params.typeId === type.id}>
                    {#if type.icon}
                      <div aria-label={type.name} class="mask size-4 bg-base-content" style={`mask-image: url('${type.icon}')`}></div>
                    {/if}
                    <div>{type.name}</div>
                  </a>
                </li>
              {/each}
            </ul>
          </details>
        </li>
      </ul>
    </div>
  </div>
</div>
