import type { CollectibleItem, CollectibleType, Tag } from '$lib';

export type ResolvedCollectibleItem = CollectibleItem & {
  type: Tag;
  subtype?: Tag;
  location?: Tag;
  sublocation?: Tag;
};

export type ResolvedCollectibleType = Omit<CollectibleType, 'items'> & {
  items: ResolvedCollectibleItem[]
};
