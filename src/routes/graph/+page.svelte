


<script lang="ts">
    import NodeChart from "$lib/components/NodeChart.svelte";
    import * as d3 from "d3";
    import { onMount, tick } from "svelte";


    let svgContainer: SVGSVGElement;
    let groupContainer: SVGGElement;


    onMount(async () => {
        // This is a placeholder for any initialization logic you might need.
        await tick(); // Wait for the DOM to update before proceeding
        d3.select(svgContainer).call(
            (d3.zoom() as d3.ZoomBehavior<SVGSVGElement, unknown>)
                .scaleExtent([0.2, 5])
                .on('zoom', ({ transform }) => d3.select(groupContainer).selectChild().attr('transform', transform)));
    });

</script>


<svg bind:this={svgContainer} class="node-chart" width="100%" height="100%" viewBox="-464 -340 928 680" style="max-width: 100%; height: auto;">
    <g bind:this={groupContainer} class="group-container" style="transform: translate(0px, 0px);">
        <NodeChart />
    </g>
</svg>

