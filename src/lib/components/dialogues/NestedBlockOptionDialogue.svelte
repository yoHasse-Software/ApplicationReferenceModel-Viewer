<script lang="ts">
    import { diagramOptions, emptyOptions, enteties, openDialogue } from "$lib/datastore.svelte";

    import type { RelationShipsOption } from "$lib/types";
    import { onMount } from "svelte";
    import { SvelteMap } from "svelte/reactivity";
    import { db, type DiagramOptions } from "../db/dexie";
    import Dexie from "dexie";
    

    let nestedBlockOptions: DiagramOptions = $state({
        ...emptyOptions,
        id: 2,
        diagramType: 'nestedblock',
    });
    let dialogueOnSide = $state(false);

    const dropped: string[] = $derived(nestedBlockOptions.labelHierarchy || []);


    const allowDrop = (event: DragEvent) => event.preventDefault();


    function handleDragStart(event: DragEvent, label: string) {
        event.dataTransfer?.setData('text/plain', label);
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        const label = event.dataTransfer?.getData('text/plain');
        if (label) {
            dropped.push(label);
        }
        displayOptionsChanged();
    }

    async function displayOptionsChanged() {
        console.log("displayOptionsChanged", nestedBlockOptions);

        await db.diagramOptions.put(Dexie.deepClone(nestedBlockOptions));
    }

    async function handledelete(idx: number) {
        if (idx >= 0 && idx < nestedBlockOptions.labelHierarchy.length) {
            nestedBlockOptions.labelHierarchy.splice(idx, 1);
            dropped.splice(idx, 1);
        }
    
        displayOptionsChanged();
    }

    let labelOptions: string[] = $state([]);

    onMount(async () => {
        diagramOptions.subscribe(async (data) => {
            const currentOptions = data.find((option) => option.diagramType === 'nestedblock');
            if (currentOptions) {
                nestedBlockOptions = currentOptions;
            }
            else {
                console.log("No options found, creating default options", nestedBlockOptions);
                await db.diagramOptions.add(Dexie.deepClone(nestedBlockOptions));
            }
        });

        enteties.subscribe((data) => {
            labelOptions = data.map((d) => d.label).filter((label) => label && label.length > 0).filter((label, index, self) => self.indexOf(label) === index).sort((a, b) => {
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            });
        })
    });

</script>

{#if nestedBlockOptions && openDialogue.get('nestedblockoptions')}

<dialog open class:side-dialogue={dialogueOnSide}>
    <article>
        <header style="position: sticky; top: -1rem; z-index: 1;">
            <div class="grid" style="grid-template-columns: 1fr auto; gap: 1rem; align-items: center;">
                <span style="font-size: larger">Display options for Nested block diagram</span>
                <div role="group" >
                    <button style="margin:unset;" type="button" class="outline" onclick={() => dialogueOnSide = !dialogueOnSide} aria-label="add label" data-tooltip="Toggle dialogue to side" data-placement="bottom">
                        {#if dialogueOnSide}
                            <span class="ico ico-arrow-bar-right"></span>
                        {:else}
                            <span class="ico ico-arrow-bar-left"></span>
                        {/if}
                    </button>
                    <button style="margin:unset;" type="button" class="outline" onclick={() => openDialogue.set('nestedblockoptions', false)} aria-label="add label">
                        <span class="ico ico-x"></span>
                    </button>
                </div>
            </div>
        </header>
    <div class="grid" style="grid-template-columns: auto, auto; gap: 1rem;">
        <article>
            <header>
                Heirarchy
            </header>
            <div class="grid">
                <article>
                    <header>Label options</header>
                    {#each labelOptions as lbl, idx}
                    <div
                        class="draggable"
                        draggable="true"
                        ondragstart={(e) => handleDragStart(e, lbl)}
                        role="button"
                        tabindex="0" >{lbl}</div>
                    {/each}

                </article>
                <article>
                    <header>Selected Heirarchy</header>
                    {#each nestedBlockOptions.labelHierarchy as labelName, idx}
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
                </article>

            </div>
            <article>
                <header>Root label</header>
                <label>
                    Select label to use as root:
                    <select bind:value={nestedBlockOptions.rootAtLabel} onchange={() => displayOptionsChanged()}>
                        <option value="root" selected>Root - (default)</option>
                        {#each nestedBlockOptions.labelHierarchy as label, idx}
                            <option value={label}>{label}</option>
                        {/each}
                    </select>
                    <small><em>Use to splitting the hierarchy into multiple diagrams instead of using 1 root</em></small>
                </label>
                <label>
                    Spacing:
                    <input type="range" min="1" max="50" bind:value={nestedBlockOptions.boxModel!.spacing} onchange={() => displayOptionsChanged()} data-tooltip="Spacing"/>
                    <em>Spacing {nestedBlockOptions.boxModel!.spacing} between the nodes</em>
                </label>
            </article>
        </article>
</div>
<article>
    <header>
        <span>Filtering</span>
    </header>
    <article>
        <label>
            <input type="checkbox" role="switch" 
                bind:checked={nestedBlockOptions.displayEmpty} onchange={() => displayOptionsChanged()}  /> Display Empty levels
        </label>
        <small >
            <em>If true, include models that doesn't have an application assigned.</em>
        </small>
    </article>


    
<div  class="grid" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
{#each nestedBlockOptions.labelHierarchy as lblH, idx}
<article>
    <fieldset>
        
        <label>
            <input type="checkbox" role="switch" checked={nestedBlockOptions.visibleLabels.includes(lblH)} onchange={() => {
                const isChecked = nestedBlockOptions.visibleLabels.includes(lblH);
                if (isChecked) {
                    nestedBlockOptions.visibleLabels = nestedBlockOptions.visibleLabels.filter(l => l !== lblH);
                } else {
                    nestedBlockOptions.visibleLabels = [...nestedBlockOptions.visibleLabels, lblH];
                }
                displayOptionsChanged();
            }} /> Show {lblH}
        </label>
        <label>
            Columns:
            <input type="range" min="1" max="8" bind:value={nestedBlockOptions.columnsPerLabel[lblH]} onchange={() => displayOptionsChanged()} data-tooltip={nestedBlockOptions.columnsPerLabel[lblH]}/>
            <em>Rendering {nestedBlockOptions.columnsPerLabel[lblH]} columns before line break</em>
        </label>
    </fieldset>
</article>
{/each}
</div>
</article>


</dialog>

{/if}




