<script module lang="ts">
  import type { Action } from 'svelte/action';

  type Setter<T> = (value: T) => void;

  interface ObservableState {
    register(node: HTMLElement): void;
    unregister(node: HTMLElement): void;
  }

  class ObservableStateController implements ObservableState {

    private readonly setActiveIds: Setter<string[]|undefined>;

    public readonly visibleIds: Record<string, boolean> = {};
    public readonly elements: Element[] = [];

    public observer: IntersectionObserver|undefined = undefined;

    constructor(setActiveIds: Setter<string[]|undefined>) {
      this.setActiveIds = setActiveIds;
    }

    public register(node: HTMLElement): void {
      const nodeBoundingBox = node.getBoundingClientRect();
      const index = this.elements.findIndex(e => e.getBoundingClientRect().y > nodeBoundingBox.y);
      if (index < 0) {
        this.elements.push(node);
      } else {
        this.elements.splice(index, 0, node);
      }
      this.observer?.observe(node);
    }

    public unregister(node: HTMLElement): void {
      const index = this.elements.indexOf(node);
      if (index < 0) return;
      this.elements.splice(index, 1);
      this.observer?.unobserve(node);
    }

    public mount(threshold?: number|number[], rootMargin?: string) {
      this.observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
          const id = e.target.id;
          this.visibleIds[id] = e.isIntersecting;
        });
        const activeIds = this.elements.map(e => e.id).filter(v => this.visibleIds[v]);
        this.setActiveIds(activeIds);
      }, { threshold, rootMargin })
      for(const e of this.elements) {
        this.observer.observe(e);
      }
      return () => this.observer?.disconnect();
    }
  }

  const CONTEXT_KEY = 'observableContainer';

	export const observable: Action = (node) => {
		// the node has been mounted in the DOM
    const observableState = getContext<ObservableState>(CONTEXT_KEY);
    if (!observableState) throw new Error('Observable state not available. You must only use:observable inside of an ObvservableContainer.');
		$effect(() => {
			observableState.register(node);
			return () => {
				observableState.unregister(node);
			};
		});
	};
</script>

<script lang="ts">
  import { getContext, onMount, setContext, type Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
    threshold?: number|number[];
    rootMargin?: string;
    activeIds?: string[];
  }

  let {
    children,
    threshold = 0,
    rootMargin = '-100px',
    activeIds = $bindable()
  }: Props = $props();

  const observableState = new ObservableStateController((v) => activeIds = v);
  setContext(CONTEXT_KEY, observableState);

  onMount(() => observableState.mount(threshold, rootMargin));
</script>

{@render children?.()}
