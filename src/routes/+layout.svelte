<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { asset } from '$app/paths';
  import { Menu, X } from '@lucide/svelte';
  import ProfileCard from '$lib/components/ProfileCard.svelte';
  import SidebarNav from '$lib/components/SidebarNav.svelte';
  import { providePlayerState } from '$lib';
  import '../app.css';

  let { children, data } = $props();
  const uid = $props.id();
  let drawerOpen = $state<boolean>(false);
  const logo = asset('/logo.svg');

  const playerState = providePlayerState();

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
    <div class="navbar w-full bg-base-300 sticky lg:relative top-0 z-10">
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
      <div class="px-2 flex-1 text-xl font-headings">Hogwarts Checklist</div>
    </div>
    <!-- Page content here -->
    <div class="container mx-auto flex-grow flex flex-row items-start p-2 gap-2 lg:p-4 lg:gap-4 relative">
      <aside class="hidden lg:block w-64 shrink-0 sticky top-2 lg:top-4 left-0 space-y-2 lg:space-y-4">
        <ProfileCard profile={playerState.profile} />
        <div class="bg-base-200 rounded-box">
          <SidebarNav collectibles={data.collectibles} />
        </div>
      </aside>
      <main class="flex-grow">
        {@render children?.()}
      </main>
    </div>
    <!-- Footer -->
    <footer class="footer sm:footer-horizontal bg-base-200 items-center justify-center p-4 mt-6">
      <aside>
        <p>Copyright © {new Date().getFullYear()} Matt Schneeberger - All rights reserved</p>
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
      <ProfileCard profile={playerState.profile} class="mx-2" />
      <SidebarNav collectibles={data.collectibles} />
    </div>
  </div>
</div>
