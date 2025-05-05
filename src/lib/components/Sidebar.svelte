
<script lang="ts">
    import { openDialogue } from "$lib/datastore.svelte";
    import { type DiagramTypes } from "$lib/types";
    import { onMount } from "svelte";
    import { page } from '$app/state';
    import { goto } from "$app/navigation";
    import { db } from "./db/dexie";


    let isSidebarVisible = $state(false);
    let filters: Map<string, string[]> = $state(new Map<string, string[]>);

    const diagramType: DiagramTypes = $derived((page.url.pathname.replace('/', '') as DiagramTypes) || 'none');

    export function toggleSideBar() {
        isSidebarVisible = !isSidebarVisible;
    }


    function onClearData(){
        db.enteties.clear();
        db.relationships.clear();
        db.diagramOptions.clear();
        db.conditionalFormatting.clear();
        location.reload();
    }


    function updateFiltering(){
        if(filters.values().every((v) => v.length === 0)) {
            return;
        }
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

    });


</script>

<div class="sidebar-container" class:sidebar-open={isSidebarVisible}>
    <div class="sidebar-buttons">
    {#if !openDialogue.values().some((v) => v)}
        <button onclick={() => goto('/')} aria-label="Start Page" data-tooltip="Go to start page" data-placement="right">
            <span class="ico ico-home"></span>
        </button>

        {#if diagramType !== 'none'}
        <button onclick={openDiagramDialogue} aria-label="Open Diagram Options" data-tooltip="Open Diagram Options" data-placement="right">
            <span class="ico" 
                class:ico-chart-donut-4={diagramType === 'sunburst'}
                class:ico-box-padding={diagramType === 'nestedblock'}
                ></span>
        </button>
        {/if}
        <button aria-label="edit-conditional-format" data-tooltip="Open conditional formatting" data-placement="right" onclick={() => openDialogue.set('conditionalformatting', true)} >
            <span class="ico ico-wand"></span>
        </button>
        <button aria-label="data-options" data-tooltip="Data options" data-placement="right" onclick={() => goto('/loadData')} >
            <span class="ico ico-database"></span>
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