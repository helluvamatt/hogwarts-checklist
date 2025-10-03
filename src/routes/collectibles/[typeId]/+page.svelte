<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { type ResolvedCollectibleItem, type CollectibleType, type Location, usePlayerState } from '$lib';
  import ItemGroup, { type SortGroup, type SortGroupWithSubgroups } from '$lib/components/ItemGroup.svelte';

  type SortBy = 'type'|'location'|'name'|'collected';
  type SortReducer = (groups: SortGroupWithSubgroups[], item: ResolvedCollectibleItem) => SortGroupWithSubgroups[];
  type SortTransformer = (type: CollectibleType, locations: Location[]) => SortGroupWithSubgroups[];

  const { data } = $props();

  const sortTransformers: Record<SortBy, SortTransformer> = {
    type: (type, locations) => {
      const locationGroups: () => SortGroupWithSubgroups[] = () => locations.map<SortGroupWithSubgroups>(loc => ({ id: loc.id, name: loc.name, icon: loc.icon, subgroups: loc.sublocations ? loc.sublocations.map<SortGroup>(sub => ({ ...sub, items: [] })) : [], items: [] }));
      const groups: SortGroupWithSubgroups[] = type.subtypes?.length
        ? [...type.subtypes.map(st => ({ ...st, items: [], subgroups: locationGroups() })), { id: 'none', name: 'No Type', items: [], subgroups: locationGroups() }]
        : [{ id: 'none', name: 'No Type', items: [], subgroups: locationGroups() }];
      const reducer: SortReducer = (groups, item) => {
        const subtypeGroupKey = type.subtypes?.length ? item.subtypeId : 'none';
        const subtypeGroup = groups.find(g => g.id === subtypeGroupKey);
        const locationGroup = subtypeGroup?.subgroups?.find(g => g.id === item.locationId);
        const sublocationGroup = locationGroup?.subgroups?.find(g => g.id === item.sublocationId);
        if (sublocationGroup) {
          sublocationGroup.items.push(item);
          sublocationGroup.hasItems = true;
          locationGroup!.hasItems = true;
          subtypeGroup!.hasItems = true;
        } else if (locationGroup) {
          locationGroup.items.push(item);
          locationGroup.hasItems = true;
          subtypeGroup!.hasItems = true;
        } else if (subtypeGroup) {
          subtypeGroup.items.push(item);
          subtypeGroup.hasItems = true;
        }
        return groups;
      };
      return type.items.reduce<SortGroupWithSubgroups[]>(reducer, groups);
    },
    location: (type, locations) => {
      const subtypeGroups: () => SortGroup[] = () => type.subtypes ? type.subtypes.map<SortGroup>(st => ({ ...st, items: [] })) : [];
      const groups: SortGroupWithSubgroups[] = [
        ...locations.map<SortGroupWithSubgroups>(loc => ({
          id: loc.id,
          name: loc.name,
          icon: loc.icon,
          subgroups: loc.sublocations ? loc.sublocations.map<SortGroupWithSubgroups>(sub => ({ ...sub, subgroups: subtypeGroups(), items: [] })) : subtypeGroups(),
          items: [] })),
        { id: 'none', name: 'No Location', description: 'Located anywhere in the world', subgroups: subtypeGroups(), items: [] }
      ];
      const reducer: SortReducer = (groups, item) => {
        const locationGroupKey = item.locationId ?? 'none';
        const locationGroup = groups.find(g => g.id === locationGroupKey);
        const sublocationOrSubtypeGroupKey = locationGroupKey === 'none' ? item.subtypeId : item.sublocationId;
        const sublocationOrSubtypeGroup = locationGroup?.subgroups?.find(g => g.id === sublocationOrSubtypeGroupKey);
        const subtypeGroup = locationGroupKey !== 'none' ? sublocationOrSubtypeGroup?.subgroups?.find(g => g.id === item.subtypeId) : undefined;
        if (subtypeGroup) {
          subtypeGroup.items.push(item);
          subtypeGroup.hasItems = true;
          sublocationOrSubtypeGroup!.hasItems = true;
          locationGroup!.hasItems = true;
        } else if (sublocationOrSubtypeGroup) {
          sublocationOrSubtypeGroup.items.push(item);
          sublocationOrSubtypeGroup.hasItems = true;
          locationGroup!.hasItems = true;
        } else if (locationGroup) {
          locationGroup.items.push(item);
          locationGroup.hasItems = true;
        }
        return groups;
      }
      return type.items.reduce<SortGroupWithSubgroups[]>(reducer, groups);
    },
    name: (type) => {
      return [{ id: 'all', name: 'All', items: type.items.toSorted((a, b) => a.name.localeCompare(b.name)), hasItems: type.items.length > 0 }];
    },
    collected: (type) => type.items
      .reduce<SortGroupWithSubgroups[]>((groups, item) => {
        const isCollected = playerState.profile?.completedItems?.[item.id] === true;
        groups[isCollected ? 1 : 0].items.push(item);
        return groups;
      }, [{ id: 'not_collected', name: 'Not Collected', items: [], showIfEmpty: true }, { id: 'collected', name: 'Collected', items: [], showIfEmpty: true }])
      .map(g => ({ ...g, items: g.items.toSorted((a, b) => a.name.localeCompare(b.name)), hasItems: g.items.length > 0 })),
  };

  const parseSortBy = (value: string | null): SortBy => {
    if (value === 'type' || value === 'location' || value === 'name' || value === 'collected') {
      return value;
    }
    return type.subtypes?.length ? 'type' : 'location';
  };

  let type = $derived(data.type);
  let locations = $derived(data.locations);
  let playerState = usePlayerState();
  let sortBy = $derived<SortBy>(parseSortBy(page.url.searchParams.get('sort')));
  let groupedItems = $derived<SortGroupWithSubgroups[]>(sortTransformers[sortBy](type, locations));
</script>

<div class="space-y-2 lg:space-y-4">
  <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-2">
    <div class="flex flex-row items-center gap-2">
      {#if type.icon}
        <div aria-label={type.name} class="mask size-12 bg-base-content" style={`mask-image: url('${type.icon}')`}></div>
      {/if}
      <h1>{type.name}</h1>
    </div>
    <select class="select w-full lg:max-w-3xs" bind:value={() => sortBy, v => goto(`?sort=${v}`)} aria-label="Sort items by">
      <option value="type" disabled={!type.subtypes?.length}>Sort by Type</option>
      <option value="location">Sort by Location</option>
      <option value="name">Sort by Name</option>
      <option value="collected">Sort by Collected</option>
    </select>
  </div>
  {#if type.description}
    <p class="text-base-content/70">{type.description}</p>
  {/if}
  {#each groupedItems as rootGroup (rootGroup.id)}
    <ItemGroup group={rootGroup} hideTags={sortBy === 'location' || sortBy === 'type'} />
  {/each}
</div>
