<script lang="ts">
    import { goto } from "$app/navigation";
    import type { Perspective } from "$lib/components/db/dataRepository";
    import { idb } from "$lib/components/db/dexie";
    import { currentViewState, toggleDialogueOption } from "$lib/datastore.svelte";
    import { liveQuery } from "dexie";
    import { onMount } from "svelte";


    const loadedEnteteies = liveQuery(
        () => idb.enteties.count()
    );

    onMount(async () => {

    });

</script>

{#if $loadedEnteteies > 0}
<button class="article-button" aria-label="data-options" data-placement="right" onclick={() => toggleDialogueOption('datastoreoptions')} >
    <article >
        <header>Modify Data</header>
        <small><em>Click here to upload, delete, or modify your data.</em></small>
    </article>
</button>

{:else}
<div style="height: 100%;">
    <article class="welcome-article">
        <header>
            Welcome to the Data Analysis Tool!
        </header>
        <p>It seems like you haven't uploaded any dataset yet. To get started, please upload some data.</p>
        <button class="" style="width: 100%;" onclick={() => {
            toggleDialogueOption('datastoreoptions');
        }}>Upload data</button>
        <small>Once you have created a data entity, you can come back here to create perspectives and analyze your data.</small>
    </article>
    </div>
{/if}




<style>

    .welcome-article {
        position: absolute; 
        top: 0; 
        left: 0; 
        bottom: 0; 
        right: 0; 
        max-width: 600px; 
        max-height: 400px; 
        margin: auto; 
        height: fit-content;
    }
    
    .diagram {
        background-size: contain;
        display: block;
        width: 100%;
        min-height: 250px;
    }

    .sunburst {
        background: url('/icons/sunburst.svg') no-repeat center;
    }

    .nestedblock {
        background: url('/icons/nestedblock.svg') no-repeat center;
    }

    .diagramSelectOption {
        text-decoration: none;
        text-align: center;
        padding: 0;
    }
    
    article {
        border: 1px solid var(--pico-contrast);
        height: 100%;
    }
</style>

