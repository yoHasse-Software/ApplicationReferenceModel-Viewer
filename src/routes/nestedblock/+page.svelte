<script lang="ts">
    import { onDestroy, onMount, tick } from 'svelte';
    import NestedBlockDiagram from '$lib/components/NestedBlockDiagram.svelte';
    import { DisplayOpsStore, FilteredData, getData, getDisplayOptions } from '$lib/datastore.svelte';
    import { type BlockNode, type ColorPalette, type NestedBlockOptions } from '$lib/types';
    import { buildHierarchy, computeNestedBlockPosition, computeNestedBlockSize, defaultColorPalette } from '$lib/d3Utils';
    import * as d3 from 'd3';
    import { getPicoColors } from '$lib/colorUtils';
    
    // Example grouped data based on your CSV
    let svgContainer: SVGSVGElement;
    let groupContainer: SVGGElement;

    let rootNodes: BlockNode[] = $state([]);
    let calculating: boolean = $state(false);

    function getRootPosition(node: BlockNode, idx: number) {
        const columns = 3; // Number of columns for layout
        const xOffset = (idx % columns) * (svgContainer.clientWidth / columns);
        const yOffset = Math.floor(idx / columns) * (svgContainer.clientHeight / Math.ceil(rootNodes.length / columns));
        return { xRootOffset: 0, yRootOffset: 0 };
    }

    async function buildNestedBlockDiagram(nestedBlockOptions: NestedBlockOptions) {
        calculating = true; // Set calculating to true when starting the calculation
        const data = getData();
        rootNodes = [];
        await tick(); // Wait for the DOM to update before proceeding
        rootNodes = buildHierarchy(data.nodes, data.relationships, 'nestedblock', nestedBlockOptions.rootAtLabel);

        console.log("Root nodes: ", rootNodes); // Log the root nodes for debugging

        
        for (let index = 0; index < rootNodes.length; index++) {
          const node = rootNodes[index];
          computeNestedBlockSize(node, nestedBlockOptions.labelHierarchy, nestedBlockOptions.titleModel, nestedBlockOptions.boxModel); // Compute the size of the fake root node

          const previousNode = index > 0 ? rootNodes[index - 1] : undefined; // Get the previous node
          computeNestedBlockPosition(node, undefined, nestedBlockOptions.titleModel, nestedBlockOptions.boxModel, previousNode); // Compute the position of the node
        }

        calculating = false; // Set calculating to false when done
    }

    function updateTooltipText(text: string[]) {
        // Update tooltip text logic here
    }

    let colors: ColorPalette = $state(defaultColorPalette);


    onMount(async () => {

      await tick(); // Wait for the DOM to update before proceeding


      const cssRoot = getComputedStyle(document.documentElement);
      colors = getPicoColors(cssRoot);


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


  {#if calculating}
  <div style="display: flex; max-width: 300px; height: 100%; margin: auto;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150"><path fill="none" stroke={colors.primary} stroke-width="15" stroke-linecap="round" stroke-dasharray="300 385" stroke-dashoffset="0" d="M275 75c0 31-27 50-50 50-58 0-92-100-150-100-28 0-50 22-50 50s23 50 50 50c58 0 92-100 150-100 24 0 50 19 50 50Z"><animate attributeName="stroke-dashoffset" calcMode="spline" dur="2" values="685;-685" keySplines="0 0 1 1" repeatCount="indefinite"></animate></path></svg>
  </div>
  {/if}

  <svg bind:this={svgContainer} width="100%" height="90vh" style="border: 1px solid #ccc">
    <g bind:this={groupContainer} >
      {#if !calculating}
      {#each rootNodes as node, idx}
          {@const { xRootOffset, yRootOffset } = getRootPosition(node, idx) } 

          <NestedBlockDiagram root={node} 
              updateTooltipText={updateTooltipText} 
              xRootOffset={xRootOffset} yRootOffset={yRootOffset} />

      {/each}
      {/if}
    </g>
  </svg>
  


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
