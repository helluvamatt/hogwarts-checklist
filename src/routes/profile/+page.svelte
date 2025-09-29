<script lang="ts">
  import { asset, resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import { Import, Download } from '@lucide/svelte';
  import { usePlayerState } from '$lib/player-state.svelte';
  import { type PlayerHouse } from '$lib/models/PlayerHouse';
  import { PlayerProfileSchema } from '$lib/models/PlayerProfile';
  import { PlayerInformationSchema, type PlayerInformation } from '$lib/models/PlayerInformation';
  import { deletePlayerProfile } from '$lib/player-profile';

  const playerState = usePlayerState();

  // Form state management
  let formData = $state<PlayerInformation>({
    name: '',
    house: 'Gryffindor'
  });

  // Validation errors state
  let errors = $state<{ [P in keyof PlayerInformation]?: string; }>({});
  let generalError = $state<string | undefined>(undefined);

  // UI state
  let showDeleteModal = $state(false);
  let isSubmitting = $state(false);
  let fileInput: HTMLInputElement;
  let importInput: HTMLInputElement;

  // Initialize form with existing profile data
  $effect(() => {
    if (playerState.profile) {
      formData.name = playerState.profile.player.name;
      formData.house = playerState.profile.player.house;
      formData.profilePicture = playerState.profile.player.profilePicture;
    }
  });

  // Form submission handler
  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (isSubmitting) return;
    isSubmitting = true;
    errors = {};

    try {
      // Validate with Zod
      const validation = PlayerInformationSchema.safeParse(formData);

      if (!validation.success) {
        // Update errors state
        const fieldErrors: Record<string, string> = {};
        validation.error.issues.forEach(issue => {
          const path = issue.path.join('.');
          fieldErrors[path] = issue.message;
        });
        errors = fieldErrors;
        return;
      }

      // Update the profile in state (will trigger localStorage save via $effect)
      playerState.profile = {
        version: 0,
        player: validation.data,
        completedItems: playerState.profile?.completedItems || {},
        lastUpdated: new Date().toISOString()
      };

      // Redirect to summary
      await goto(resolve('/'));

    } catch (error) {
      console.error('Failed to save profile:', error);
      generalError = 'Failed to save profile. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }

  // File upload handling
  async function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        formData.profilePicture = result;
      }
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
    link.download = `hogwarts-profile-${formData.name || 'wizard'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
      const validation = PlayerProfileSchema.safeParse(data);
      if (!validation.success) {
        generalError = 'Invalid profile file format.';
        return;
      }

      // Update state
      playerState.profile = validation.data;

      // Reset file input
      target.value = '';
    } catch (error) {
      console.error('Failed to import profile:', error);
      generalError = 'Failed to import profile. Please check the file format.';
    }
  }

  // Delete profile
  async function handleDeleteProfile() {
    try {
      await deletePlayerProfile();
      playerState.profile = undefined;
      showDeleteModal = false;
      await goto(resolve('/'));
    } catch (error) {
      console.error('Failed to delete profile:', error);
      generalError = 'Failed to delete profile. Please try again.';
    }
  }

  // Clear profile picture
  function clearProfilePicture() {
    formData.profilePicture = undefined;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  const houses: { name: PlayerHouse, crest: string }[] = [
    { name: 'Gryffindor', crest: asset('/gryffindor.png') },
    { name: 'Hufflepuff', crest: asset('/hufflepuff.png') },
    { name: 'Ravenclaw', crest: asset('/ravenclaw.png') },
    { name: 'Slytherin', crest: asset('/slytherin.png') }
  ] as const;

  // const houseColors = {
  //   Gryffindor: 'from-red-600 to-yellow-500',
  //   Hufflepuff: 'from-yellow-500 to-black',
  //   Ravenclaw: 'from-blue-600 to-bronze',
  //   Slytherin: 'from-green-600 to-gray-400'
  // };
</script>

<svelte:head>
  <title>Profile | Hogwarts Checklist</title>
</svelte:head>

<div class="container mx-auto p-2 space-y-2 md:space-y-4 lg:p-4 lg:space-y-6 max-w-4xl">
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

  <form onsubmit={handleSubmit} novalidate>
    <fieldset class="fieldset bg-base-200 border-base-300 rounded-box border p-4 mb-4 lg:mb-6">
      <legend class="fieldset-legend">Player Details</legend>
      <!-- Name input -->
      <label>
        <span class="label mb-1">Name</span>
        <input type="text" bind:value={formData.name} class="input w-full" class:input-error={errors.name} />
        {#if errors.name}
          <span class="label text-error text-sm">{errors.name}</span>
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
                bind:group={formData.house}
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
          {#if errors.house}
            <div class="col-span-full text-error text-sm">{errors.house}</div>
          {/if}
        </div>
      </div>
    </fieldset>
    <fieldset class="fieldset bg-base-200 border-base-300 rounded-box border p-4 mb-4 lg:mb-6">
      <legend class="fieldset-legend">Player Picture</legend>
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
            {#if formData.profilePicture}
              <img src={formData.profilePicture} alt="Profile" />
            {:else}
              <div class="w-full aspect-square bg-base-300 flex items-center justify-center p-8"><span class="text-base-content/50 text-4xl text-center">No picture</span></div>
            {/if}
          </div>
        </div>
        {#if formData.profilePicture}
          <button type="button" class="btn btn-error btn-outline btn-sm" onclick={clearProfilePicture}>Remove</button>
        {/if}
      </div>
    </fieldset>

    <div class="flex flex-col lg:flex-row gap-2 lg:justify-between">
      <button
        type="button"
        class="btn btn-error btn-outline"
        onclick={() => showDeleteModal = true}
        disabled={!playerState.profile}
      >
        Delete Profile
      </button>

      <button
        type="submit"
        class="btn btn-primary"
        disabled={isSubmitting}
      >
        {#if isSubmitting}
          <span class="loading loading-spinner loading-sm"></span>
          Saving...
        {:else}
          Save Profile
        {/if}
      </button>
    </div>
  </form>
</div>

<!-- Delete confirmation modal -->
{#if showDeleteModal}
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg">Delete Profile</h3>
      <p class="py-4">
        Are you sure you want to delete your wizard profile? This action cannot be undone and will remove all your progress.
      </p>
      <div class="modal-action">
        <button
          type="button"
          class="btn"
          onclick={() => showDeleteModal = false}
        >
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-error"
          onclick={handleDeleteProfile}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
{/if}
