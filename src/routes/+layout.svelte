<script lang="ts">
    import { Data } from '$lib/datastore.svelte';


    export const prerender = true;
    let { children } = $props();

</script>

<main  class:container={Data.length === 0} class:container-fluid={Data.length > 0} >
    <div id="content">
      {@render children()}
    </div>
</main>