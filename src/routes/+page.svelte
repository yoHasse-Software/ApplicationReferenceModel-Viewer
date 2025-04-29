<script lang="ts">
    import { enteties } from "$lib/datastore.svelte";
    import { onMount } from "svelte";

    let dataLength = $state(0);

    onMount(() => {

        // Initialize the conditional formatting rules
        enteties.subscribe((value) => {
            dataLength = value.length;
        });

    });

</script>

{#if dataLength > 0}

<div class="grid">
    <a href="/nestedblock" class="diagramSelectOption">
        <article>
            <header>
                <h2>Nested Block</h2>
            </header>
            <span class="diagram nestedblock">
            </span>
        </article>
    </a>
    <a href="/sunburst" class="diagramSelectOption" >
        <article>
            <header>
                <h2>Sunburst Diagram</h2>
            </header>
            <span class="diagram sunburst">
            </span>
        </article>
    </a>

<a  href="/graph" class="diagramSelectOption">
        <article>
            <header>
                <h2>Graph</h2>
            </header>
            <span class="diagram graph">
            </span>
        </article>
    </a>
</div>

{:else}
<a  href="/loadData" class="diagramSelectOption">

    <div style="height: 100%; width: 100%;display:flex; left:0; right:0; top:0; bottom:0; justify-content:center; align-items:center;">
        <article style="height: 50%;">
            <header>
                <h2>No Data</h2>
            </header>
            <p>Please upload a file to see the diagrams.</p>
        </article>
    </div>
</a>

{/if}


<style>

    .grid {
        margin: 2rem;
        grid-template-columns: repeat(2, 1fr);
    }
    .diagram {
        background-size: contain;
        display: block;
        width: 100%;
        min-height: 250px;
    }

    .sunburst {
        background: url('/icons/sunburst.svg') no-repeat center;
    }

    .nestedblock {
        background: url('/icons/nestedblock.svg') no-repeat center;
    }

    .diagramSelectOption {
        text-decoration: none;
        text-align: center;
        padding: 0;
    }
    
    article {
        border: 1px solid var(--pico-contrast);
        height: 100%;
    }
</style>

