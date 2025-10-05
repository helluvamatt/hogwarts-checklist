import type { ResolvedCollectibleItem } from '$lib';

export type SortGroup = {
  id: string,
  name: string,
  description?: string,
  icon?: string,
  items: ResolvedCollectibleItem[],
  totalItemCount: number,
  playerItemCount?: number,
  hasItems: boolean,
  showIfEmpty?: boolean
};
export type SortGroupWithSubgroups = SortGroup & {
  subgroups?: SortGroupWithSubgroups[]
};
