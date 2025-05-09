
<script lang="ts">
    import { closeDialogueOption, defaultConditionalFormatting, isDialogueOpen} from "$lib/datastore.svelte";
    import { onMount, tick } from "svelte";
    import Rule from "../conditionalforms/Rule.svelte";
    import Base from "../conditionalforms/Base.svelte";
    import NodeStyling from "../conditionalforms/NodeStyling.svelte";
    import FontStyling from "../conditionalforms/FontStyling.svelte";
    import type { ConditionalFormatting } from "../db/dataRepository";
    import { idb } from "../db/dexie";
    import Dexie from "dexie";
    import { scale } from "svelte/transition";
    import { page } from "$app/state";
    import { SvelteMap } from "svelte/reactivity";

    const { perspectiveId, diagramId }: { perspectiveId: number, diagramId: number } = $props();

    const isOnPerspectivePage = diagramId === 0;
    let ignoredDiagramNames: string[] = $state([]);
    
    
    let detailsRefs: (HTMLDetailsElement)[] = $state([]);
    let dialogueOnSide = $state(false);
    let formattingRules: ConditionalFormatting[] = $state([]);
    let enabledRules: boolean[] = [];


    function canSaveRule(rule: ConditionalFormatting): boolean {

        // check if styling has any properties
        const hasStyling = Object.keys(rule.styling).length > 0;

        const hasStylingValues = (
            !!rule.styling?.content?.trim() || 
            !!rule.styling?.color?.isSet ||
            !!rule.styling?.backgroundColor?.isSet ||
            !!rule.styling?.borderColor?.isSet);

        const textStylesAreDefault = 
            (rule.styling?.textDecoration === 'none' 
            || rule.styling?.textDecoration === undefined)
            && (rule.styling?.fontWeight === 'normal'
            || rule.styling?.fontWeight === undefined)
            && (rule.styling?.fontStyle === 'normal'
            || rule.styling?.fontStyle === undefined);

        const styleIsSet = hasStyling && (hasStylingValues || !textStylesAreDefault);

        return rule.name?.trim().length > 0 &&
            rule.value?.trim().length > 0 &&
            rule.label?.trim().length > 0 &&
            rule.operator?.trim().length > 0 &&
            styleIsSet;
    }


    async function saveConditionalFormattningRules(index: number, id: number) {

        if (detailsRefs[index]) {
            detailsRefs[index].open = false;
        }

        const rule = formattingRules.find((rule) => rule.id === id);
        if (!rule) {
            console.error("Rule not found");
            return;
        }

        await idb.conditionalFormatting.put(Dexie.deepClone(rule));
    }

    

    async function onToggleRule(index: number, id: number) {
        const rule = formattingRules.find((rule) => rule.id === id);
        if (!rule) {
            console.error("Rule not found");
            return;
        }

        if(!rule.ignoredDiagrams) {
            console.log("Adding diagramId to ignoredDiagrams: ", rule.ignoredDiagrams);
            rule.ignoredDiagrams = [];
        }

        if(!isOnPerspectivePage && rule.ignoredDiagrams.includes(diagramId) && enabledRules[index]) {
            console.log("Removing diagramId from ignoredDiagrams: ", rule.ignoredDiagrams);
            rule.ignoredDiagrams = rule.ignoredDiagrams.filter((id) => id !== diagramId);
        }


        if(!isOnPerspectivePage && !rule.ignoredDiagrams.includes(diagramId) && !enabledRules[index]) {
            console.log("Adding diagramId from ignoredDiagrams: ", rule.ignoredDiagrams);
            rule.ignoredDiagrams.push(diagramId);
        }


        if(isOnPerspectivePage){
            rule.isEnabled = !rule.isEnabled; // Toggle the global rule
        }
        
        await idb.conditionalFormatting.put(Dexie.deepClone(rule));
    }

    async function removeConditionalFormattingRule(index: number, id: number) {
        formattingRules.splice(index, 1);

        if (detailsRefs[index]) {
            detailsRefs[index].open = false;
        }

        await idb.conditionalFormatting.delete(id);
    }

    async function ignoreRule(index: number, id: number) {
        const rule = formattingRules.find((rule) => rule.id === id);
        if (!rule) {
            console.error("Rule not found");
            return;
        }

        rule.isEnabled = false;
        await idb.conditionalFormatting.put(Dexie.deepClone(rule));
    }


    async function addRule() {
        const newRule = { ...defaultConditionalFormatting, perspectiveId };
        await idb.conditionalFormatting.put(Dexie.deepClone(newRule));
        formattingRules.push(newRule);

        await tick(); // Wait for the DOM to update before proceeding
        if (detailsRefs[formattingRules.length - 1]) {
            detailsRefs[formattingRules.length - 1].open = true;
        }
    }


    onMount(async () => {
        console.log("Conditional formatting rules: ", formattingRules);
        formattingRules = await idb.conditionalFormatting.where('perspectiveId').equals(perspectiveId).toArray();
        for(let index = 0; index < formattingRules.length; index++) {
            const rule = formattingRules[index];
            if (isOnPerspectivePage && rule.isEnabled) {
                enabledRules[index] = true;
            }
            else if (!isOnPerspectivePage && rule.ignoredDiagrams?.includes(diagramId)) {
                enabledRules[index] = false;
            } else {
                enabledRules[index] = rule.isEnabled;
            }
        }

        // TODO: Add diagrams that are ignored, below doesn't work...
        if(!isOnPerspectivePage){
            for(let index = 0; index < formattingRules.length; index++) {
                const rule = formattingRules[index];
                if(rule.ignoredDiagrams?.length > 0) {
                    const diagramNames = await idb.diagramOptions.where('id').anyOf(rule.ignoredDiagrams).toArray();
                    ignoredDiagramNames.push(...diagramNames.map((d) => d.name));
                }
            }
        }



        console.log("Conditional formatting rules: ", formattingRules);
        


    });

</script>


{#if isDialogueOpen('conditionalformatting')}

<dialog open class:side-dialogue={dialogueOnSide} transition:scale>
    <article>
        <header>
            <div class="grid" style="grid-template-columns: 1fr auto; gap: 1rem; align-items: center;">
                <span style="font-size: larger">Conditional Formatting</span>
                <div role="group" >
                    <button style="margin:unset;" type="button" class="outline" onclick={() => dialogueOnSide = !dialogueOnSide} aria-label="add label" data-tooltip="Toggle dialogue to side" data-placement="bottom">
                        {#if dialogueOnSide}
                            <span class="ico ico-arrow-bar-right"></span>
                        {:else}
                            <span class="ico ico-arrow-bar-left"></span>
                        {/if}
                    </button>
                    <button style="margin:unset;" type="button" class="outline" onclick={() => closeDialogueOption('conditionalformatting')} aria-label="add label">
                        <span class="ico ico-x"></span>
                    </button>
                </div>
            </div>
        </header>

        <article>
            <header>
                <span>Enabled Rules
                </span>
            </header>
            <small><em>
                {#if diagramId > 0}
                Following are enabled for current diagram. Disable to ignore in this specific diagram.
                {:else}
                Following are enabled for all diagrams. Disable to ignore globally for this perspective.
            {/if}
            </em></small>
            {#each formattingRules as rule, index }
                <div class="grid" style="grid-template-columns: 1fr auto; gap: 1rem; align-items: center;">
                    <label class="checkbox-label">
                        <input type="checkbox" role="switch" bind:checked={enabledRules[index]} onchange={async () => await onToggleRule(index, rule.id!)} aria-label="Enable rule" />
                        {rule.name.trim().length > 0 ? rule.name: "New rule"}
                    </label>
                </div>
            {/each}
            <div>
                {#if isOnPerspectivePage}

                <hr/>
            <small><em>Following diagrams has disabled this conditional rule</em></small>

            <div class="grid" style="grid-template-columns: repeat(4,1fr); gap: 1rem; align-items: center;">
            
            {#each ignoredDiagramNames as name}
            <div class="outline" style="display: flex;border: 1px solid var(--pico-primary);  padding: 0.5rem; border-radius: 0.5rem; background-color: var(--pico-primary-light);">
                <span style="margin:auto;">{name} (Ignored)</span>
            </div>
                    
            {/each}
            </div>
            {/if}


        </div>


        </article>

        <article>
            <header>
                <div style="display: flex; align-items: center; ">
                    <span style="font-size: larger">Rules</span> 
                    <button 
                        style="border: none; background: none; cursor: pointer; color: var(--pico-primary);"
                        aria-label="add rule"
                        data-tooltip="Add rule"
                        onclick={addRule}>
                    <span class="ico ico-copy-plus"></span>
                    </button>
                </div>
            </header>
            <div>
            {#each formattingRules as rule, index }
                <article class="rule-container" >
                    <details bind:this={detailsRefs[index]} aria-label="Display rule">
                        <summary role="button" class="outline">{rule.name.trim().length > 0 ? rule.name: "New rule"}</summary>
                        <div class="rule-content">
                            <Base bind:rule={formattingRules[index]} />
                            <Rule bind:rule={formattingRules[index]} />
                        <article>
                            <header>
                                <span>Styling</span>
                            </header>
                            <NodeStyling bind:rule={formattingRules[index]} />
                            <FontStyling bind:rule={formattingRules[index]} />
                        </article>
    
                        <div role="group">
                            <button onclick={() => saveConditionalFormattningRules(index, rule.id!)}  aria-label="Add rule"
                                disabled={canSaveRule(rule) ? false : true}>
                                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-device-floppy"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 4h10l4 4v10a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2" /><path d="M12 14m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M14 4l0 4l-6 0l0 -4" /></svg>
                            </button>
                            <button onclick={() => removeConditionalFormattingRule(index, rule.id!)} class="outline secondary" aria-label="Remove rule">
                                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-trash-x"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7h16" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /><path d="M10 12l4 4m0 -4l-4 4" /></svg>
                            </button>
                        </div>
                        {#if !canSaveRule(rule)}
                            <small>
                                <em >
                                    Rule needs either content or specific styling to be applied before it can be saved.
                                </em>
                            </small>
    
                        {/if}
                        </div>
                    </details>
                </article>
    
                {/each}
            </div>
        </article>



        <footer>

        </footer>

    </article>

</dialog>

{/if}


<style>
    dialog {
        max-width: 600px;
    }

    /* get article where first child details has attribute open and set padding */

    .rule-container{
        padding: unset;
    }


    .rule-content {
        padding: 1rem;
    }

    fieldset.grid {
        grid-template-columns: repeat(auto-fill, minmax('auto', 1fr));
        
    }

</style>