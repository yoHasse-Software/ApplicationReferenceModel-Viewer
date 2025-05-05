<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { defaultDbName, db } from '$lib/components/db/dexie';
    import ConditionalFormatDialogue from '$lib/components/dialogues/ConditionalFormatDialogue.svelte';
    import NestedBlockOptionDialogue from '$lib/components/dialogues/NestedBlockOptionDialogue.svelte';
    import SunBurstOptionsDialogue from '$lib/components/dialogues/SunBurstOptionsDialogue.svelte';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import { enteties, initialize } from '$lib/datastore.svelte';
    import Dexie from 'dexie';
    import { onMount } from 'svelte';

    let { children } = $props();

    let entityLength = $state(0);


    
    onMount(async () => {
        // Initialize the conditional formatting rules

        if(db.name === defaultDbName && page.url.pathname !== '/loadData') {
          goto('/loadData', { replaceState: true });
        }

        
        enteties.subscribe((value) => {
            entityLength = value.length;
        });
        
    });

</script>



<NestedBlockOptionDialogue />
<SunBurstOptionsDialogue />
<ConditionalFormatDialogue />

<main class:container={entityLength === 0} class:container-fluid={entityLength > 0} >
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