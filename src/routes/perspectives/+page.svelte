<script lang="ts">
    import { goto } from "$app/navigation";
    import { idb } from "$lib/components/db/dexie";
    import { toggleDialogueOption } from "$lib/datastore.svelte";
    import { liveQuery } from "dexie";

    const perspectives = liveQuery(
        () => idb.perspectives.toArray()
    );
</script>


<div class="grid">
    {#each ($perspectives || []) as perspective (perspective.id)}
        <button class="article-button" onclick={() => {
            goto('/perspectives/' + perspective.id);
        }}>
    <article>
        <header>{perspective.name}</header>
    </article>    
    </button>
    {/each}
    <button class="article-button" style="
        grid-column: 1;
    " onclick={() => toggleDialogueOption('visualization')}>
        <article>
            <header>+ Create a perspective</header>
            <small><em>A perspective is a way to view and analyze data from a specific angle or context.</em></small>
            <small><em>It allows you to focus on particular aspects of the data that are relevant to your analysis.</em></small>
        </article>
    </button>
</div>