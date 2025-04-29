<script lang="ts">
    import { onDestroy, onMount, tick } from 'svelte';
    import NestedBlockDiagram from '$lib/components/NestedBlockDiagram.svelte';
    import { type BlockNode, type ColorPalette } from '$lib/types';
    import { buildHierarchy, computeNestedBlockPosition, computeNestedBlockSize, defaultColorPalette } from '$lib/d3Utils';
    import * as d3 from 'd3';
    import { getPicoColors } from '$lib/colorUtils';
    import { db, type DiagramOptions } from '$lib/components/db/dexie';
    import { diagramOptions, openDialogue } from '$lib/datastore.svelte';
    import Dexie from 'dexie';
    
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


    async function buildNestedBlockDiagram(nestedBlockOptions: DiagramOptions) {
        calculating = true; // Set calculating to true when starting the calculation
        rootNodes = [];
        await tick(); // Wait for the DOM to update before proceeding
        const data = await db.enteties
          .where('label')
          .anyOfIgnoreCase(nestedBlockOptions.labelHierarchy)
          .toArray(); // Fetch data from the database

        const ids = data.map((d) => d.id); // Extract IDs from the data
        const relationships = await db.relationships
            .where('to').anyOf(ids)
            .or('from').anyOf(ids)
            .and((relationship) => relationship.type === '->') // Filter relationships based on the reversed property
            .toArray(); // Filter relationships based on the IDs
            
        console.log('Data:', data.length); // Log the fetched data
        console.log('Relationships:', relationships.length); // Log the fetched relationships
            
        rootNodes = await buildHierarchy(data, relationships, nestedBlockOptions); // Build the hierarchy based on the data and relationships

        console.log('Root Nodes:', rootNodes); // Log the root nodes
        calculating = false; // Set calculating to false when done

        for (let index = 0; index < rootNodes.length; index++) {
          const node = rootNodes[index];
          computeNestedBlockSize(node, nestedBlockOptions.labelHierarchy, nestedBlockOptions); // Compute the size of the fake root node

          const previousNode = index > 0 ? rootNodes[index - 1] : undefined; // Get the previous node
          computeNestedBlockPosition(node, undefined, nestedBlockOptions, previousNode); // Compute the position of the node
        }

        calculating = false; // Set calculating to false when done
    }

    function updateTooltipText(text: string[]) {
        // Update tooltip text logic here
    }

    let colors: ColorPalette = $state(defaultColorPalette);

    let optionsValid = $state(false); // Flag to check if options are valid

    onMount(async () => {

      await tick(); // Wait for the DOM to update before proceeding


      const cssRoot = getComputedStyle(document.documentElement);
      colors = getPicoColors(cssRoot);

      diagramOptions.subscribe(async (state) => {
          const currentOptions = state.find((option) => option.diagramType === 'nestedblock');
          if (currentOptions) {
              if(currentOptions.labelHierarchy.length === 0) {
                optionsValid = false; // Set optionsValid to false if no labels are selected
                openDialogue.set('nestedblockoptions', true); // Open the dialogue to select labels
              }else{
                optionsValid = true; // Set optionsValid to true if labels are selected
                await buildNestedBlockDiagram(currentOptions);
              }
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
      {#if !calculating && optionsValid}
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
