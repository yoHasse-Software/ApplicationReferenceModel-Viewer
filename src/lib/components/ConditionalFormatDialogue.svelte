
<script lang="ts">
    import { ConditionalFormattingStore, getLabels, setConditionalFormattingRules } from "$lib/datastore.svelte";
    import type { ConditionalFormatting } from "$lib/types";
    import { onMount } from "svelte";
    import Rule from "./conditionalforms/Rule.svelte";
    import Base from "./conditionalforms/Base.svelte";
    import NodeStyling from "./conditionalforms/NodeStyling.svelte";
    import FontStyling from "./conditionalforms/FontStyling.svelte";

    const { 
        isOpen,
        onClose,
     } = $props();

    
    let detailsRefs: (HTMLDetailsElement | null)[] = $state([]);

    let labels: string[] = $state([]);


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

    onMount(() => {
        labels = getLabels();

        ConditionalFormattingStore.subscribe((data) => {
            if (data) {
                formattingRules = data;
            }
        });
    });

</script>



<dialog open={isOpen ? true : null}>

    <article>
        <header>
            <h1>Conditional Formatting</h1>
        </header>

        <div>
            <h3>Conditional Formatting</h3>
            {#each formattingRules as rule, index (rule.id || index)}
                <details bind:this={detailsRefs[index]} aria-label="Display rule">
                    <summary role="button" class="outline">{rule.name.trim().length > 0 ? rule.name: "New rule"}</summary>
                <div>
                        <Base {rule} labels={labels} />
                    <hr />
                        <Rule {rule} labels={labels} />
                    <hr />
                        <NodeStyling {rule} labels={labels} />
                    <hr />
                        <FontStyling {rule} labels={labels} />
                    <hr />
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

            {/each}
        </div>

        <footer>
            <div role="group">
                <button  onclick={() => formattingRules.push({
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
                })}>Add Rule</button>
                <button class="outline secondary" onclick={onClose}>Close</button>
            </div>
        </footer>

    </article>

</dialog>


<style>
    dialog {
        max-width: 600px;
    }


    fieldset.grid {
        grid-template-columns: repeat(auto-fill, minmax('auto', 1fr));
        
    }

</style>