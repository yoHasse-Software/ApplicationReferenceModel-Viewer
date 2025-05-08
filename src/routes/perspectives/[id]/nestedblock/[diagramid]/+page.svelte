<script lang="ts">
    import { onDestroy, onMount, tick } from 'svelte';
    import NestedBlockDiagram from '$lib/components/NestedBlockDiagram.svelte';
    import { type BlockNode, type ColorPalette } from '$lib/types';
    import { buildHierarchy, computeNestedBlockPosition, computeNestedBlockSize, defaultColorPalette } from '$lib/d3Utils';
    import * as d3 from 'd3';
    import { getPicoColors } from '$lib/colorUtils';
    import { currentViewState, isDialogueOpen, openDialogueOption } from '$lib/datastore.svelte';
    import type { DiagramOptions } from '$lib/components/db/dataRepository';
    import NestedBlockOptionDialogue from '$lib/components/dialogues/NestedBlockOptionDialogue.svelte';
    import { getLabelRelations, idb } from '$lib/components/db/dexie';
    import { page } from '$app/state';
    import { liveQuery } from 'dexie';
    import ConditionalFormatDialogue from '$lib/components/dialogues/ConditionalFormatDialogue.svelte';

    const perspectiveId = parseInt(page.params.id, 10); // Get the perspective ID from the URL parameters
    const diagramId = parseInt(page.params.diagramid, 10); // Get the diagram ID from the URL parameters
    const currentOptions = liveQuery(() => idb.diagramOptions.get(diagramId)); // Fetch the current diagram options from the database


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
        const data = await idb.enteties.where('label').anyOfIgnoreCase(nestedBlockOptions.labelHierarchy).toArray(); // Fetch data based on the label hierarchy

        const ids = data.map((d) => d.id); // Extract IDs from the data
        const relationships = await idb.relationships.where('from').anyOf(ids).or('to').anyOf(ids).toArray(); // Fetch relationships based on the IDs
            
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
    let hasInitialized = $state(false); // Flag to check if the diagram has been initialized

    onMount(async () => {
      currentViewState.currentDiagramType = 'nestedblock'; // Set the current diagram type to nested block
      await tick(); // Wait for the DOM to update before proceeding


      const cssRoot = getComputedStyle(document.documentElement);
      colors = getPicoColors(cssRoot);

      if(!diagramId) {
        console.error('Diagram ID is not defined!'); // Log an error if the diagram ID is not defined
        return;
      }

      currentOptions.subscribe(async (options) => {
        if(!options) {
          console.error('Diagram options are not defined!'); // Log an error if the diagram options are not defined
          return;
        }

        if(options.labelHierarchy.length === 0) {
              openDialogueOption('nestedblockoptions'); // Open the options dialogue if no label hierarchy is set
              return;
          }

        optionsValid = true; // Set optionsValid to true when options are valid
        await buildNestedBlockDiagram(options); // Build the nested block diagram with the current options
        
        if(!hasInitialized){
          d3.select(svgContainer).call(
            (d3.zoom() as d3.ZoomBehavior<SVGSVGElement, unknown>)
                .scaleExtent([0.2, 5])
                .on('zoom', ({ transform }) => d3.select(groupContainer).attr('transform', transform)));
          hasInitialized = true; // Set hasInitialized to true when the diagram is initialized
        }
        

      });
    });

    onDestroy(() => {
        // Cleanup logic if needed
        currentViewState.currentDiagramType = 'none'; // Reset the current diagram type
        d3.select(svgContainer).on('.zoom', null); // Remove zoom event listener
    });
  </script>
{#if isDialogueOpen('nestedblockoptions')}
  <NestedBlockOptionDialogue perspectiveId={perspectiveId} optionsId={diagramId} />
{/if}

{#if isDialogueOpen('conditionalformatting')}
    <ConditionalFormatDialogue perspectiveId={perspectiveId} diagramId={diagramId} />
{/if}

  {#if calculating}
  <div style="display: flex; max-width: 300px; height: 100%; margin: auto;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150"><path fill="none" stroke={colors.primary} stroke-width="15" stroke-linecap="round" stroke-dasharray="300 385" stroke-dashoffset="0" d="M275 75c0 31-27 50-50 50-58 0-92-100-150-100-28 0-50 22-50 50s23 50 50 50c58 0 92-100 150-100 24 0 50 19 50 50Z"><animate attributeName="stroke-dashoffset" calcMode="spline" dur="2" values="685;-685" keySplines="0 0 1 1" repeatCount="indefinite"></animate></path></svg>
  </div>
  {/if}

  

  <svg bind:this={svgContainer} width="100%" height="90vh" style="border: 1px solid #ccc">
    <g bind:this={groupContainer} >
      {#if !calculating && $currentOptions}
      {#each rootNodes as node, idx}
          {@const { xRootOffset, yRootOffset } = getRootPosition(node, idx) } 

          <NestedBlockDiagram root={node} 
              nestedBlockOptions={$currentOptions}
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
