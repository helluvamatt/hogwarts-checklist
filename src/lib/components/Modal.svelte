<script lang="ts">
  import type { HTMLDialogAttributes } from 'svelte/elements';
  const { children, open, ...attrs }: HTMLDialogAttributes = $props();
  let dialogEl: HTMLDialogElement;

  $effect(() => {
    if (open) {
      dialogEl.showModal();
    } else if (dialogEl.open) {
      dialogEl.close();
    }
  })
</script>

<dialog bind:this={dialogEl} class="modal" {...attrs}>
  <div class="modal-box border border-base-300">
    <form method="dialog">
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
    </form>
    {@render children?.()}
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
