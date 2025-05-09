
<script lang="ts">
    import { scale } from "svelte/transition";
    import type { Entity } from "../db/dataRepository";
    import { onMount } from "svelte";
    import { closeDialogueOption } from "$lib/datastore.svelte";


    const { entity }:{
        entity: Entity; // Assuming Entity is defined in your types
    } = $props(); // Assuming entity is passed as a prop

    let dialogueOnSide = $state(false); // State to manage the dialogue position

    onMount(() => {
        // This function will run when the component is mounted
        console.log("Entity Information Dialogue Mounted");
        console.log(entity);
    });

</script>



<dialog open transition:scale class:side-dialogue={dialogueOnSide}>
    <article>
        <header style="position: sticky; top: -1rem; z-index: 1;">
            <div class="grid" style="grid-template-columns: 1fr auto; gap: 1rem; align-items: center;">
                <span style="font-size: larger">{entity.name} - {entity.id}</span>
                <div role="group" >
                    <button style="margin:unset;" type="button" class="outline" onclick={() => dialogueOnSide = !dialogueOnSide} aria-label="add label" data-tooltip="Toggle dialogue to side" data-placement="bottom">
                        {#if dialogueOnSide}
                            <span class="ico ico-arrow-bar-right"></span>
                        {:else}
                            <span class="ico ico-arrow-bar-left"></span>
                        {/if}
                    </button>
                    <button style="margin:unset;" type="button" class="outline" onclick={() => closeDialogueOption('nodeinfo')} aria-label="add label">
                        <span class="ico ico-x"></span>
                    </button>
                </div>
            </div>
        </header>
        <article>
            <header><h3>Entity information</h3></header>
            <p><strong>ID:</strong> {entity.id}</p>
            <p><strong>Name:</strong> {entity.name}</p>
            <p><strong>Label:</strong> {entity.label}</p>
        </article>
        <article>
            <header><h3>Metadata</h3></header>
            <table>
                <thead>
                    <tr>
                        <th>Key</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    {#each Object.entries(entity.metadata) as [key, value]}
                        <tr>
                            <td>{key}</td>
                            <td>{value}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
            <!-- <ul>
                {#each Object.entries(entity.metadata) as [key, value]}
                    <li><strong>{key}:</strong> {value}</li>
                {/each}
            </ul> -->
        </article>
    </article>


</dialog>