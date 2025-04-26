
<script lang="ts">
    import { ConditionalFormattingStore, getData, openDialogue, setConditionalFormattingRules } from "$lib/datastore.svelte";
    import type { ConditionalFormatting } from "$lib/types";
    import { onMount } from "svelte";
    import Rule from "../conditionalforms/Rule.svelte";
    import Base from "../conditionalforms/Base.svelte";
    import NodeStyling from "../conditionalforms/NodeStyling.svelte";
    import FontStyling from "../conditionalforms/FontStyling.svelte";

    
    let detailsRefs: (HTMLDetailsElement | null)[] = $state([]);
    let dialogueOnSide = $state(false);

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


    function saveConditionalFormattningRules(index: number) {

        if (detailsRefs[index]) {
            detailsRefs[index].open = false;
        }

        setConditionalFormattingRules(formattingRules);
    }

    function removeConditionalFormattingRule(index: number) {
        formattingRules.splice(index, 1);

        setConditionalFormattingRules(formattingRules);
        
    }

    let formattingRules: ConditionalFormatting[] = $state([]);

    function addRule() {
        formattingRules.push({
            id: crypto.randomUUID(),
            name: '',
            label: '',
            value: '',
            metadataKey: '',
            operator: 'equals',
            styling: {
                backgroundColor: {
                    isSet: false,
                    color: '#ffffff',
                },
                color: {
                    isSet: false,
                    color: '#000000',
                },
                borderColor: {
                    isSet: false,
                    color: '#000000',
                },
            },
        });
    }


    onMount(() => {
        ConditionalFormattingStore.subscribe((data) => {
            if (data) {
                formattingRules = data;
            }
        });
    });

</script>


{#if openDialogue.get('conditionalformatting') || false}

<dialog open class:side-dialogue={dialogueOnSide}>
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
                    <button style="margin:unset;" type="button" class="outline" onclick={() => openDialogue.set('conditionalformatting', false)} aria-label="add label">
                        <span class="ico ico-x"></span>
                    </button>
                </div>
            </div>
        </header>

        <div>
            <div style="display: flex; align-items: center; margin: 1rem 0;">
                <span style="font-size: larger">Rules</span> 

                <button 
                    style="border: none; background: none; cursor: pointer; color: var(--pico-primary);"
                    aria-label="add rule"
                    data-tooltip="Add rule"
                    onclick={addRule}>
                <span class="ico ico-copy-plus"></span>
                </button>
            </div>
            
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
                        <button onclick={() => saveConditionalFormattningRules(index)}  aria-label="Add rule"
                            disabled={canSaveRule(rule) ? false : true}>
                            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-device-floppy"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 4h10l4 4v10a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2" /><path d="M12 14m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M14 4l0 4l-6 0l0 -4" /></svg>
                        </button>
                        <button onclick={() => removeConditionalFormattingRule(index)} class="outline secondary" aria-label="Remove rule">
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