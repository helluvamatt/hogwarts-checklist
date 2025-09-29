
<script lang="ts">
  import { resolve } from '$app/paths';
  import { Info } from '@lucide/svelte';
</script>

<div class="alert bg-accent text-accent-content rounded-none mb-2">
  <Info class="size-6 shrink-0" />
  <span>Create a player profile to start tracking your collectibles!</span>
  <div>
    <a href={resolve('/profile')} class="btn btn-sm">Create Profile</a>
  </div>
</div>
