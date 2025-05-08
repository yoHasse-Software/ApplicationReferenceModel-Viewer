
<script lang="ts">
    import { page } from "$app/state";
    import { closeDialogueOption, diagramSelectOptions, emptyOptions, isDialogueOpen } from "$lib/datastore.svelte";
    import Dexie from "dexie";
    import { idb } from "../db/dexie";
    import type { DiagramOptions } from "../db/dataRepository";
    import { scale } from "svelte/transition";

    const perspectiveId = parseInt(page.params.id, 10); // Get the perspective ID from the URL parameters

    let baseDiagramOptions: DiagramOptions = $state({...emptyOptions, perspectiveId, diagramType: 'none'});
    let dialogueOnSide = $state(false);


    async function onSave() {
        if (baseDiagramOptions.diagramType === 'none') {
            return;
        }
        await idb.diagramOptions.add(Dexie.deepClone(baseDiagramOptions));
        closeDialogueOption('diagramoptioncreate');
    }




</script>


{#if isDialogueOpen('diagramoptioncreate')}
<dialog open class:side-dialogue={dialogueOnSide} transition:scale>
    <article>
        <header style="position: sticky; top: -1rem; z-index: 1;">
            <div class="grid" style="grid-template-columns: 1fr auto; gap: 1rem; align-items: center;">
                <span style="font-size: larger">Add diagram</span>
                
                <div role="group" >
                    <button style="margin:unset;" type="button" class="outline" onclick={() => dialogueOnSide = !dialogueOnSide} aria-label="add label" data-tooltip="Toggle dialogue to side" data-placement="bottom">
                        {#if dialogueOnSide}
                            <span class="ico ico-arrow-bar-right"></span>
                        {:else}
                            <span class="ico ico-arrow-bar-left"></span>
                        {/if}
                    </button>
                    <button style="margin:unset;" type="button" class="outline" onclick={() => closeDialogueOption('diagramoptioncreate')} aria-label="add label">
                        <span class="ico ico-x"></span>
                    </button>
                </div>
            </div>
        </header>

        <label for="diagramName" >
            Diagram Name
        </label>
        <input type="text" bind:value={baseDiagramOptions.name} class="input" placeholder="Diagram name" aria-label="Diagram name" data-tooltip="Enter diagram name" data-placement="bottom">
        <small><em>Give your diagram a meaningful name.</em></small>

        <label for="diagramDescription" >
            Diagram Description
        </label>
        <input type="text" bind:value={baseDiagramOptions.description} class="input" placeholder="Diagram description" aria-label="Diagram description" data-tooltip="Enter diagram description" data-placement="bottom">
        <small><em>Provide a brief description of the diagram.</em></small>

            <label for="diagramType" >
                Diagram Type
            </label>
            <select bind:value={baseDiagramOptions.diagramType} class="select" aria-label="Select diagram type" data-tooltip="Select diagram type" data-placement="bottom">
                <option value="" disabled selected>Select a diagram type</option>
                {#each diagramSelectOptions as option}
                    <option value={option}>{option}</option>
                {/each}
            </select>
            <small><em>Choose a diagram type to visualize your data.</em></small>

        <button class="button" type="button" onclick={onSave} aria-label="save diagram option" data-tooltip="Save diagram option" data-placement="bottom">
            <span class="ico ico-save"></span> Save
        </button>


    </article>
</dialog>

{/if}