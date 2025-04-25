<script lang="ts">
    import ConditionalFormatDialogue from '$lib/components/dialogues/ConditionalFormatDialogue.svelte';
    import NestedBlockOptionDialogue from '$lib/components/dialogues/NestedBlockOptionDialogue.svelte';
    import SunBurstOptionsDialogue from '$lib/components/dialogues/SunBurstOptionsDialogue.svelte';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import { getData, initializeDataStores } from '$lib/datastore.svelte';
    import { onMount } from 'svelte';

    let { children } = $props();

    let isConditionalFormatingDialogueOpen = $state(false);
    let closeFormatDialogue = () => {
        isConditionalFormatingDialogueOpen = false;
    };

    onMount(() => {
        // Initialize the conditional formatting rules
        initializeDataStores();
    });

</script>

<NestedBlockOptionDialogue />
<SunBurstOptionsDialogue />
<ConditionalFormatDialogue />



<main class:container={getData().nodes.length === 0} class:container-fluid={getData().nodes.length > 0} >



    <div class="grid" style="overflow: hidden;">
      <Sidebar />
      <div id="content">
        {@render children()}
      </div>
    </div>

</main>


<style>
  .container {
    margin-top: 2rem;
  }

  #content {
    min-height: 90vh;
  }


  .grid {
    grid-template-columns: auto 1fr;
  }
</style>