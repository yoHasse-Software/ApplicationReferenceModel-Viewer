<script lang="ts">
    import { DisplayOpsStore, FilterDataStore, getDisplayOptions, openDialogue, setDisplayOptions } from "$lib/datastore.svelte";

    import type { NestedBlockOptions, RelationShipsOption } from "$lib/types";
    import { onMount } from "svelte";
    import { buildRelationShipMap } from "./optionsUtils";
    import { SvelteMap } from "svelte/reactivity";

    let nestedBlockOptions: NestedBlockOptions = $derived(getDisplayOptions().nestedBlockOptions || {});
    const relationShipOptions = new SvelteMap<string, RelationShipsOption[]>();

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
    }

    function handledelete(idx: number) {
        if (idx >= 0 && idx < nestedBlockOptions.labelHierarchy.length) {
            nestedBlockOptions.labelHierarchy.splice(idx, 1);
            dropped.splice(idx, 1);
            displayOptionsChanged();
        }
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
            .filter((label) => nestedBlockOptions.labelHierarchy.some(l => l === label) ? false : true)
            .sort((a, b) => {
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            });
    };


    function displayOptionsChanged() {
        const currentOptions = getDisplayOptions();
        currentOptions.nestedBlockOptions = nestedBlockOptions;
        setDisplayOptions(currentOptions);
    }

    onMount(() => {
        FilterDataStore.subscribe((data) => {
            if (data) {
                const map = buildRelationShipMap(data);
                map.forEach((value, key) => {
                    relationShipOptions.set(key, value);
                });
            }
        });

        DisplayOpsStore.subscribe((data) => {
            if (data) {
                
            }
        });
    });

</script>

{#if nestedBlockOptions && openDialogue.get('nestedblockoptions')}

<dialog open>
    <article>
        <header style="position: sticky; top: -1rem; z-index: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: larger">Display options for Nested block diagram</span>
                <button style="margin:unset;" type="button" class="outline" onclick={() => openDialogue.set('nestedblockoptions', false)} aria-label="add label">
                    <span class="ico ico-x"></span>
                </button>
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
                    <input type="range" min="1" max="50" bind:value={nestedBlockOptions.boxModel.spacing} onchange={() => displayOptionsChanged()} data-tooltip="Spacing"/>
                    <em>Spacing {nestedBlockOptions.boxModel.spacing} between the nodes</em>
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

