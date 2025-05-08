<script lang="ts">
    import { closeDialogueOption, defaultPerspective, isDialogueOpen } from "$lib/datastore.svelte";
    import { onMount, tick } from "svelte";
    import { idb } from "../db/dexie"
    import Dexie from "dexie";
    import { scale } from "svelte/transition";
    
    let dialogueOnSide = $state(false);

    const perspective = $state(defaultPerspective);

    const dropped: string[] = $derived(perspective.selectedLabels || []);
    let allLabels: string[] = $state([]);



    const allowDrop = (event: DragEvent) => event.preventDefault();


    function handleDragStart(event: DragEvent, label: string) {
        event.dataTransfer?.setData('text/plain', label);
    }

    async function handleDrop(event: DragEvent) {
        event.preventDefault();
        const label = event.dataTransfer?.getData('text/plain');
        if (label) {
            dropped.push(label);
            await tick();
            await updateLabelOptions();
        }
    }

    async function handledelete(idx: number) {
        if (idx >= 0 && idx < perspective.selectedLabels.length) {
            perspective.selectedLabels.splice(idx, 1);
            dropped.splice(idx, 1);
            await tick();
            await updateLabelOptions();
        }
    }

    let labelOptions: string[] = $state([]);

    async function updateLabelOptions() {
            labelOptions = allLabels
                .map((d) => d as string)
                .filter((label) => label && label.length > 0)
                .filter((label) => perspective.selectedLabels.indexOf(label) === -1)
                .filter((label, index, self) => self.indexOf(label) === index)
                .sort((a, b) => {
                    if (a < b) return -1;
                    if (a > b) return 1;
                    return 0;
                });
            return;
    }

    async function savePerspective() {
        if (!perspective.name || perspective.name.length === 0) {
            console.error("No name provided for the perspective");
            return;
        }
        await idb.perspectives.add(Dexie.deepClone(perspective));
        closeDialogueOption('visualization');

    }

    let labelSearch = $state('');

    onMount(async () => {
        allLabels = (await idb.enteties.orderBy('label').uniqueKeys()).map((d) => d as string);

        await updateLabelOptions();

    });

</script>

{#if perspective && isDialogueOpen('visualization')}

<dialog open class:side-dialogue={dialogueOnSide} transition:scale>
    <article>
        <header style="position: sticky; top: -1rem; z-index: 1;">
            <div class="grid" style="grid-template-columns: 1fr auto; gap: 1rem; align-items: center;">
                <span style="font-size: larger">Create Perspective</span>
                <div role="group" >
                    <button style="margin:unset;" type="button" class="outline" onclick={() => dialogueOnSide = !dialogueOnSide} aria-label="add label" data-tooltip="Toggle dialogue to side" data-placement="bottom">
                        {#if dialogueOnSide}
                            <span class="ico ico-arrow-bar-right"></span>
                        {:else}
                            <span class="ico ico-arrow-bar-left"></span>
                        {/if}
                    </button>
                    <button style="margin:unset;" type="button" class="outline" onclick={() => closeDialogueOption('visualization')} aria-label="add label">
                        <span class="ico ico-x"></span>
                    </button>
                </div>
            </div>
        </header>
        <article>
            <header>
                <span>General settings</span>
            </header>
            <input type="text" bind:value={perspective.name} placeholder="Name of the perspective" aria-label="name of the visualization" />
            <small><em>Give a name to the perspective to better identify what it contains</em></small>
        </article>
        <div class="grid">
            <article class="heirarchy-options-article">
                <header>Available labels</header>
                <p><em>Select labels that will be used for this perspective</em></p>

                <div class="grid">
                <div>
                    <input type="search" bind:value={labelSearch} placeholder="Search for label" aria-label="search for label" data-tooltip="Search for label" data-placement="bottom" />
                    <div class="heirarchy-options">
                    {#each labelOptions.filter((opt) => opt.toLowerCase().includes(labelSearch.toLowerCase())) as lbl, idx}
                    <div
                        class="draggable"
                        draggable="true"
                        ondragstart={(e) => handleDragStart(e, lbl)}
                        role="button"
                        tabindex="0" >{lbl}</div>
                    {/each}
                    </div>
                </div>
                <div>
                    <div
                        class="droppable"
                        ondragover={allowDrop}
                        ondrop={handleDrop}
                        role="button"
                        tabindex="0" ><small><em>Drop next here</em></small>
                    </div>
                    <div class="heirarchy-options">
                        {#each perspective.selectedLabels as labelName, idx}
                            <div
                                class="dropped"
                                role="button"
                                tabindex="0" >{labelName}
                                <button type="button" class="outline" onclick={() => handledelete(idx)} aria-label="remove label">
                                    <span class="ico ico-trash"></span>
                                </button>
                            </div>
                        {/each}
 
                    </div>

                </div>
            </div>
 

            </article>

        </div>

        <article>
            <header>Actions</header>
            <button type="button" class="" onclick={() => savePerspective()}>Save</button>
            <button type="button" class="outline" onclick={() => closeDialogueOption('visualization')}>Cancel</button>
        </article>
</dialog>

{/if}

<style>

</style>




