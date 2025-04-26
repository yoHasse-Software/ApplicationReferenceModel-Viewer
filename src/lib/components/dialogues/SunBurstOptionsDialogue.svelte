
<script lang="ts">
    import { DisplayOpsStore, FilterDataStore, getData, getDisplayOptions, openDialogue, setDisplayOptions } from "$lib/datastore.svelte";
    import type { RelationShipsOption, SunBurstOptions } from "$lib/types";
    import { lab } from "d3";
    import { onMount } from "svelte";
    import { SvelteMap } from "svelte/reactivity";
    import { buildRelationShipMap } from "./optionsUtils";


    let sunBurstOptions: SunBurstOptions = $derived(getDisplayOptions().sunBurstOptions || {});
    const relationShipOptions = new SvelteMap<string, RelationShipsOption[]>();
    let dialogueOnSide = $state(false);

    const dropped: string[] = $derived(sunBurstOptions.labelHierarchy || []);

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
    }

    function handledelete(idx: number) {
        if (idx >= 0 && idx < sunBurstOptions.labelHierarchy.length) {
            sunBurstOptions.labelHierarchy.splice(idx, 1);
            dropped.splice(idx, 1);
            displayOptionsChanged();
        }
    }


    function displayOptionsChanged() {
        console.log("displayOptionsChanged", sunBurstOptions);
        const currentOptions = getDisplayOptions();
        currentOptions.sunBurstOptions = sunBurstOptions;
        setDisplayOptions(currentOptions);
    }
     
     function getLabelOptions() : string[] {

        const relationShipLabels = Array.from(relationShipOptions.values());
        return relationShipLabels
            .flatMap((rel) => rel)
            .flatMap((rel) => {
                if (rel.fromLabel && rel.toLabel) {
                    return [rel.fromLabel, rel.toLabel];
                } else if (rel.fromLabel) {
                    return [rel.fromLabel];
                } else if (rel.toLabel) {
                    return [rel.toLabel];
                }
                return [];
            })
            .filter((label, index, self) => label && self.indexOf(label) === index)
            .filter((label) => sunBurstOptions.labelHierarchy.some(l => l === label) ? false : true)
            .sort((a, b) => {
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            });
     };


     onMount(() => {
        FilterDataStore.subscribe((data) => {
            if (data) {
                const newRelMap = buildRelationShipMap(data);
                relationShipOptions.clear();
                newRelMap.forEach((rel, key) => {
                    relationShipOptions.set(key, rel);
                });
            }
        });

        DisplayOpsStore.subscribe((data) => {
            if (data) {
                
            }
        });
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
                    {#each getLabelOptions() as lbl, idx}
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
                </article>

            </div>
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
