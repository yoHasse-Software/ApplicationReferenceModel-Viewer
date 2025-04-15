<script lang="ts">
    import { Data } from '$lib/datastore.svelte';

    let { children } = $props();

</script>

<main  class:container={Data.nodes.length === 0} class:container-fluid={Data.nodes.length > 0} >
    <div id="content">
      {@render children()}
    </div>
</main>


<style>
  .container {
    margin-top: 2rem;
  }
</style>