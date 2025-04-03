
<script lang="ts">
    import { ConditionalFormattingRules, initConditionalFormattingRules, saveConditionalFormattingRulesToStorage } from "$lib/datastore.svelte";
    import type { ConditionalFormatting, RuleOperator } from "$lib/types";
    import { onMount } from "svelte";

    const { 
        columnHeaders,
        isOpen,
        onClose,
     } = $props();

    
    let detailsRefs: (HTMLDetailsElement | null)[] = $state([]);


    const RuleOperatoruleOptions: RuleOperator[] = [
        'equals',
        'contains',
        'startsWith',
        'endsWith',
        'greaterThan',
        'lessThan',
        'between',
        'notEquals',
        'notContains',
        'notStartsWith',
        'notEndsWith',
    ];

    function canSaveRule(rule: ConditionalFormatting): boolean {

        // check if styling has any properties
        const hasStyling = Object.keys(rule.styling).length > 0;

        const hasStylingValues = (
            !!rule.styling?.content?.trim() || 
            !!rule.styling?.color?.isSet ||
            !!rule.styling?.backgroundColor?.isSet);

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
            rule.column?.trim().length > 0 &&
            rule.operator?.trim().length > 0 &&
            styleIsSet;
    }


    function saveConditionalFormattningRules(index: number) {

        if (detailsRefs[index]) {
            detailsRefs[index].open = false;
        }

        saveConditionalFormattingRulesToStorage();
    }

    function removeConditionalFormattingRule(index: number) {
        ConditionalFormattingRules.splice(index, 1);

        localStorage.setItem('ConditionalFormattingRules', JSON.stringify(ConditionalFormattingRules));
    }



    onMount(() => {
        initConditionalFormattingRules()
    });

</script>



<dialog open={isOpen ? true : null}>

    <article>
        <header>
            <h1>Conditional Formatting</h1>
        </header>

        <div>
            <h3>Conditional Formatting</h3>
            {#each ConditionalFormattingRules as rule, index (rule.id || index)}
                <details bind:this={detailsRefs[index]} aria-label="Display rule">
                    <summary role="button" class="outline">{rule.name.trim().length > 0 ? rule.name: "New rule"}</summary>
                <div>
                    <h4>Base</h4>
                    <fieldset class="grid">
                    <label>
                        <span class="required"></span>Name:
                        <input type="text" 
                            bind:value={rule.name} 
                            placeholder="Rule Name" />
                        <small >
                            <em>Rule name to identify the rule.</em>
                        </small>
                    </label>
                    
                    <label>
                        Text/Emoji:
                        <input type="text" bind:value={rule.styling.content} />
                        <small >
                            <em>Optional content or emoji to display on the right of the application name when rule is applied.</em>
                        </small>
                    </label>
                    </fieldset>
                    <hr />
                    <h4>Rule</h4>
                    <fieldset class="grid">
                    <label>
                        <span class="required"></span>Column:
                        <select bind:value={rule.column}>
                            {#each columnHeaders as col}
                                <option value={col}>{col}</option>
                            {/each}
                        </select>
                        <small >
                            <em>The column to which the rule applies.</em>
                        </small>
                    </label>
                    <label>
                        <span class="required"></span>Operator:
                        <select bind:value={rule.operator}>
                          {#each RuleOperatoruleOptions as operation}
                                <option value={operation}>{operation}</option>
                          {/each}
                        </select>
                        <small >
                            <em>The value is compared to the column value using the selected operator.</em>
                        </small>
                    </label>
                    <label>
                        <span class="required"></span>Value:
                        <input type="text" bind:value={rule.value} />
                        <small >
                            <em>The value to compare against the column value.</em>
                        </small>
                    </label>


                    </fieldset>
                    <hr />
                    <h4>Styling</h4>
                    <details>
                        <summary role="button" class="outline">Styling</summary>
                        <fieldset class="grid">
                            <label >
                                Color:
                                {#if rule.styling.color.isSet}
                                <div role="group">
                                    <input type="color" bind:value={rule.styling.color.color} aria-label="Color picker" />
                                    <button onclick={() => setTimeout(() => rule.styling.color.isSet = false, 0)} >Clear</button>
                                </div>
                                {:else}
                                <div>
                                    <button onclick={() => {rule.styling.color.isSet = true; console.log('clicked picked');}} class="secondary" style="width: 100%;">Pick Color</button>
                                </div>
                                {/if}
                                <small >
                                    <em>Changes the text color when rule is applied</em>
                                </small>
                            </label>
    
                            <label>
                                Background:
                                {#if rule.styling.backgroundColor.isSet}
                                <div role="group">
                                    <input type="color" bind:value={rule.styling.backgroundColor.color} aria-label="Background color picker" />
                                    <button onclick={() =>  setTimeout(() => rule.styling.backgroundColor.isSet = false, 0)} >Clear</button>
                                </div>

                                {:else}
                                <div>
                                    <button onclick={() => rule.styling.backgroundColor.isSet = true} class="secondary" style="width: 100%;">Pick Color</button>
                                </div>
                                {/if}
                                <small >
                                    <em>Changes the background color when rule is applied</em>
                                </small>
                            </label>
                        </fieldset>
                    </details>

                    <details>
                        <summary role="button" class="outline">Font Styling</summary>
                        <fieldset class="grid">
                            <label>
                                Font decoration:
                                <select bind:value={rule.styling.textDecoration}>
                                    <option value="none">None</option>
                                    <option value="underline">Underline</option>
                                    <option value="line-through">Line-through</option>
                                </select>
                                <small >
                                    <em>Changes the text decoration when rule is applied</em>
                                </small>
                            </label>
                            <label>
                                Font Weight:
                                <select bind:value={rule.styling.fontWeight}>
                                    <option value="normal">Normal</option>
                                    <option value="bold">Bold</option>
                                </select>
                                <small >
                                    <em>Changes the font weight when rule is applied</em>
                                </small>
                            </label>
                            <label>
                                Font Style:
                                <select bind:value={rule.styling.fontStyle}>
                                    <option value="normal">Normal</option>
                                    <option value="italic">Italic</option>
                                    <option value="oblique">Oblique</option>
                                </select>
                                <small >
                                    <em>Changes the font style when rule is applied</em>
                                </small>
                            </label>
                        </fieldset>
                    </details>



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
                <button  onclick={() => ConditionalFormattingRules.push({
                    id: crypto.randomUUID(),
                    name: '',
                    column: '',
                    value: '',
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

    .required::after {
        color: red;
        content: '* ';
    }

    fieldset.grid {
        grid-template-columns: repeat(auto-fill, minmax('auto', 1fr));
        
    }

</style>