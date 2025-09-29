<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
</script>

<h1 class="text-error">{page.status}: {page.error?.message}</h1>

<a href={resolve('/')}>Go back home</a>
