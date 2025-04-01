
<script lang="ts">
    import type { ConditionalFormatting, ConditionalFormattingRuleType } from "$lib/types";
    import { onMount } from "svelte";


    const { 
        columnHeaders,
        isOpen,
        onClose,
     } = $props();

    const conditionalFormattingRules: Array<ConditionalFormatting> = $state([]);

     const ConditionalFormattingRuleOptions: ConditionalFormattingRuleType[] = [
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

    export function getConditionalFormattingRulese(): ConditionalFormatting[] {
        return conditionalFormattingRules;

    }

    function saveConditionalFormattningRules() {
        localStorage.setItem('conditionalFormattingRules', JSON.stringify(conditionalFormattingRules));
    }

    function removeConditionalFormattingRule(index: number) {
        conditionalFormattingRules.splice(index, 1);

        localStorage.setItem('conditionalFormattingRules', JSON.stringify(conditionalFormattingRules));
    }





    onMount(() => {
        const storedRules = JSON.parse(localStorage.getItem('conditionalFormattingRules') || '[]');
        if (storedRules.length > 0) {
            conditionalFormattingRules.splice(0, conditionalFormattingRules.length);
            conditionalFormattingRules.push(...storedRules);
        } else {
            conditionalFormattingRules.push({
                name: 'Default Rule',
                column: 'default',
                value: 'default',
                type: 'equals' as ConditionalFormattingRuleType,
                emoji: '✅'
            });
        }
    });

</script>



<dialog open={isOpen ? true : null}>

    <article>
        <header>
            <h1>Conditional Formatting</h1>
        </header>

        <div>
            <h3>Conditional Formatting</h3>
            {#each conditionalFormattingRules as rule, index}
                <details  aria-label="Display rule">
                    <summary role="button" class="outline">{rule.name.trim().length > 0 ? rule.name: "New rule"}</summary>
                <div>
                    <label>
                        Name:
                        <input type="text" bind:value={rule.name} placeholder="Rule Name" />
                    </label>
                    <label>
                        Column:
                        <select bind:value={rule.column}>
                            {#each columnHeaders as col}
                                <option value={col}>{col}</option>
                            {/each}
                        </select>
                    </label>
                    <label>
                        Value:
                        <input type="text" bind:value={rule.value} />
                    </label>
                    <label>
                        Type:
                        <select bind:value={rule.type}>
                          {#each ConditionalFormattingRuleOptions as type}
                                <option value={type}>{type}</option>
                          {/each}
                        </select>
                    </label>
                    <label>
                        Emoji:
                        <input type="text" bind:value={rule.emoji} />
                    </label>
                    <div role="group">
                        <button onclick={saveConditionalFormattningRules}  aria-label="Add rule">
                            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-device-floppy"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 4h10l4 4v10a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2" /><path d="M12 14m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M14 4l0 4l-6 0l0 -4" /></svg>
                        </button>
                        <button onclick={() => removeConditionalFormattingRule(index)} class="outline secondary" aria-label="Remove rule">
                            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-trash-x"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7h16" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /><path d="M10 12l4 4m0 -4l-4 4" /></svg>
                        </button>
                    </div>

                </div>
                </details>

            {/each}
        </div>

        <footer>
            <div role="group">
                <button  onclick={() => conditionalFormattingRules.push({
                    name: 'New Rule',
                    column: columnHeaders[0],
                    value: '',
                    type: 'equals',
                    emoji: '✅',
                })}>Add Rule</button>
                <button class="outline secondary" onclick={onClose}>Close</button>
            </div>
        </footer>

    </article>

</dialog>