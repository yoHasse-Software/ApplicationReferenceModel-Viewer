<script lang="ts">
    import ConditionalFormatDialogue from '$lib/components/ConditionalFormatDialogue.svelte';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import { Data } from '$lib/datastore.svelte';

    let { children } = $props();

    let isConditionalFormatingDialogueOpen = $state(false);
    let closeFormatDialogue = () => {
        isConditionalFormatingDialogueOpen = false;
    };

</script>

<main class:container={Data.nodes.length === 0} class:container-fluid={Data.nodes.length > 0} >
  <Sidebar
    onConditionalFormatDialogueOpen={() => isConditionalFormatingDialogueOpen = true} />

  <ConditionalFormatDialogue 
    isOpen={isConditionalFormatingDialogueOpen}
    onClose={() => closeFormatDialogue()} />
    <div id="content">
      {@render children()}
    </div>
</main>


<style>
  .container {
    margin-top: 2rem;
  }
</style>