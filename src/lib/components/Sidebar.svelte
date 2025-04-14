
<script lang="ts">
    import { Data, setFilteredData, setData, resetData, DisplayOpsStore, DisplayOps, getLabels } from "$lib/datastore.svelte";
    import { type DisplayOptions, type Entity, type GraphData, type LevelNode } from "$lib/types";
    import { onMount } from "svelte";
    import { fly } from "svelte/transition";

    let { 
        onConditionalFormatDialogueOpen
     }:{
        onConditionalFormatDialogueOpen: () => void;
    } = $props();

    let isSidebarVisible = $state(true);

    export function toggleSideBar() {
        isSidebarVisible = !isSidebarVisible;
    }

    let displayOps = $state<DisplayOptions>({
        displayEmpty: true,
        visibleLabels: [],
    });

    function getEntetiesWithRelationShips(): GraphData {
        const leafType = getLabels()[getLabels().length - 1];

        const nodes = Data.nodes.filter((entity) => {
            const label = entity.label || 'Unknown';
            if (label === leafType) {
                return true;
            }

            const isASourceEntity = Data.relationships.some((relationship) => {
                return relationship.from === entity.id;
            });
            return isASourceEntity;
        });

        const entityMap = Data.nodes.reduce((acc, entity) => {
            acc[entity.id] = entity;
            return acc;
        }, {} as Record<string, Entity>);

        return {
            nodes: nodes,
            relationships: Data.relationships.filter((relationship) => {
                const fromEntity = entityMap[relationship.from];
                const toEntity = entityMap[relationship.to];
                return fromEntity && toEntity;
            })

        }

    }


    function filterGraphData(filterByLabel: string) {

        const labels = getLabels();

        const filterLabelIdx = labels.indexOf(filterByLabel);

        // clear all filters after this label
        for (let i = filterLabelIdx + 1; i < labels.length; i++) {
            const label = labels[i];
            if(filters.has(label)) {
                filters.set(label, []);
            }
        }

        // if there's no filters applied for any label

        if(filters.values().every((v) => v.length === 0)) {
            if(!displayOps.displayEmpty){
                const nodesWithRelationships = getEntetiesWithRelationShips();
                setFilteredData(nodesWithRelationships);
                return;
            }
            setFilteredData(Data);
            return;
        }

        const filteredData: GraphData = {
            nodes: [],
            relationships: []
        };


        const filteredNodes: Entity[] = Data.nodes.filter((entity) => {
            const label = entity.label || 'Unknown';
            const labelFilters = filters.get(label) || [];
            const isLabelFiltered = labelFilters.length === 0 || labelFilters.includes(entity.name);
            return isLabelFiltered;
        });

        filteredData.nodes = filteredNodes;

        filteredData.relationships = Data.relationships.filter((relationship) => {
            const fromEntity = filteredNodes.find((entity) => entity.id === relationship.from);
            const toEntity = filteredNodes.find((entity) => entity.id === relationship.to);
            return fromEntity && toEntity;
        });


        // Update the options for the filters based on the filtered data
        console.log('filteredData', filteredData);
        setFilteredData(filteredData);


    }

    function DisplayOpsChanged(){
        console.log('DisplayOpsChanged', displayOps);
        console.log('DisplayOps', DisplayOps);
        if(DisplayOps.displayEmpty !== displayOps.displayEmpty) {
            filterGraphData('n1');
        }
        
        DisplayOpsStore.set(displayOps);

    }

    function onClearData(){
        resetData();
        location.reload();
    }

    // function noFiltersApplied() {
    //     return !filters.n1 && filters.n1.trim() === ''
    //         && !filters.n2 && filters.n2.trim() === ''
    //         && !filters.n3 && filters.n3.trim() === ''
    //         && !filters.app && filters.app.trim() === '';
    // }

    function resetOptions(){
        // n1Options = [...new Set(Data.map(n1g => n1g.name))];
        // n2Options = [...new Set(Data.flatMap(n1g => n1g.children?.map(n2g => n2g.name) ?? []))];
        // n3Options = [...new Set(Data.flatMap(n1g => n1g.children?.flatMap(n2g => n2g.children?.map(n3g => n3g.name).filter((name): name is string => name !== undefined) ?? []) ?? []))];
        // appOptions = [...new Set(Data.flatMap(n1g => n1g.children?.flatMap(n2g => n2g.children?.flatMap(n3g => n3g.children) ?? []) ?? []) ?? [])]
        //     .filter(app => app !== undefined);

    }


    function updateFiltering(){
        if(filters.values().every((v) => v.length === 0)) {
            resetOptions();
            return;
        }

        // if (filters.n1 && filters.n1.trim() !== '') {
        //     n2Options = [...new Set(Data.filter(n1g => n1g.name === filters.n1).flatMap(n1g => n1g.children?.map(n2g => n2g.name) ?? []))];
        // } else {
        //     n2Options = [...new Set(Data.flatMap(n1g => n1g.children?.map(n2g => n2g.name).filter((name): name is string => name !== undefined)))] as string[];
        // }
        // if (filters.n2 && filters.n2.trim() !== '') {
        //     n3Options = [...new Set(Data.filter(n1g => n1g.name === filters.n1).flatMap(n1g => n1g.children?.filter(n2g => n2g.name === filters.n2).flatMap(n2g => n2g.children?.map(n3g => n3g.name))) )] as string[];
        // } else {
        //     n3Options = [...new Set(Data.flatMap(n1g => n1g.children?.flatMap(n2g => n2g.children?.map(n3g => n3g.name))))] as string[];
        // }
        // if (filters.n3 && filters.n3.trim() !== '') {
        //     appOptions = [...new Set(Data.filter(n1g => n1g.name === filters.n1).flatMap(n1g => n1g.children?.filter(n2g => n2g.name === filters.n2).flatMap(n2g => n2g.children?.filter(n3g => n3g.name === filters.n3).flatMap(n3g => n3g.children))) )].filter(app => app !== undefined);
        // } else {
        //     appOptions = [...new Set(Data.flatMap(n1g => n1g.children?.flatMap(n2g => n2g.children?.flatMap(n3g => n3g.children))))].filter(app => app !== undefined);
        // }
    }

    function changeFiltering(event: Event, label: string) {
        const target = event.target as HTMLInputElement;
        const entityName = target.value;
        const checked = target.checked;

        if(!filters.has(label)) {
            filters.set(label, []);
        }
        const labelFilters = filters.get(label) || [];

        if (checked) {
            if (labelFilters.includes(entityName)) {
                console.log('value already exists', entityName);
                return;
            }

            // Add the entity name to the filter for the label
            filters.set(label, [...labelFilters, entityName]);
            
        } else {
            filters.set(label, labelFilters.filter((v) => v !== entityName));
        }

        console.log('filters', filters);

        filterGraphData(label);
    }


    $effect(() => {
        // Update the options for the filters based on the data

        if(isSidebarVisible)
        {
            updateFiltering();
        }

    });

    let sortedEnteties: Map<string, Entity[]> = $state(new Map<string, Entity[]>());

    let filters: Map<string, string[]> = $state({} as Map<string, string[]>);

    onMount(() => {
        // Initialize the options for the filters based on the data
        updateFiltering();

        const labels = getLabels();

        // Order the map so that the keys are ordered in the same order as the labels array

        const acc = Data.nodes.reduce((acc, entity) => {
            const label = entity.label || 'Unknown';
            if (!acc.has(label)) {
                acc.set(label, []);
            }
            acc.get(label)?.push(entity);
            return acc;
        }, new Map<string, Entity[]>())

        sortedEnteties = new Map([...acc.entries()].sort((a, b) => {
            const indexA = labels.indexOf(a[0]);
            const indexB = labels.indexOf(b[0]);
            return indexA - indexB;
        }));

        // Map<string, string[]>
        filters = new Map<string, string[]>();
        for (const label of labels) {
            filters.set(label, []);
        }



    });


</script>



<div class="sidebar-container {isSidebarVisible ? 'sidebar-open' : ''}">
    <button onclick={toggleSideBar} aria-label="Show sidebar" data-tooltip="Show Filtering" data-placement="right">
        <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-filter"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227z" /></svg>
    </button>

{#if isSidebarVisible}
    <div class="sidebar" in:fly={{ x: -100 }} out:fly={{ x: -100 }}>
        <h2>Filtering</h2>
        <aside>
        <nav>
            <details name="filter-clmns" >
                <summary role="button" class="outline">Filter columns</summary>
                <ul>
                    {#each sortedEnteties as [label, entities]}
                        <li>
                            <details class="dropdown">
                                <summary>
                                    {label}: {filters.has(label) && (filters.get(label)?.length ?? 0) > 0 ? filters.get(label)?.join(', ') ?? 'All' : 'All'}
                                </summary>
                                <ul>
                                    {#each entities as entity}
                                    <li>
                                        <label>
                                            <input type="checkbox" name="{entity.name}" onchange={(e) => changeFiltering(e, label)} value={entity.name} checked={filters.get(label)?.includes(entity.name) ?? false} />
                                            {entity.name}
                                        </label>
                                    </li>
                                    {/each}
                                </ul>
                            </details>
                        </li>
                    {/each}
                </ul>
            </details>
            <hr />
            <details name="display-opts" >
                <summary role="button" class="outline">Display options</summary>
                <ul>
                    <li>
                        <label>
                            <input type="checkbox" role="switch" 
                                bind:checked={displayOps.displayEmpty} onchange={DisplayOpsChanged}  /> Display Empty levels

                        </label>
                        <small >
                            <em>If true, include models that doesn't have an application assigned.</em>
                        </small>
                    </li>
                    {#each getLabels() as label}
                        <li>
                            <label>
                                <input type="checkbox" role="switch" bind:checked={displayOps.visibleLabels[getLabels().indexOf(label)]} onchange={DisplayOpsChanged} /> Show {label}
                            </label>
                        </li>
                    {/each}
                </ul>
            </details>

        </nav>
        </aside>
        <hr />

        <div role="group">
            <button aria-label="edit-conditional-format" onclick={onConditionalFormatDialogueOpen} >
                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-subscript"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 7l8 10m-8 0l8 -10" /><path d="M21 20h-4l3.5 -4a1.73 1.73 0 0 0 -3.5 -2" /></svg>
            </button>
        </div>

        <div role="group">
            <button onclick={toggleSideBar} >Close</button>
            <button onclick={onClearData} class="outline" aria-label="Clear data" data-tooltip="Clear data" data-placement="bottom">
                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-trash-x"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7h16" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /><path d="M10 12l4 4m0 -4l-4 4" /></svg>
            </button>

        </div>

    </div>
{/if}
</div>



<style>
    .sidebar-container {
        position: fixed;
        top: 0;
        left: 0;
        height: 100%;
    }

    .sidebar-container>button {
        top: 2rem;
        border-top-left-radius: 0%;
        border-bottom-left-radius: 0%;
        border-top-right-radius: 50%;
        border-bottom-right-radius: 50%;
    }

    .sidebar-container.sidebar-open>button {
        position: absolute;
        left: 400px;
    }

    .sidebar {
        width: 400px;
        height: 100%;
        background-color: #f4f4f4;
        padding: 20px;
        box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
        z-index: 1000;
    }

</style>