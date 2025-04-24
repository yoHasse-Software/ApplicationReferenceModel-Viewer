
<script lang="ts">
    import { setFilteredData, resetData, DisplayOpsStore, getDisplayOptions, setDisplayOptions, getData, openDialogue } from "$lib/datastore.svelte";
    import { type DiagramTypes, type DisplayOptions, type Entity, type GraphData, type NestedBlockOptions } from "$lib/types";
    import { onMount } from "svelte";
    import { page } from '$app/state';
    import { goto } from "$app/navigation";


    let isSidebarVisible = $state(false);
    let sortedEnteties: Map<string, Entity[]> = $state(new Map<string, Entity[]>());
    let filters: Map<string, string[]> = $state(new Map<string, string[]>);

    const diagramType: DiagramTypes = $derived((page.url.pathname.replace('/', '') as DiagramTypes) || 'nestedblock');

    export function toggleSideBar() {
        isSidebarVisible = !isSidebarVisible;
    }

    let displayOps = $state(getDisplayOptions()) as DisplayOptions;

    const getLeafType = (diagramType: DiagramTypes): string => {
        if (diagramType === 'nestedblock') {
            return displayOps.nestedBlockOptions.labelHierarchy[0] || 'Unknown';
        } else if (diagramType === 'sunburst') {
            return displayOps.sunBurstOptions.labelHierarchy[0] || 'Unknown';
        }
        return 'Unknown';
    }

    const getLabelsForDiagram = (diagramType: DiagramTypes): string[] => {
        if (diagramType === 'nestedblock') {
            return displayOps.nestedBlockOptions.labelHierarchy.map((label) => label);
        } else if (diagramType === 'sunburst') {
            return displayOps.sunBurstOptions.labelHierarchy.map((label) => label);
        }
        return [];
    }

    function getEntetiesWithRelationShips(diagramType: DiagramTypes): GraphData {

        const leafType = getLeafType(diagramType);        

        const data = getData();

        const nodes = data.nodes.filter((entity) => {
            const label = entity.label || 'Unknown';
            if (label === leafType) {
                return true;
            }

            const isASourceEntity = data.relationships.some((relationship) => {
                return relationship.from === entity.id;
            });
            return isASourceEntity;
        });

        const entityMap = data.nodes.reduce((acc, entity) => {
            acc[entity.id] = entity;
            return acc;
        }, {} as Record<string, Entity>);

        return {
            nodes: nodes,
            relationships: data.relationships.filter((relationship) => {
                const fromEntity = entityMap[relationship.from];
                const toEntity = entityMap[relationship.to];
                return fromEntity && toEntity;
            })

        }

    }


    function filterGraphData(filterByLabel: string) {

        const labels = getLabelsForDiagram(diagramType);

        const filterLabelIdx = labels.indexOf(filterByLabel);

        // clear all filters after this label
        for (let i = filterLabelIdx + 1; i < labels.length; i++) {
            const label = labels[i];
            if(filters.has(label)) {
                filters.set(label, []);
            }
        }

        const nestedBlockOptions: NestedBlockOptions = getDisplayOptions().nestedBlockOptions

        // if there's no filters applied for any label

        const data = getData();

        if(filters.values().every((v) => v.length === 0)) {
            if(!nestedBlockOptions.displayEmpty){
                const nodesWithRelationships = getEntetiesWithRelationShips(diagramType);
                setFilteredData(nodesWithRelationships);
                return;
            }
            setFilteredData(data);
            return;
        }

        const filteredData: GraphData = {
            nodes: [],
            relationships: []
        };


        const filteredNodes: Entity[] = data.nodes.filter((entity) => {
            const label = entity.label || 'Unknown';
            const labelFilters = filters.get(label) || [];
            const isLabelFiltered = labelFilters.length === 0 || labelFilters.includes(entity.name);
            return isLabelFiltered;
        });

        filteredData.nodes = filteredNodes;

        filteredData.relationships = data.relationships.filter((relationship) => {
            const fromEntity = filteredNodes.find((entity) => entity.id === relationship.from);
            const toEntity = filteredNodes.find((entity) => entity.id === relationship.to);
            return fromEntity && toEntity;
        });


        // Update the options for the filters based on the filtered data
        console.log('filteredData', filteredData);
        setFilteredData(filteredData);


    }

    function displayOptionsChanged(){
        if(diagramType === 'nestedblock'){
            if(getDisplayOptions().nestedBlockOptions.displayEmpty !== displayOps.nestedBlockOptions.displayEmpty) {
                // filterGraphData('n1');
            }
        }
        setDisplayOptions(displayOps);
    }

    function onClearData(){
        resetData();
        location.reload();
    }


    function updateFiltering(){
        if(filters.values().every((v) => v.length === 0)) {
            return;
        }
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
        if(isSidebarVisible && diagramType === 'nestedblock')
        {
            updateFiltering();
        }
    });

    function openDiagramDialogue(){

        switch(diagramType) {
            case 'nestedblock':
                const currentVal = openDialogue.get('nestedblockoptions') || false;
                openDialogue.set('nestedblockoptions', !currentVal);
                break;
            case 'sunburst':
                const currentValSunBurst = openDialogue.get('sunburstoptions') || false;
                openDialogue.set('sunburstoptions', !currentValSunBurst);
                break;
            default:
                break;
        }

    }



    onMount(() => {
        // Initialize the options for the filters based on the data

        if(diagramType === 'nestedblock') {
            updateFiltering();
            const acc = getData().nodes.reduce((acc, entity) => {
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

            const labels = getLabelsForDiagram(diagramType);

            filters = new Map<string, string[]>();
            for (const label of labels) {
                filters.set(label, []);
            }
        }

        DisplayOpsStore.subscribe((data) => {
            if (data) {
                // displayOps = data;
            }
        });

    });


</script>

<div class="sidebar-container" class:sidebar-open={isSidebarVisible}>
    <div class="sidebar-buttons">
    {#if !openDialogue.values().some((v) => v)}
        <button onclick={() => goto('/')} aria-label="Start Page" data-tooltip="Go to start page" data-placement="right">
            <span class="ico ico-home"></span>
        </button>
        <button onclick={openDiagramDialogue} aria-label="Open Diagram Options" data-tooltip="Open Diagram Options" data-placement="right">
            <span class="ico" 
                class:ico-chart-donut-4={diagramType === 'sunburst'}
                class:ico-box-padding={diagramType === 'nestedblock'}
                ></span>
        </button>
        <button aria-label="edit-conditional-format" data-tooltip="Open conditional formatting" data-placement="right" onclick={() => openDialogue.set('conditionalformatting', true)} >
            <span class="ico ico-wand"></span>
        </button>
    {/if}

    </div>
</div>


<style>

    .sidebar-container {
        height: 100%;
        display: flex;
        top: 0;
        left: 0;
        max-height: 100vh;
        z-index: 1000;
        max-width: 448px;

    }

    .sidebar-buttons {
        left: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        
    }

    .sidebar-buttons>button{
        margin-bottom: 0.5rem;
    }


    .sidebar {
        display: none;
        max-width: 400px;
        height: 100%;
        background-color: #f4f4f4;
        padding: 20px;
        box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
        overflow-y: auto;
    }

    .sidebar.visible {
        display: block;
    }


</style>