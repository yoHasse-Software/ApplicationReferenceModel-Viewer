

<script lang="ts">
    import NodeChart from "$lib/components/NodeChart.svelte";
    import SunBurst from "$lib/components/SunBurst.svelte";
    import { buildHierarchy } from "$lib/d3Utils";
    import { Data, DisplayOps, initConditionalFormattingRules, initData, initDisplayOptions, initLabels } from "$lib/datastore.svelte";
    import type { BlockNode } from "$lib/types";
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

    onMount(async () => {
        // This is a placeholder for any initialization logic you might need.
        
        d3.select(groupContainer).selectChildren().remove(); // Remove any existing children in the group container

        initLabels();
        initDisplayOptions();
        initData();
        initConditionalFormattingRules();

        await tick(); // Wait for the DOM to update before proceeding
        rootNodes = buildHierarchy(Data.nodes, Data.relationships);

        const columns = DisplayOps.columns[Data.nodes[0].label] || 1;
        
        const svgWidth = radius * Math.min(rootNodes.length, columns);
        const svgHeight = radius * Math.ceil(rootNodes.length / columns) - diameter;


        totalYOffset -= (svgHeight * 0.5);
        totalXOffset -= svgWidth * 0.5;
        

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
        const nodeColumns = DisplayOps.columns[node.label] || 1;
        const isNewRow = idx % nodeColumns === 0;

        if(isNewRow) {
            totalYOffset += (radius * (nodeColumns - 1));
            totalXOffset = 0;
        }else {
            totalXOffset += (radius * (nodeColumns - 1));
        }
        const xRootOffset = totalXOffset;
        const yRootOffset = totalYOffset;

        $inspect('node', node.name, 'clmn', idx, 'isNewRow', isNewRow, 'xRootOffset', xRootOffset, 'yRootOffset', yRootOffset);
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
        <g bind:this={groupContainer} transform={`translate(${totalXOffset}, ${totalYOffset})`}>
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






