
<script lang="ts">
    import {  diagramOptions, emptyOptions, enteties, openDialogue } from "$lib/datastore.svelte";
    import type { RelationShipsOption } from "$lib/types";
    import { lab } from "d3";
    import { onMount, tick } from "svelte";
    import { SvelteMap } from "svelte/reactivity";
    import { db, getAllLabels, labelsRelationShips, type DiagramOptions, type LabelRelationShips } from "../db/dexie";
    import Dexie from "dexie";


    let sunBurstOptions: DiagramOptions = $state({
        ...emptyOptions,
        id: 1,
        diagramType: 'sunburst',
    });
    let labelOptions: string[] = $state([]);

    const relationShipOptions = new SvelteMap<string, RelationShipsOption[]>();
    let labelToLabelRelationShips: LabelRelationShips[] = $state([]);
    let dialogueOnSide = $state(false);

    const dropped: string[] = $derived(sunBurstOptions.labelHierarchy || []);

    const allowDrop = (event: DragEvent) => event.preventDefault();

    function handleDragStart(event: DragEvent, label: string) {
        event.dataTransfer?.setData('text/plain', label);
    }

    async function handleDrop(event: DragEvent) {
        event.preventDefault();
        const label = event.dataTransfer?.getData('text/plain');
        if (label) {
            dropped.push(label);
            sunBurstOptions.visibleLabels.push(label);
            await tick();
            await updateLabelOptions();
        }
        await displayOptionsChanged();
    }

    async function handledelete(idx: number) {
        if (idx >= 0 && idx < sunBurstOptions.labelHierarchy.length) {
            sunBurstOptions.labelHierarchy.splice(idx, 1);
            dropped.splice(idx, 1);
            await tick();
            await updateLabelOptions();
            await displayOptionsChanged();
        }
    }

    function getRelatedOptions(label: string) {
        return labelToLabelRelationShips.filter((rel) => rel.fromLabel === label || rel.toLabel === label) || [];
    }

    async function updateLabelOptions() {
        if(sunBurstOptions.labelHierarchy.length === 0){
            const allLabels = await getAllLabels();
            labelOptions = allLabels
                .map((d) => d as string)
                .filter((label) => label && label.length > 0)
                .filter((label) => sunBurstOptions.labelHierarchy.indexOf(label) === -1)
                .filter((label, index, self) => self.indexOf(label) === index)
                .sort((a, b) => {
                    if (a < b) return -1;
                    if (a > b) return 1;
                    return 0;
                });
            return;
        }

        labelToLabelRelationShips = await labelsRelationShips(sunBurstOptions.labelHierarchy);

        const lastLabelInHierarchy = sunBurstOptions.labelHierarchy[sunBurstOptions.labelHierarchy.length - 1];
        const relatedOptions = getRelatedOptions(lastLabelInHierarchy).flatMap((rel => [rel.fromLabel, rel.toLabel]));

        labelOptions = relatedOptions
            .filter((label) => label && label.length > 0)
            .filter((label) => sunBurstOptions.labelHierarchy.indexOf(label) === -1)
            .filter((label, index, self) => self.indexOf(label) === index)
            .sort((a, b) => {
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            });
    }



    async function displayOptionsChanged() {
        await db.diagramOptions.put(Dexie.deepClone(sunBurstOptions));
    }

     onMount(() => {
        diagramOptions.subscribe(async (state) => {
            const currentOptions = state.find((option) => option.diagramType === 'sunburst');
            if (currentOptions) {
                sunBurstOptions = currentOptions;
            }
            else {
                await db.diagramOptions.add(Dexie.deepClone(sunBurstOptions));
            }
        });

        enteties.subscribe(async (data) => {
            await updateLabelOptions();
        })
     });
     

</script>

{#if sunBurstOptions && openDialogue.get('sunburstoptions')}
<dialog open class:side-dialogue={dialogueOnSide}>
    <article>
        <header style="position: sticky; top: -1rem; z-index: 1;">
            <div class="grid" style="grid-template-columns: 1fr auto; gap: 1rem; align-items: center;">
                <span style="font-size: larger">Display options for Sunburst diagram</span>
                <div role="group" >
                    <button style="margin:unset;" type="button" class="outline" onclick={() => dialogueOnSide = !dialogueOnSide} aria-label="add label" data-tooltip="Toggle dialogue to side" data-placement="bottom">
                        {#if dialogueOnSide}
                            <span class="ico ico-arrow-bar-right"></span>
                        {:else}
                            <span class="ico ico-arrow-bar-left"></span>
                        {/if}
                    </button>
                    <button style="margin:unset;" type="button" class="outline" onclick={() => openDialogue.set('sunburstoptions', false)} aria-label="add label">
                        <span class="ico ico-x"></span>
                    </button>
                </div>
            </div>
        </header>
        <article>
            <header>
                Heirarchy
            </header>
            <div class="grid">
                <article>
                    <header>Label options</header>
                    <div class="heirarchy-options">
                    
                    {#each labelOptions as lbl, idx}
                    <div
                        class="draggable"
                        draggable="true"
                        ondragstart={(e) => handleDragStart(e, lbl)}
                        role="button"
                        tabindex="0" >{lbl}</div>
                    {/each}
                    </div>
                </article>
                <article>
                    <header>Selected Heirarchy</header>
                    <div class="heirarchy-options">

                    {#each sunBurstOptions.labelHierarchy as labelName, idx}
                        <div
                            class="dropped"
                            role="button"
                            tabindex="0" >{labelName}
                            <button type="button" class="outline" onclick={() => handledelete(idx)} aria-label="remove label">
                               <span class="ico ico-trash"></span>
                            </button>
                        </div>
                    {/each}
                    <div
                        class="droppable"
                        ondragover={allowDrop}
                        ondrop={handleDrop}
                        role="button"
                        tabindex="0" ><small><em>Drop next here</em></small></div>
                    </div>
                </article>

            </div>
            <article>
                <header>Relationship Modification</header>
                {#each sunBurstOptions.labelHierarchy as label, idx}
                    {#if idx > 0 && idx + 1 <= sunBurstOptions.labelHierarchy.length}
                    <article>
    
                        <div class="grid" style="grid-template-columns: 1fr auto 1fr; gap: 1rem;">
                            {sunBurstOptions.labelHierarchy[idx-1]} <select bind:value={sunBurstOptions.hierarchyRelMod[idx-1]} onchange={() => displayOptionsChanged()}>
                                {#each labelToLabelRelationShips.filter((rel) => rel.fromLabel === sunBurstOptions.labelHierarchy[idx-1] && rel.toLabel === sunBurstOptions.labelHierarchy[idx]) as rel, idx}
                                    <option value={rel.relationshipType}>
                                        {#if rel.relationshipType === '->'}
                                        &rarr;
                                        {:else if rel.relationshipType === '<-'}
                                        &larr;
                                        {:else}
                                        &harr;
                                        {/if}
                                    </option>
                                {/each}
                            </select> {sunBurstOptions.labelHierarchy[idx]}
                        </div>
                    </article>
                    {/if}
                {/each}
                <small><em>Use to modify the relationship between the labels in the heirarchy</em></small>
        </article>


    <article>
        <header>
            Root options
        </header>
        <div class="grid">
            <label>
                Select label to use as root:
                <select bind:value={sunBurstOptions.rootAtLabel} onchange={() => displayOptionsChanged()}>
                    <option value="root" selected>Root - (default)</option>
                    {#each sunBurstOptions.labelHierarchy as label, idx}
                        <option value={label}>{label}</option>
                    {/each}
                </select>
                <small><em>Use to splitting the hierarchy into multiple diagrams instead of using 1 root</em></small>
            </label>
            <label>
                Total root Columns: {sunBurstOptions.rootColumns}
                <input type="range" min="1" max="8" bind:value={sunBurstOptions.rootColumns} onchange={() => displayOptionsChanged()} data-tooltip={sunBurstOptions.rootColumns}/>
                <small><em>If root is an array, choose how many diagrams to render on the same row. </em></small>
            </label>
            <label>
                <input type="checkbox" role="switch" 
                    bind:checked={sunBurstOptions.displayEmpty} onchange={() => displayOptionsChanged()}  /> Display Empty levels
            </label>
            <small >
                <em>If true, include models that doesn't have an application assigned.</em>
            </small>
        </div>

    </article>
    </article>

</dialog>
{/if}

<style>
    .grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }




</style>
