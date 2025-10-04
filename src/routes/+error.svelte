<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
</script>

<main class="container mx-auto flex-grow py-4">
  <div class="text-center">
    <h1 class="text-error">{page.status}: {page.error?.message}</h1>
    <a href={resolve('/')} class="link-hover text-primary">Go back home</a>
  </div>
</main>
