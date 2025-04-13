<script lang="ts">
    import { onMount } from "svelte";

    onMount(() => {

    });

</script>

<div class="grid">
    <a href="/arm">
        <article>
            <h1>Application Reference Architecture</h1>
        </article>
    </a>
    <a href="/arm/overview">
        <article>
            <h1>Overview</h1>
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

