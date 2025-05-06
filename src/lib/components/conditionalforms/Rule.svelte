<script lang="ts">
    import { database, enteties, RuleOperatoruleOptions } from "$lib/datastore.svelte";
    import { onMount } from "svelte";
    import type { ConditionalFormatting } from "../db/dataRepository";



    const { rule = $bindable() }:{
        rule: ConditionalFormatting} = $props();

    let metaKeyOptions: string[] = $state([])
    let nodeValueSelection: string[] = $state([])

    const metadataKey = "metadata";

    let labels: string[] = $state([]);


    async function generateMetaKeyOptions(initialize: boolean = false) {
        if(!rule.label) {
            console.log("No label selected");
            return;
        }

        console.log("Label selected: ", rule.label);
        
        const ruleOperator = rule.operator;
        
        if(ruleOperator !== "equals" && ruleOperator !== "notEquals") {
            return;
        }

        if(!initialize) {
            rule.metadataKey = "";
            rule.value = "";
        }

        const data = await database.getEnteties();

        const metaKeyOptionsRes = data.filter((node) => node.label === rule.label)
            .flatMap((node) => {
                const nodeKeys = Object.keys(node).filter((key) => key !== metadataKey);
                const metadataKeys = Object.keys(node.metadata);
                return [...nodeKeys, ...metadataKeys]
            }).sort((a, b) => {
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
        });

        // Only keep unique keys
        metaKeyOptions = [...new Set(metaKeyOptionsRes)];
    }

    async function generateValueSelection(initialize: boolean = false) {
        if(!rule.label || !rule.metadataKey) {
            return;
        }
        
        if(rule.operator !== "equals" && rule.operator !== "notEquals") {
            return;
        }

        if(!initialize) {
            rule.value = "";
        }
        // Order by value
        const data = await database.getEnteties();
        const nodeDataValueMap = data.filter((node) => {
            return node.label === rule.label && rule.metadataKey && ((rule.metadataKey in node) || node.metadata[rule.metadataKey]);
        }).map((node) => {
            const metadataKey = (rule.metadataKey in node) 
                ? rule.metadataKey 
                : (rule.metadataKey in node.metadata) 
                    ? rule.metadataKey 
                    : null;

            if (metadataKey) {
                return (node.metadata[metadataKey as keyof typeof node.metadata] || node[metadataKey as keyof typeof node]).toString();
            }
            return metadataKey ? (node.metadata[metadataKey as keyof typeof node.metadata] || node[metadataKey as keyof typeof node]).toString() : "";
        }).sort((a, b) => {
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
        })

        nodeValueSelection = [...new Set(nodeDataValueMap)]
    }


    onMount(async () => {
        // Initialize the map with the current rule's label
        enteties.subscribe((value) => {
            labels = value.map((node) => node.label).filter((label, index, self) => label && self.indexOf(label) === index).sort((a, b) => {
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            });
        });
        await generateMetaKeyOptions(true);
        await generateValueSelection(true);
        


    });


</script>

<article>
    <header>
        <span>Rule</span>
    </header>

<fieldset class="grid">
<label>
    <span class="required"></span>Label:

    <select bind:value={rule.label} onchange={() => generateMetaKeyOptions()}>
        {#each labels as lbl}
            <option value={lbl} selected={lbl === rule.label} >{lbl}</option>
        {/each}
    </select>


    <small >
        <em>The label to which the rule applies.</em>
    </small>
</label>
<label>
    <span class="required"></span>Metadata Key:
    <select bind:value={rule.metadataKey} onchange={() => generateValueSelection()}>
        {#each metaKeyOptions as data}
            <option value={data} selected={data === rule.metadataKey} >{data}</option>
        {/each}
    </select>
</label>
</fieldset>
<fieldset class="grid">
<label>
    <span class="required"></span>Operator:
    <select bind:value={rule.operator} >
      {#each RuleOperatoruleOptions as operation}
            <option value={operation} selected={operation === rule.operator} >{operation}</option>
      {/each}
    </select>
    <small >
        <em>The value is compared to the label value using the selected operator.</em>
    </small>
</label>
<label>
    <span class="required"></span>Value:
    {#if rule.operator === 'equals' || rule.operator === 'notEquals'}

        <select bind:value={rule.value}>
            {#each nodeValueSelection as val}
                <option value={val}>{val}</option>
            {/each}
        </select>
    {:else if rule.operator === 'contains' || rule.operator === 'notContains'}
        <input type="text" bind:value={rule.value} placeholder="Value" />
    {:else if rule.operator === 'startsWith' || rule.operator === 'notStartsWith'}
        <input type="text" bind:value={rule.value} placeholder="Value" />
    {:else if rule.operator === 'endsWith' || rule.operator === 'notEndsWith'}
        <input type="text" bind:value={rule.value} placeholder="Value" />
    {:else if rule.operator === 'greaterThan' || rule.operator === 'lessThan'}
        <input type="text" bind:value={rule.value} placeholder="Value" />
    {:else if rule.operator === 'between'}
        <input type="text" bind:value={rule.value} placeholder="Value 1" />
        <input type="text" bind:value={rule.value} placeholder="Value 2" />
    {:else}
        <input type="text" bind:value={rule.value} />
    {/if}
    <small >
        <em>The value to compare against the column value.</em>
    </small>
</label>


</fieldset>
</article>