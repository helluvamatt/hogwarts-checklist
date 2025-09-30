<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    activeId?: string;
    threshold?: number|number[];
    children?: Snippet;
  }

  let { children, threshold = 0.1, activeId = $bindable(), ...props }: Props = $props();

  const visibleIds: string[] = [];
  let container: HTMLDivElement;
  let elements: Element[] = [];

  onMount(() => {
    elements = [...container.querySelectorAll('[data-activate="observable"][id]')];
    const ids = elements.map(s => s.id);

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const id = e.target.id;
        if (e.isIntersecting) {
          if (visibleIds.length > 0 && ids.indexOf(id) < ids.indexOf(visibleIds[0])) {
            visibleIds.unshift(id);
          } else {
            visibleIds.push(id);
          }
        } else {
          const visiblePosition = visibleIds.indexOf(id);
          if (visiblePosition > -1) visibleIds.splice(visiblePosition, 1);
        }
      });

      activeId = visibleIds[0];
    }, { threshold })

    elements.forEach(el => {
      io.observe(el);
    });

    return () => io.disconnect();
  });
</script>

<div bind:this={container} {...props}>
  {@render children?.()}
</div>
