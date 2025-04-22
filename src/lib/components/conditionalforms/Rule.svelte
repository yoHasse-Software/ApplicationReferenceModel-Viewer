<script lang="ts">
    import { Data, RuleOperatoruleOptions } from "$lib/datastore.svelte";
    import type { ConditionalFormatting } from "$lib/types";
    import { onMount } from "svelte";



    const { rule = $bindable(), labels }:{
        rule: ConditionalFormatting, labels: string[] } = $props();

    let metaKeyOptions: string[] = $state([])
    let nodeValueSelection: string[] = $state([])

    const metadataKey = "metadata";


    function generateMetaKeyOptions() {
        if(!rule.label) {
            return;
        }
        
        const ruleOperator = rule.operator;
        
        if(ruleOperator !== "equals" && ruleOperator !== "notEquals") {
            return;
        }

        rule.metadataKey = "";
        rule.value = "";

        const metaKeyOptionsRes = Data.nodes.filter((node) => node.label === rule.label)
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

    function generateValueSelection(){
        if(!rule.label || !rule.metadataKey) {
            return;
        }
        
        if(rule.operator !== "equals" && rule.operator !== "notEquals") {
            return;
        }

        rule.value = "";

        // Order by value
        const nodeDataValueMap = Data.nodes.filter((node) => {
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


    onMount(() => {
        // Initialize the map with the current rule's label
        generateMetaKeyOptions();
        generateValueSelection();


    });


</script>


<h4>Rule</h4>
<fieldset class="grid">
<label>
    <span class="required"></span>Label:
    <select bind:value={rule.label} onchange={generateMetaKeyOptions}>
        {#each labels as lbl}
            <option value={lbl} selected={lbl === rule.label} >{lbl}</option>
        {/each}
    </select>
    <small >
        <em>The label to which the rule applies.</em>
    </small>
</label>
<label>
    <span class="required"></span>Operator:
    <select bind:value={rule.operator} onchange={generateMetaKeyOptions}>
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
    <div role="group">
        <select bind:value={rule.metadataKey} onchange={generateValueSelection}>
            {#each metaKeyOptions as data}
                <option value={data} selected={data === rule.metadataKey} >{data} - {rule.metadataKey}</option>
            {/each}
        </select>
        <select bind:value={rule.value}>
            {#each nodeValueSelection as val}
                <option value={val}>{val}</option>
            {/each}
        </select>
    </div>
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