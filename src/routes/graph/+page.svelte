

<script lang="ts">
    import NodeChart from "$lib/components/NodeChart.svelte";
    import SunBurst from "$lib/components/SunBurst.svelte";
    import { buildHierarchy } from "$lib/d3Utils";
    import { Data, initConditionalFormattingRules, initData, initDisplayOptions, initLabels } from "$lib/datastore.svelte";
    import type { BlockNode } from "$lib/types";
    import * as d3 from "d3";
    import { onMount, tick } from "svelte";

    let rootNodes: BlockNode[] = $state([]);
    let svgContainer: SVGSVGElement;
    let groupContainer: SVGGElement;




    onMount(async () => {
        // This is a placeholder for any initialization logic you might need.
        initLabels();
        initDisplayOptions();
        initData();
        initConditionalFormattingRules();

        d3.select(groupContainer).selectChildren().remove(); // Remove any existing children in the group container

        rootNodes = buildHierarchy(Data.nodes, Data.relationships);

        await tick(); // Wait for the DOM to update before proceeding
        d3.select(svgContainer).call(
            // for each g element in the svg, set the transform to center it

            (d3.zoom() as d3.ZoomBehavior<SVGSVGElement, unknown>)
                .scaleExtent([0.2, 5])
                .on('zoom', ({ transform }) => d3.select(groupContainer).attr('transform', transform))

        );

    });
</script>

<svg bind:this={svgContainer} width="100%" height="90vh" style="border: 1px solid #ccc">
    <g bind:this={groupContainer} >

    </g>
</svg>

{#each rootNodes as node, idx}
    {@const xRootOffset = (idx * 600)}
    {@const yRootOffset = (idx * 600)}
    <SunBurst root={node} {svgContainer} {groupContainer} xRootOffset={xRootOffset} yRootOffset={yRootOffset} />
{/each}