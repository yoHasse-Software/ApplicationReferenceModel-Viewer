<script lang="ts">
    import { onDestroy, onMount, tick } from 'svelte';
    import NestedBlockDiagram from '$lib/components/NestedBlockDiagram.svelte';
    import { DisplayOpsStore, FilteredData, getData, getDisplayOptions } from '$lib/datastore.svelte';
    import { type BlockNode, type NestedBlockOptions } from '$lib/types';
    import { buildHierarchy } from '$lib/d3Utils';
    import * as d3 from 'd3';
    
    // Example grouped data based on your CSV
    let svgContainer: SVGSVGElement;
    let groupContainer: SVGGElement;

    let rootNodes: BlockNode[] = $state([]);

    function getRootPosition(node: BlockNode, idx: number) {
        const columns = 3; // Number of columns for layout
        const xOffset = (idx % columns) * (svgContainer.clientWidth / columns);
        const yOffset = Math.floor(idx / columns) * (svgContainer.clientHeight / Math.ceil(rootNodes.length / columns));
        return { xRootOffset: 0, yRootOffset: 0 };
    }

    async function buildNestedBlockDiagram(nestedBlockOptions: NestedBlockOptions) {
      console.log('Building nested block diagram with options:', nestedBlockOptions);
        const data = getData();
        rootNodes = [];
        await tick(); // Wait for the DOM to update before proceeding
        rootNodes = buildHierarchy(data.nodes, data.relationships, 'nestedblock', nestedBlockOptions.rootAtLabel);

        console.log('Root nodes:', rootNodes);
    }

    function updateTooltipText(text: string[]) {
        // Update tooltip text logic here
    }


    onMount(async () => {

      await tick(); // Wait for the DOM to update before proceeding


      // const nestedBlockOptions = getDisplayOptions().nestedBlockOptions;
      // await buildNestedBlockDiagram(nestedBlockOptions);

      DisplayOpsStore.subscribe(async (state) => {
          if (state.nestedBlockOptions) {
              await buildNestedBlockDiagram(state.nestedBlockOptions);
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
  </script>


  {#if FilteredData.nodes.length > 0}
    <svg bind:this={svgContainer} width="100%" height="90vh" style="border: 1px solid #ccc">
      <g bind:this={groupContainer} >
        {#each rootNodes as node, idx}
            {@const { xRootOffset, yRootOffset } = getRootPosition(node, idx) } 

            <NestedBlockDiagram root={node} 
                updateTooltipText={updateTooltipText} 
                xRootOffset={xRootOffset} yRootOffset={yRootOffset} />

        {/each}
      </g>
    </svg>
  {/if}
  


<style>
  span[data-tooltip]{
    border-bottom: unset;
  }

  main {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        text-align: center;
    }
  
</style>
