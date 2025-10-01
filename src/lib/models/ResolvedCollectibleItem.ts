import type { CollectibleItem, Tag } from '$lib';

export type ResolvedCollectibleItem = CollectibleItem & {
  type?: Tag;
  subtype?: Tag;
  location?: Tag;
  sublocation?: Tag;
};
