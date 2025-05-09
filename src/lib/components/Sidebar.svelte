
<script lang="ts">
    import { currentViewState, isDialogueOpen, openDialogueOption, toggleDialogueOption } from "$lib/datastore.svelte";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { fly } from "svelte/transition";

    const perspectiveId = $derived(parseInt(page.params.id || '0', 10)); // Get the perspective ID from the URL parameters
    const diagramid = $derived(parseInt(page.params.diagramid || '0', 10)); // Get the diagram ID from the URL parameters


    let isSidebarVisible = $state(false);
    let darkmode = $state(false);


    function openDiagramDialogue(){

        switch(currentViewState.currentDiagramType) {
            case 'nestedblock':
                toggleDialogueOption('nestedblockoptions');
                break;
            case 'sunburst':
                toggleDialogueOption('sunburstoptions');
                break;
            default:
                break;
        }

    }

    function openDataDialogue() {
        toggleDialogueOption('datastoreoptions');
    }   

    function toggleTheme() {
		darkmode = !darkmode;
		const theme = darkmode ? 'dark' : 'light';
		document.documentElement.dataset.theme = theme;
		document.cookie = `theme=${theme}; path=/; max-age=31536000`;
        if(diagramid > 0){
            location.reload();
        }
	}

    function backupUrl() {
        if(diagramid > 0 && perspectiveId > 0) {
            return `/perspectives/${perspectiveId}`;
        } else if(perspectiveId > 0) {
            return `/perspectives`;
        } else {
            return '/';
        }
    };


    onMount(() => {
        // Initialize the options for the filters based on the data
        darkmode = document.documentElement.dataset.theme === 'dark';

        
    });

    $effect(() => {
        perspectiveId;
        diagramid;
    })


</script>

<div class="sidebar-container" class:closed={isDialogueOpen()} class:sidebar-open={isSidebarVisible}>
    {#if !isDialogueOpen()}

    <div class="sidebar-buttons" transition:fly={{ x: -20}}>

        <button disabled={page.url.pathname === '/' ? true : null} class:outline={page.url.pathname === '/'} onclick={() => goto('/')} aria-label="Start Page" data-tooltip="Go to start page" data-placement="right">
            <span class="ico ico-home"></span>
        </button>
        <button disabled={page.url.pathname === '/' ? true : null}  onclick={() => goto(backupUrl())} aria-label="Go Back" data-tooltip="Go Back" data-placement="right" >
            <span class="ico ico-arrow-narrow-left"></span>
        </button>

        <button onclick={() => goto('/perspectives')} class:outline={page.url.pathname.startsWith('/perspectives')} aria-label="Perspectives" data-tooltip="Go to perspectives" data-placement="right">
            <span class="ico ico-eye-search"></span>
        </button>

        <hr/>

        
        <button disabled={currentViewState.currentDiagramType === 'none' ? true : null} onclick={openDiagramDialogue} aria-label="Open Diagram Options" data-tooltip="Open Diagram Options" data-placement="right">
            <span class="ico"
                class:ico-chart-donut-4={currentViewState.currentDiagramType === 'sunburst'}
                class:ico-box-padding={currentViewState.currentDiagramType === 'nestedblock'}
                class:ico-chart-bar-3={currentViewState.currentDiagramType === 'none'}></span>
        </button>


        <button disabled={perspectiveId > 0 ? null : true} aria-label="edit-conditional-format" data-tooltip="Open conditional formatting" data-placement="right" onclick={() => openDialogueOption('conditionalformatting')} >
            <span class="ico ico-wand"></span>
        </button>


        <button aria-label="theme" data-tooltip="Toggle theme" data-placement="right" onclick={toggleTheme} >
            <span class="ico" class:ico-moon={darkmode} class:ico-sun={!darkmode} ></span>
        </button>

    </div>
    {/if}

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
        min-width: 4rem;
    }

    .sidebar-container.closed {
        pointer-events: none;
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