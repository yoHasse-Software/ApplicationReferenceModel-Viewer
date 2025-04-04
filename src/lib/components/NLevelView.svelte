

<script lang="ts">
    import { APPWIDTH, N2WIDTH, N3WIDTH } from "$lib/datastore.svelte";
    import { onMount } from "svelte";

    let { 
        displayLevel, 
        level,
        title,
        gridChildren = false,
        addHeader = true,
        styling = '',
        nodeChildCount = 0,
        isLeaf = false,
        children } = $props();

    function getClassName() {
        switch(level) {
            case 1:
                return 'n1-box';
            case 2:
                return 'n2-box';
            case 3:
                return 'n3-box';
            case 4:
                return 'app';
            default:
                return '';
        }
    }


    function getTemplateColumns() {
        switch(level) {
            case 1:
                return `repeat(auto-fit, minmax(${N2WIDTH*0.8}px, 1fr))`;
            case 2:
                return `repeat(auto-fit, minmax(${N3WIDTH*0.8}px, 1fr))`;
            case 3:
                return `repeat(auto-fit, minmax(${APPWIDTH*0.8}px, 1fr))`;
            case 4:
                return `repeat(auto-fit, minmax(${APPWIDTH*0.8}px, 1fr))`;
            default:
                return '';
        }
    }

    onMount(() => {
    });
</script>
<div style="{level === 4 ? '' : ''}" >

{#if displayLevel}
<article class={getClassName()} style={styling} style:height={"100%"} data-haschildren={nodeChildCount>0}>
    {#if addHeader && nodeChildCount > 0}
    <header>
        {#if level === 1}
            <h1>{title}</h1>
        {:else if level === 2}
            <h2>{title}</h2>
        {:else if level === 3}
            <h3>{title}</h3>
        {/if}
    </header>
    {/if}

    {#if gridChildren && nodeChildCount > 0}
        <div class="grid" data-level={level} style:grid-template-columns={getTemplateColumns()}>
            {@render children?.()}
        </div>
    {:else if nodeChildCount > 0 || isLeaf}
        {@render children?.()}
    {:else}
        {#if level === 1}
            <h1>{title}</h1>
        {:else if level === 2}
            <h2>{title}</h2>
        {:else if level === 3}
            <h3>{title}</h3>
        {/if}
    {/if}
</article>
{:else}
<div data-haschildren={nodeChildCount>0}>
    {#if gridChildren && nodeChildCount > 0}
        <div class="grid" data-level={level} style:grid-template-columns={getTemplateColumns()}>
            {@render children?.()}
        </div>
    {:else if nodeChildCount > 0 || isLeaf}
        {@render children?.()}
    {:else}
    {#if displayLevel}
        {#if level === 1}
            <h1>{title}</h1>
        {:else if level === 2}
            <h2>{title}</h2>
        {:else if level === 3}
            <h3>{title}</h3>
        {/if}
        {/if}

    {/if}
</div>

{/if}
</div>



<style>


.grid {
    grid-template-rows: min-content;
}


</style>










