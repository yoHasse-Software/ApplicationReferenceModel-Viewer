<script lang="ts">
    import { onMount } from "svelte";


    onMount(() => {

    });

</script>



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

