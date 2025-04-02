

<script lang="ts">
    import { onMount } from "svelte";



    let { 
        displayLevel, 
        level,
        title,
        gridChildren = false,
        addHeader = true,
        styling = '',
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

    onMount(() => {
        $inspect(displayLevel, 'displayOptions for NLevelView');
    });
</script>

{#if displayLevel}
<article class={getClassName()} style={styling}>
    {#if addHeader}
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

    {#if gridChildren}
        <div class="grid">
            {@render children?.()}
        </div>
    {:else}
        {@render children?.()}
    {/if}
</article>

{:else}

{@render children?.()}

{/if}


<style>
.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 1rem;
    width: 100%;
}


</style>










