<script lang="ts">
  import CreateProfileAlert from '$lib/components/CreateProfileAlert.svelte';
  import { usePlayerState } from '$lib/player-state.svelte';
  const playerState = usePlayerState();
</script>

<svelte:head>
  <title>Summary | Hogwarts Checklist</title>
</svelte:head>

{#if !playerState.profile}
  <CreateProfileAlert />
{/if}
