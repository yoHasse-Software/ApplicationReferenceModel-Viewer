<script lang="ts">
    import { onMount } from "svelte";

    onMount(() => {

    });

</script>

<div class="grid">
    <a href="/nestedblock">
        <article>
            <h1>View Data as Nested Block</h1>
        </article>
    </a>
    <a href="/">
        <article>
            <h1>Soon</h1>
        </article>
    </a>
</div>


<style>

    .grid {
        margin: 2rem;
    }
    
    article {
        border: 1px solid var(--pico-contrast);
        height: 100%;
    }
</style>

