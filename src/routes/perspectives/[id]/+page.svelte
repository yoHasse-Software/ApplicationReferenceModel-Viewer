<script lang="ts">
    import type { DiagramOptions, Perspective } from '$lib/components/db/dataRepository';
    import { onMount } from 'svelte';
    
    import { idb } from '$lib/components/db/dexie';
    import { page } from '$app/state';
    import ConditionalFormatDialogue from '$lib/components/dialogues/ConditionalFormatDialogue.svelte';
    import { toggleDialogueOption } from '$lib/datastore.svelte';
    import { liveQuery } from 'dexie';
    import { goto } from '$app/navigation';
    import DiagramOptionCreateDialogue from '$lib/components/dialogues/DiagramOptionCreateDialogue.svelte';

    const perspectiveId = parseInt(page.params.id, 10); // Get the perspective ID from the URL parameters
    const options = liveQuery(() => idb.diagramOptions.where('perspectiveId').equals(perspectiveId).toArray()); // Fetch options based on the perspective ID


    onMount(async () => {
        
    });

</script>

<DiagramOptionCreateDialogue />
<ConditionalFormatDialogue perspectiveId={perspectiveId} diagramId={0} />

<div class="grid perspective-view">

    {#each ($options || []) as option (option.id)}
        <div class="grid" style="overflow: hidden;">
            <button class="article-button" onclick={() => { goto(`${perspectiveId}/${option.diagramType}/${option.id}`) }}>
                <article class="article">
                    <header>{option.name}</header>
                    <small><em>{option.description}</em></small>
                </article>
            </button>

        </div>
    {/each}

    <button class="article-button" onclick={() => toggleDialogueOption('diagramoptioncreate')}>
        <article>
            <header>+ Add a new graph</header>
            <small><em>Add a new graph to your perspective</em></small>
        </article>
    </button>



</div>

<style>
    .perspective-view {
        margin-top: 2rem;
    }
</style>

