


<script lang="ts">
    import { page } from "$app/state";
    import { idb } from "$lib/components/db/dexie";
    import NodeChart from "$lib/components/NodeChart.svelte";
    import { currentViewState } from "$lib/datastore.svelte";
    import * as d3 from "d3";
    import { liveQuery } from "dexie";
    import { onMount, tick } from "svelte";

    const diagramid = parseInt(page.params.diagramid, 10); // Get the diagram ID from the URL parameters
    const perspectiveId = parseInt(page.params.id, 10); // Get the perspective ID from the URL parameters
    let currentOptions = liveQuery(() => idb.diagramOptions.get(diagramid)); // Fetch the current diagram options from the database

    let svgContainer: SVGSVGElement;
    let groupContainer: SVGGElement;


    let isInitialized: boolean = $state(false); // State to track if the component is initialized
    onMount(async () => {
        // This is a placeholder for any initialization logic you might need.
        currentViewState.currentDiagramType = 'graph'; // Set the current diagram type to nested block

        currentOptions.subscribe(async (options) => {
            if (!options) {
                console.error("No options found for the diagram.");
                return;
            }

            await tick(); // Wait for the DOM to update before proceeding

            if(!isInitialized) {
                isInitialized = true; // Set the initialized state to true
                d3.select(svgContainer).call(
                (d3.zoom() as d3.ZoomBehavior<SVGSVGElement, unknown>)
                    .scaleExtent([0.2, 5])
                    .on('zoom', ({ transform }) => d3.select(groupContainer).selectChild().attr('transform', transform)));
            }
        });
    });

</script>


<svg bind:this={svgContainer} class="node-chart" width="100%" height="100%" viewBox="-464 -340 928 680" style="max-width: 100%; height: auto;">
    <g bind:this={groupContainer} class="group-container" style="transform: translate(0px, 0px);">
        {#if $currentOptions}
            <NodeChart currentOptions={$currentOptions} perspectiveId={perspectiveId} diagramid={diagramid} />
        {/if}
    </g>
</svg>

