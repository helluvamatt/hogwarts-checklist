import type { ResolvedCollectibleItem } from '$lib';

export type SortGroup = { id: string, name?: string, description?: string, icon?: string, items: ResolvedCollectibleItem[], showIfEmpty?: boolean };
export type SortGroupWithSubgroups = SortGroup & { subgroups?: SortGroupWithSubgroups[], hasItems?: boolean };
