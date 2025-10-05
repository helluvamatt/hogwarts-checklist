<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { type ResolvedCollectibleItem, type ResolvedCollectibleType, type Location, type SortGroup, type SortGroupWithSubgroups, usePlayerState } from '$lib';
  import ItemGroup from '$lib/components/ItemGroup.svelte';
  import ObservableContainer from '$lib/components/ObservableContainer.svelte';

  type SortBy = 'type'|'location'|'name';
  type SortReducer = (groups: SortGroupWithSubgroups[], item: ResolvedCollectibleItem) => SortGroupWithSubgroups[];
  type SortTransformer = (type: ResolvedCollectibleType, locations: Location[]) => SortGroupWithSubgroups[];
  type FilterBy = 'not_collected'|'collected'|'all';
  type FilterPredicate = (item: ResolvedCollectibleItem) => boolean;

  const { data } = $props();

  const filters: Record<FilterBy, FilterPredicate> = {
    not_collected: (item) => !playerState.profile.completedItems?.[item.type.id]?.[item.id],
    collected: (item) => !!playerState.profile.completedItems?.[item.type.id]?.[item.id],
    all: () => true,
  };

  const sortTransformers: Record<SortBy, SortTransformer> = {
    type: (type, locations) => {
      if (!type) return [];
      const locationGroups: () => SortGroupWithSubgroups[] = () => locations.map<SortGroupWithSubgroups>(loc => createGroup(loc, loc.sublocations ? loc.sublocations.map<SortGroup>(sub => createGroup(sub)) : []));
      const groups: SortGroupWithSubgroups[] = type.subtypes?.length
        ? [...type.subtypes.map(st => createGroup(st, locationGroups())), createGroup({ id: 'none', name: 'No Type'}, locationGroups())]
        : [createGroup({ id: 'none', name: 'No Type' }, locationGroups())];
      const reducer: SortReducer = (groups, item) => {
        const subtypeGroupKey = type.subtypes?.length ? item.subtypeId : 'none';
        const subtypeGroup = groups.find(g => g.id === subtypeGroupKey);
        const locationGroup = subtypeGroup?.subgroups?.find(g => g.id === item.locationId);
        const sublocationGroup = locationGroup?.subgroups?.find(g => g.id === item.sublocationId);
        const collectedAddend = isItemCollected(item.id) ? 1 : 0;
        if (sublocationGroup) {
          if (filters[filterBy](item)) {
            sublocationGroup.items.push(item);
            sublocationGroup.hasItems = true;
            locationGroup!.hasItems = true;
            subtypeGroup!.hasItems = true;
          }
          sublocationGroup.totalItemCount++;
          locationGroup!.totalItemCount++;
          subtypeGroup!.totalItemCount++;
          sublocationGroup.playerItemCount = (sublocationGroup.playerItemCount ?? 0) + collectedAddend;
          locationGroup!.playerItemCount = (locationGroup!.playerItemCount ?? 0) + collectedAddend;
          subtypeGroup!.playerItemCount = (subtypeGroup!.playerItemCount ?? 0) + collectedAddend;
        } else if (locationGroup) {
          if (filters[filterBy](item)) {
            locationGroup.items.push(item);
            locationGroup.hasItems = true;
            subtypeGroup!.hasItems = true;
          }
          locationGroup.totalItemCount++;
          subtypeGroup!.totalItemCount++;
          locationGroup.playerItemCount = (locationGroup.playerItemCount ?? 0) + collectedAddend;
          subtypeGroup!.playerItemCount = (subtypeGroup!.playerItemCount ?? 0) + collectedAddend;
        } else if (subtypeGroup) {
          if (filters[filterBy](item)) {
            subtypeGroup.items.push(item);
            subtypeGroup.hasItems = true;
          }
          subtypeGroup.totalItemCount++;
          subtypeGroup.playerItemCount = (subtypeGroup.playerItemCount ?? 0) + collectedAddend;
        }
        return groups;
      };
      return type.items.reduce<SortGroupWithSubgroups[]>(reducer, groups);
    },
    location: (type, locations) => {
      if (!type) return [];
      const subtypeGroups: () => SortGroup[] = () => type.subtypes ? type.subtypes.map<SortGroup>(st => createGroup(st)) : [];
      const groups: SortGroupWithSubgroups[] = [
        ...locations.map<SortGroupWithSubgroups>(loc => createGroup(loc, loc.sublocations ? [...loc.sublocations.map<SortGroupWithSubgroups>(sub => createGroup(sub, subtypeGroups())), createGroup({ id: 'none', name: 'Other' }, subtypeGroups())] : subtypeGroups())),
        createGroup({ id: 'none', name: 'No Location', description: 'Located anywhere in the world' }, subtypeGroups())
      ];
      const reducer: SortReducer = (groups, item) => {
        const locationGroupKey = item.locationId ?? 'none';
        const locationGroup = groups.find(g => g.id === locationGroupKey);
        const sublocationOrSubtypeGroupKey = locationGroupKey === 'none' ? item.subtypeId : (item.sublocationId ?? 'none');
        const sublocationOrSubtypeGroup = locationGroup?.subgroups?.find(g => g.id === sublocationOrSubtypeGroupKey);
        const subtypeGroup = locationGroupKey !== 'none' ? sublocationOrSubtypeGroup?.subgroups?.find(g => g.id === item.subtypeId) : undefined;
        const collectedAddend = isItemCollected(item.id) ? 1 : 0;
        if (subtypeGroup) {
          if (filters[filterBy](item)) {
            subtypeGroup.items.push(item);
            subtypeGroup.hasItems = true;
            sublocationOrSubtypeGroup!.hasItems = true;
            locationGroup!.hasItems = true;
          }
          subtypeGroup.totalItemCount++;
          sublocationOrSubtypeGroup!.totalItemCount++;
          locationGroup!.totalItemCount++;
          subtypeGroup.playerItemCount = (subtypeGroup.playerItemCount ?? 0) + collectedAddend;
          sublocationOrSubtypeGroup!.playerItemCount = (sublocationOrSubtypeGroup!.playerItemCount ?? 0) + collectedAddend;
          locationGroup!.playerItemCount = (locationGroup!.playerItemCount ?? 0) + collectedAddend;
        } else if (sublocationOrSubtypeGroup) {
          if (filters[filterBy](item)) {
            sublocationOrSubtypeGroup.items.push(item);
            sublocationOrSubtypeGroup.hasItems = true;
            locationGroup!.hasItems = true;
          }
          sublocationOrSubtypeGroup.totalItemCount++;
          locationGroup!.totalItemCount++;
          sublocationOrSubtypeGroup.playerItemCount = (sublocationOrSubtypeGroup.playerItemCount ?? 0) + collectedAddend;
          locationGroup!.playerItemCount = (locationGroup!.playerItemCount ?? 0) + collectedAddend;
        } else if (locationGroup) {
          if (filters[filterBy](item)) {
            locationGroup.items.push(item);
            locationGroup.hasItems = true;
          }
          locationGroup.totalItemCount++;
          locationGroup.playerItemCount = (locationGroup.playerItemCount ?? 0) + collectedAddend;
        }
        return groups;
      }
      return type.items.reduce<SortGroupWithSubgroups[]>(reducer, groups);
    },
    name: (type) => {
      const items = type.items.filter(filters[filterBy]).toSorted((a, b) => a.name.localeCompare(b.name));
      const totalItemCount = type.items.length;
      const playerItemCount = playerState.profile ? type.items.filter(i => isItemCollected(i.id)).length : undefined;
      return [{ id: 'all', name: 'All', items, totalItemCount, playerItemCount, hasItems: items.length > 0 }];
    },
  };

  let activeIds = $state<string[]|undefined>(undefined);
  let activeId = $derived(activeIds?.[0]);
  let type = $derived(data.type);
  let locations = $derived(data.locations);
  let playerState = usePlayerState();
  let sortBy = $derived<SortBy>(parseSortBy(page.url.searchParams.get('sort')));
  let filterBy = $derived<FilterBy>(parseFilterBy(page.url.searchParams.get('filter')));
  let groupedItems = $derived<SortGroupWithSubgroups[]>(sortTransformers[sortBy](type, locations));

  function isItemCollected(itemId: string): boolean {
    return playerState.profile?.completedItems?.[type.id]?.[itemId] === true;
  }

  type CreateGroupParams = {
    id: string,
    name: string,
    description?: string,
    icon?: string,
    showIfEmpty?: boolean,
  };
  function createGroup(from: CreateGroupParams, subgroups?: SortGroupWithSubgroups[]): SortGroupWithSubgroups {
    return {
      ...from,
      subgroups,
      items: [],
      totalItemCount: 0,
      hasItems: false,
    };
  }

  function parseSortBy(value: string | null): SortBy {
    if (value === 'type' || value === 'location' || value === 'name') {
      return value;
    }
    return type?.subtypes?.length ? 'type' : 'location';
  };

  function parseFilterBy(value: string | null): FilterBy {
    if (value === 'collected' || value === 'not_collected' || value === 'all') {
      return value;
    }
    return playerState.profile && type.items.filter(i => !isItemCollected(i.id)).length ? 'not_collected' : 'all';
  }

  function setSortBy(value: SortBy) {
    const query = new URLSearchParams(page.url.searchParams);
    query.set('sort', value);
    goto(`?${query.toString()}`);
  }

  function setFilterBy(value: FilterBy) {
    const query = new URLSearchParams(page.url.searchParams);
    query.set('filter', value);
    goto(`?${query.toString()}`);
  }
</script>

<div class="container mx-auto flex-grow p-2 lg:p-4">
  <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-2 mb-2 lg:mb-4">
    <div class="flex flex-row items-center gap-2">
      {#if type.icon}
        <div aria-label={type.name} class="mask size-12 bg-base-content" style={`mask-image: url('${type.icon}')`}></div>
      {/if}
      <h1>{type.name}</h1>
    </div>
    <div class="flex flex-row items-center gap-2">
      <select class="select w-full lg:max-w-3xs" bind:value={() => filterBy, v => setFilterBy(v)} aria-label="Filter items by">
        <option value="not_collected">Not Collected</option>
        <option value="collected">Collected</option>
        <option value="all">All</option>
      </select>
      <select class="select w-full lg:max-w-3xs" bind:value={() => sortBy, v => setSortBy(v)} aria-label="Sort items by">
        <option value="type" disabled={!type.subtypes?.length}>Sort by Type</option>
        <option value="location">Sort by Location</option>
        <option value="name">Sort by Name</option>
      </select>
    </div>
  </div>
  <div class="flex flex-row items-start gap-2 lg:gap-4 relative">
    {#if groupedItems.filter(g => g.hasItems || g.showIfEmpty || g.subgroups?.filter(sg => sg.hasItems || sg.showIfEmpty)?.length).length > 1}
      <aside class="hidden lg:block w-64 shrink-0 sticky top-2 lg:top-4 left-0 space-y-2 lg:space-y-4">
        <div class="bg-base-200 rounded-box">
          <ul class="menu w-full">
            {#each groupedItems as group (group.id)}
              {#if group.hasItems || group.showIfEmpty}
                <li>
                  <a href="#{group.id}" class="flex flex-row items-center gap-2" class:menu-active={group.id === activeId}>
                    {#if group.icon}
                      <div aria-label={group.name} class="mask size-16 bg-base-content" style={`mask-image: url('${group.icon}')`}></div>
                    {/if}
                    {#if group.name}
                      <div>{group.name}</div>
                    {/if}
                  </a>
                  {#if group.subgroups && group.subgroups.length > 0}
                    <ul>
                      {#each group.subgroups as subgroup (subgroup.id)}
                        {#if subgroup.hasItems || subgroup.showIfEmpty}
                          {@const id = `${group.id}/${subgroup.id}`}
                          <li>
                            <a href="#{id}" class="flex flex-row items-center gap-2" class:menu-active={id === activeId}>
                              {#if subgroup.icon}
                                <div aria-label={subgroup.name} class="mask size-16 bg-base-content" style={`mask-image: url('${subgroup.icon}')`}></div>
                              {/if}
                              {#if subgroup.name}
                                <div>{subgroup.name}</div>
                              {/if}
                            </a>
                          </li>
                        {/if}
                      {/each}
                    </ul>
                  {/if}
                </li>
              {/if}
            {/each}
          </ul>
        </div>
      </aside>
    {/if}
    <main class="flex-grow">
      <div class="space-y-2 lg:space-y-4">
        {#if type.description}
          <p class="text-base-content/70">{type.description}</p>
        {/if}
        {#if groupedItems.filter(g => g.hasItems || g.showIfEmpty || g.subgroups?.filter(sg => sg.hasItems || sg.showIfEmpty)?.length).length > 0}
          <ObservableContainer bind:activeIds={activeIds}>
            {#each groupedItems as rootGroup (rootGroup.id)}
              <ItemGroup group={rootGroup} hideTags={sortBy === 'location' || sortBy === 'type'} maxObservable={2} />
            {/each}
          </ObservableContainer>
        {:else}
          <div class="text-center text-base-content/70 p-8">No items match this filter.</div>
        {/if}
      </div>
    </main>
  </div>
</div>
