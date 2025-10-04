<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import pDebounce from 'p-debounce';
  import { asset } from '$app/paths';
  import { Import, Download } from '@lucide/svelte';
  import { migratePlayerProfile, usePlayerState, ImportPlayerProfileSchema, AsyncFacade } from '$lib';
  import type { PlayerProfile, Facade } from '$lib';
  import type { PageProps } from './$types';
  type PlayerHouse = PlayerProfile['playerHouse'];

  const { data }: PageProps = $props();
  const playerState = usePlayerState();
  const { collectibles } = data;

  // Validation errors state
  let errors = $state<{ [P in keyof Pick<PlayerProfile, 'playerName'|'playerHouse'|'profilePicture'>]?: string; }>({});

  // UI state
  let generalError = $state<string | undefined>(undefined);
  let showResetModal = $state<boolean>(false);
  let fileInput: HTMLInputElement;
  let importInput: HTMLInputElement;

  // Form field facades
  const playerName: Facade<string> = new AsyncFacade<string>(
    () => playerState.profile.playerName,
    pDebounce((v: string) => updateProfile({ playerName: v }), 300));
  const playerHouse: Facade<PlayerHouse> = new AsyncFacade<PlayerHouse>(
    () => playerState.profile.playerHouse,
    (v: PlayerHouse) => updateProfile({ playerHouse: v }));

  // Update the profile state
  async function updateProfile(value: Partial<PlayerProfile>) {
    try {
      await playerState.setPlayerProfile({
        ...playerState.profile,
        ...value,
        lastUpdated: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to save profile:', error);
      generalError = 'Failed to save profile. Please try again.';
    }
  }

  // File upload handling
  function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result;
      if (typeof result !== 'string') return;
      await updateProfile({ profilePicture: result });
    };
    reader.readAsDataURL(file);
  }

  // Export profile
  function exportProfile() {
    if (!playerState.profile) return;

    const dataStr = JSON.stringify(playerState.profile, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `hogwarts-profile-${playerState.profile.playerName || 'player'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Clear profile picture
  async function clearProfilePicture() {
    if (fileInput) fileInput.value = '';
    await updateProfile({ profilePicture: undefined });
  }

  // Import profile
  async function importProfile(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate with Zod
      const validation = ImportPlayerProfileSchema.safeParse(data);
      if (!validation.success) {
        generalError = 'Invalid profile file format.';
        return;
      }

      // Migrate player profile (if needed)
      const profileData = migratePlayerProfile(validation.data, collectibles);

      // Update state
      await playerState.setPlayerProfile(profileData);

      // Reset file input
      target.value = '';
    } catch (error) {
      console.error('Failed to import profile:', error);
      generalError = 'Failed to import profile. Please check the file format.';
    }
  }

  // Reset progress
  async function handleResetProgress() {
    try {
      await playerState.setPlayerProfile({
        ...playerState.profile,
        completedItems: {},
        lastUpdated: new Date().toISOString()
      });
      showResetModal = false;
    } catch (error) {
      console.error('Failed to dreset progress:', error);
      generalError = 'Failed to reset progress. Please try again.';
    }
  }

  const houses: { name: PlayerHouse, crest: string }[] = [
    { name: 'Gryffindor', crest: asset('/gryffindor.png') },
    { name: 'Hufflepuff', crest: asset('/hufflepuff.png') },
    { name: 'Ravenclaw', crest: asset('/ravenclaw.png') },
    { name: 'Slytherin', crest: asset('/slytherin.png') }
  ] as const;
</script>

<svelte:head>
  <title>Profile | Hogwarts Checklist</title>
</svelte:head>

<main class="flex-1 container mx-auto my-4">
  <div class="space-y-2 lg:space-y-4">
    <div class="flex flex-row items-center gap-4 mb-2 lg:mb-4">
      <h1 class="flex-1">Profile</h1>
      {#if playerState.profile}
        <button type="button" class="btn btn-primary" onclick={exportProfile}>
          <Download class="size-4" />
          Export
        </button>
      {/if}
      <div>
        <button type="button" class="btn btn-secondary" onclick={() => importInput.click()}>
          <Import class="size-4" />
          Import
        </button>
        <input type="file" bind:this={importInput} accept=".json" class="hidden" onchange={importProfile} />
      </div>
    </div>

    {#if generalError}
      <div class="alert alert-error mb-6">{generalError}</div>
    {/if}

    <form onsubmit={e => e.preventDefault()} novalidate>
      <fieldset class="fieldset bg-base-200 border-base-300 rounded-box border p-4 mb-4 lg:mb-6">
        <legend class="fieldset-legend -my-4 lg:-my-6">Player Details</legend>
        <!-- Name input -->
        <label>
          <span class="label mb-1">Name</span>
          <input type="text" bind:value={playerName.value} class="input w-full" class:input-error={errors.playerName} />
          {#if errors.playerName}
            <span class="label text-error text-sm">{errors.playerName}</span>
          {/if}
        </label>
        <!-- House selection -->
        <div>
          <div class="col-span-full label mb-1">House</div>
          <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
            {#each houses as house (house.name)}
              <label class="cursor-pointer">
                <input
                  type="radio"
                  name="house"
                  value={house.name}
                  bind:group={playerHouse.value}
                  class="sr-only peer"
                />
                <span class="card bg-base-200 border-2 peer-checked:border-primary peer-checked:bg-primary/10 transition-all hover:shadow-md">
                  <span class="card-body items-center text-center p-4">
                    <img src={house.crest} alt="{house.name} crest" class="w-24 h-24 mb-2" />
                    <span class="card-title text-sm">{house.name}</span>
                  </span>
                </span>
              </label>
            {/each}
            {#if errors.playerHouse}
              <div class="col-span-full text-error text-sm">{errors.playerHouse}</div>
            {/if}
          </div>
        </div>
      </fieldset>
      <fieldset class="fieldset bg-base-200 border-base-300 rounded-box border p-4 mb-4 lg:mb-6">
        <legend class="fieldset-legend -my-4 lg:-my-6">Player Picture</legend>
        <p class="mb-2 text-base-content/70">Upload a picture of your character to personalize your profile. Supported formats: JPG, PNG, GIF.</p>
        <!-- Profile picture upload -->
        <label>
          <span class="label mb-1">Profile Picture</span>
          <input type="file" bind:this={fileInput} accept="image/*" onchange={handleFileUpload} class="file-input w-full" class:input-error={errors.profilePicture} />
          {#if errors.profilePicture}
            <span class="text-error text-sm">{errors.profilePicture}</span>
          {/if}
        </label>
        <div class="flex flex-row items-center gap-4 mt-2">
          <div class="avatar flex-1 max-w-xs">
            <div class="rounded-2xl">
              {#if playerState.profile.profilePicture}
                <img src={playerState.profile.profilePicture} alt="Profile" />
              {:else}
                <div class="w-full aspect-square bg-base-300 flex items-center justify-center p-8"><span class="text-base-content/50 text-4xl text-center">No picture</span></div>
              {/if}
            </div>
          </div>
          {#if playerState.profile.profilePicture}
            <button type="button" class="btn btn-error btn-outline btn-sm" onclick={clearProfilePicture}>Remove</button>
          {/if}
        </div>
      </fieldset>
      <fieldset class="fieldset bg-error/10 border-error rounded-box border p-4 mb-4 lg:mb-6">
        <legend class="fieldset-legend text-error -my-4 lg:-my-6">Danger Zone</legend>
        <p class="text-error">Resetting your progress will clear all completed items but retain your profile details. This action cannot be undone.</p>
        <div>
          <button type="button" class="btn btn-error btn-outline" onclick={() => showResetModal = true} disabled={!playerState.profile}>Reset Progress</button>
        </div>
      </fieldset>
    </form>
  </div>
</main>

<!-- Delete confirmation modal -->
<Modal open={showResetModal} onclose={() => showResetModal = false}>
  <h3 class="font-bold text-lg">Reset Progress</h3>
  <p class="py-4">Are you sure you want to reset your progress? This action cannot be undone.</p>
  <div class="modal-action">
    <button type="button" class="btn" onclick={() => showResetModal = false}>Cancel</button>
    <button type="button" class="btn btn-error" onclick={handleResetProgress}>Reset</button>
  </div>
</Modal>
