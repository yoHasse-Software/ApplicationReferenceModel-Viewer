<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { idb } from '$lib/components/db/dexie';
    import DataDialogue from '$lib/components/dialogues/DataDialogue.svelte';
    import PerspectiveDialogue from '$lib/components/dialogues/PerspectiveDialogue.svelte';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import { closeDialogueOption } from '$lib/datastore.svelte';
    import Dexie, { liveQuery } from 'dexie';
    import { onMount } from 'svelte';

    let { children } = $props();
    
    const loadedEnteteies = liveQuery(
        () => idb.enteties.count()
    );
    
    onMount(async () => {
        // Initialize the conditional formatting rules
        // Close all dialogues on mount
    });

</script>

<DataDialogue />
<PerspectiveDialogue />

<main class="container-fluid" >
    <div class="grid" style="overflow: hidden; margin-top: 2rem;">
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