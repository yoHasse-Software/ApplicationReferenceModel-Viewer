

<script lang="ts">
    import { page } from "$app/state";
    import type { DiagramOptions } from "$lib/components/db/dataRepository";
    import { getLabelRelations, idb } from "$lib/components/db/dexie";
    import ConditionalFormatDialogue from "$lib/components/dialogues/ConditionalFormatDialogue.svelte";
    import SunBurstOptionsDialogue from "$lib/components/dialogues/SunBurstOptionsDialogue.svelte";
    import SunBurst from "$lib/components/SunBurst.svelte";
    import { buildHierarchy } from "$lib/d3Utils";
    import { currentViewState,  isDialogueOpen,  openDialogueOption } from "$lib/datastore.svelte";
    import type { BlockNode, DisplayOptions } from "$lib/types";
    import * as d3 from "d3";
    import { liveQuery } from "dexie";
    import { onDestroy, onMount, tick } from "svelte";

    const diagramId = parseInt(page.params.diagramid, 10); // Get the diagram ID from the URL parameters
    const perspectiveId = parseInt(page.params.id, 10); // Get the perspective ID from the URL parameters
    let currentOptions = liveQuery(() => idb.diagramOptions.get(diagramId)); // Fetch the current diagram options from the database



    let rootNodes: BlockNode[] = $state([]);
    let svgContainer: SVGSVGElement;
    let groupContainer: SVGGElement;


    let tooltipText: string[] = $state(['']);

    const diameter = 900;
    const radius = diameter * 0.5;

    function updateTooltipText(text: string[]) {
        tooltipText = text;
    }

    let totalYOffset = 0;
    let totalXOffset = 0;

    async function buildSunBurst(sunBurstOptions: DiagramOptions) {
        const data = await idb.enteties.where('label').anyOfIgnoreCase(sunBurstOptions.labelHierarchy).toArray(); // Fetch data based on the label hierarchy
        const ids = data.map((d) => d.id);
        const relationships = await idb.relationships.where('from').anyOf(ids).or('to').anyOf(ids).toArray(); // Fetch relationships based on the IDs
        rootNodes = [];
        await tick(); // Wait for the DOM to update before proceeding
        rootNodes = await buildHierarchy(data, relationships, sunBurstOptions);
    }

    function getRootPosition(sunBurstOptions: DiagramOptions, node: BlockNode, idx: number) {
        if(!sunBurstOptions) {
            return { xRootOffset: 0, yRootOffset: 0 };
        }

        if(idx === 0) {
            const containerWidth = svgContainer.getBoundingClientRect().width;
            const containerHeight = svgContainer.getBoundingClientRect().height;
            console.log("Container width: ", containerWidth);
            totalYOffset = containerHeight * 0.5;
            totalXOffset = containerWidth * 0.5;
            return { xRootOffset: totalXOffset, yRootOffset: totalYOffset };
        }

        const nodeColumns = Math.max((sunBurstOptions.rootColumns || 1), 1);
        const isNewRow = idx % nodeColumns === 0;

        if(isNewRow) {
            totalYOffset += (radius * (nodeColumns === 1 ? 2: nodeColumns));
            totalXOffset = 0;
        }else {
            totalXOffset += (radius * (nodeColumns));
        }
        const xRootOffset = totalXOffset;
        const yRootOffset = totalYOffset;

        return { xRootOffset, yRootOffset };

    }
    
    let hasInitialized = $state(false); // Flag to check if the diagram has been initialized

    onMount(async () => {
        // This is a placeholder for any initialization logic you might need.
        currentViewState.currentDiagramType = 'sunburst'; // Set the current diagram type to nested block
        
        currentOptions.subscribe(async (options) => {
            if(!options) {
                return;
            }
            if(options.labelHierarchy.length === 0) {
                openDialogueOption('sunburstoptions'); // Open the options dialogue if no label hierarchy is set
                return;
            }
            await tick(); // Wait for the DOM to update before proceeding
            await buildSunBurst(options);
            if(!hasInitialized) {
                hasInitialized = true; // Set the flag to true after the first initialization
                d3.select(svgContainer).call(
                    (d3.zoom() as d3.ZoomBehavior<SVGSVGElement, unknown>)
                        .scaleExtent([0.2, 5])
                        .on('zoom', ({ transform }) => d3.select(groupContainer).attr('transform', transform)));
            }
            
        });




    });

    onDestroy(() => {
        // Cleanup logic if needed
        currentViewState.currentDiagramType = 'none'; // Reset the current diagram type
        d3.select(svgContainer).on('.zoom', null); // Remove zoom event listener
    });



</script>

{#if isDialogueOpen('sunburstoptions')}
<SunBurstOptionsDialogue 
    perspectiveId={perspectiveId} 
    optionsId={diagramId}
/>
{/if}

    
{#if isDialogueOpen('conditionalformatting')}
    <ConditionalFormatDialogue perspectiveId={perspectiveId} diagramId={diagramId}/>
{/if}


{#if $currentOptions}
<div class="breadcrumb" >
    <nav aria-label="breadcrumb">
        <ul>
            {#each tooltipText as txt}
                <li>{txt}</li>      
            {/each}
        </ul>
    </nav>
</div>
<div style="height: 90vh;">
    <svg bind:this={svgContainer} width="100%" height="100%" style="border: 1px solid #ccc">
        <g bind:this={groupContainer} transform={`translate(0, 0)`}>
        {#each rootNodes as node, idx}
            {@const { xRootOffset, yRootOffset } = getRootPosition($currentOptions, node, idx) }
    
            <SunBurst root={node} 
                perspectiveId={perspectiveId}
                diagramId={diagramId}
                sunBurstOptions={$currentOptions}
                updateTooltipText={updateTooltipText} 
                width={diameter} 
                xRootOffset={xRootOffset} yRootOffset={yRootOffset} />
    
        {/each}
        </g>
    
    </svg>

</div>

{/if}




<style>
    .breadcrumb{
        min-height: 1rem;
        min-width: 100%;
        position: relative;
        left: 2rem;
        display: flex;
        justify-content: center;
    }

</style>






