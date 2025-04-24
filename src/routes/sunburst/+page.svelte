

<script lang="ts">
    import SunBurstOptionsDialogue from "$lib/components/dialogues/SunBurstOptionsDialogue.svelte";
import SunBurst from "$lib/components/SunBurst.svelte";
    import { buildHierarchy } from "$lib/d3Utils";
    import { DisplayOpsStore, getData, getDisplayOptions } from "$lib/datastore.svelte";
    import type { BlockNode, SunBurstOptions } from "$lib/types";
    import * as d3 from "d3";
    import { onDestroy, onMount, tick } from "svelte";

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

    async function buildSunBurst(sunBurstOptions: SunBurstOptions) {
        // totalXOffset = 0;
        // totalYOffset = 0;

        const data = getData();
        rootNodes = [];
        await tick(); // Wait for the DOM to update before proceeding
        rootNodes = buildHierarchy(data.nodes, data.relationships, 'sunburst', sunBurstOptions.rootAtLabel);
        // const columns = sunBurstOptions.rootColumns || 3;
        // const svgWidth = radius * Math.min(rootNodes.length, columns);
        // const svgHeight = radius * Math.ceil(rootNodes.length / columns) - diameter;

        // totalYOffset -= (svgHeight * 0.5);
        // totalXOffset -= svgWidth * 0.5;
    }

    onMount(async () => {
        // This is a placeholder for any initialization logic you might need.

        await tick(); // Wait for the DOM to update before proceeding

        DisplayOpsStore.subscribe(async (state) => {
            if (state.sunBurstOptions) {
                await buildSunBurst(state.sunBurstOptions);
            }
        });
        

        d3.select(svgContainer).call(
            (d3.zoom() as d3.ZoomBehavior<SVGSVGElement, unknown>)
                .scaleExtent([0.2, 5])
                .on('zoom', ({ transform }) => d3.select(groupContainer).attr('transform', transform)));
    });

    onDestroy(() => {
        // Cleanup logic if needed
        d3.select(svgContainer).on('.zoom', null); // Remove zoom event listener
    });


    function getRootPosition(node: BlockNode, idx: number) {
        const sunBurstOptions = getDisplayOptions().sunBurstOptions;

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
</script>

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
            {@const { xRootOffset, yRootOffset } = getRootPosition(node, idx) }
    
            <SunBurst root={node} 
                updateTooltipText={updateTooltipText} 
                width={diameter} 
                xRootOffset={xRootOffset} yRootOffset={yRootOffset} />
    
        {/each}
        </g>
    
    </svg>

</div>




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






