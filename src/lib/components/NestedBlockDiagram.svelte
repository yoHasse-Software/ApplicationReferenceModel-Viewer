
<script lang="ts">
    import { onMount, tick } from 'svelte';
    import * as d3 from 'd3';
    import type { BlockNode} from '$lib/types';
    import { conditionalFormatting, diagramOptions, emptyOptions, getConditionalRules} from '$lib/datastore.svelte';
    import { wrap } from '$lib/d3Utils';
    import { SvelteMap } from 'svelte/reactivity';
    import { getPicoColors } from '$lib/colorUtils';
    import type { DiagramOptions } from './db/dataRepository';
    
    const { 
        root,
        updateTooltipText,
        xRootOffset = 0,
        yRootOffset = 0,

     }: { 
        root: BlockNode,
        updateTooltipText: (text: string[]) => void,
        xRootOffset?: number,
        yRootOffset?: number,
     } = $props();

    let group: SVGGElement;

    const colors = new SvelteMap<string, string[]>();



     let displayOptions: DiagramOptions = $state({
      ...emptyOptions,
      diagramType: 'nestedblock',
     })


    function drawNode(node: BlockNode, parentGroup: any) {
      const options = displayOptions;
      const levelIdx = options.labelHierarchy.indexOf(node.label) || 0;
      const level = levelIdx > -1 ? levelIdx : 0; // Default to 0 if not found
      const isLeaf = level === options.labelHierarchy.length - 1;

      const fillColor = isLeaf ? colors.get('primary') : level % 2 === 0 ? colors.get('secondary') : colors.get('contrastInverse');
      const textColor =  isLeaf ? colors.get('contrastInverse') : level % 2 === 0 ? colors.get('contrastInverse') : colors.get('secondary');

      const conditionalFormatting = getConditionalRules(node);

      const textContent = conditionalFormatting.filter(rule => rule.styling.content)
        .map(rule => rule.styling.content).join(' ');

      const bgColor = conditionalFormatting.findLast(rule => rule.styling.backgroundColor.isSet)?.styling.backgroundColor.color || fillColor || "#fff";

      // Only use the last color if multiple rules are applied
      const borderColor = conditionalFormatting.findLast(rule => rule.styling.borderColor.isSet)?.styling.borderColor.color || fillColor || "#fff";

      const titleModel = options.titleModel || displayOptions.titleModel!;

      const group = parentGroup.append("g")
        .attr("data-nodename", node.name)
        .attr("data-label", node.label)
        .attr("transform", `translate(${node.x}, ${node.y})`);
      
      group.append("rect")
        .attr("width", node.width)
        .attr("height", node.height)
        .attr("data-label", node.label)
        .attr("data-nodename", node.name)
        .attr("fill", bgColor || "#fff")
        .attr("rx", 10) // Rounded corners
        .attr("ry", 10); // Rounded corners


      
      if(node.children && node.children.length > 0){
        group.append("rect") // Title background
          .attr("width", node.width)
          .attr("height", titleModel.fontSettings.fontSize + titleModel.offsets.top + titleModel.offsets.bottom)
          .attr("fill", bgColor || "#fff")
          .attr("rx", 10) // Rounded corners
          .attr("ry", 10); // Rounded corners
           // Border width
      }

      group.append("rect")
        .attr("width", node.width)
        .attr("height", node.height)
        .attr("rx", 10) // Rounded corners
        .attr("ry", 10) // Rounded corners
        .attr("fill", "none") // No fill for the bord
        .attr("stroke", borderColor || "#000")
        .attr("stroke-width", 2); // Border width
        

      group.append("text")
        .attr("x", 0 + titleModel.offsets.left)
        .attr("y", 0 + titleModel.offsets.top + titleModel.fontSettings.fontSize * 0.9) // Adjust the y position to center the text vertically
        .attr("font-size", titleModel.fontSettings.fontSize)
        .attr("font-family", titleModel.fontSettings.fontFamily)
        .attr("font-weight", titleModel.fontSettings.fontWeight)
        .attr("fill", textColor || "#000")
        .text(`${node.name} ${textContent}`)
        .call(wrap, node.width - titleModel.offsets.left - titleModel.offsets.right); // Wrap the text to fit within the node width


      
      // Do a foreach which sends the child node and also previous node to the next level
      node.children?.reduce((prev, child, idx) => {
        if(prev.id === node.id){
          drawNode(child, group);
          return child;
        }

        drawNode(child, group); // Pass the previous node to the child node
        return child; // Return the current child as the previous node for the next iteration
      }, node); // Start with the current node as the previous node


    }

    function drawBlockDiagram(orgData: BlockNode, groupContainer: d3.Selection<SVGGElement, unknown, null, undefined>) {
      // clear the groupContainer
      // groupContainer.remove(); // Clear the SVG before drawing

      orgData.children?.reduce((prev, node, idx) => {
          if(prev.id === orgData.id) {
              drawNode(node, groupContainer); // Draw the root node
              return node;
          }

          drawNode(node, groupContainer);
          return node; // Return the current node as the previous node for the next iteration
        }, orgData); // Start with the root node as the previous node
    }

    let initialized = $state(false); // Flag to check if the diagram is initialized
    

    onMount(() => {

      const cssRoot = getComputedStyle(document.documentElement);
        const picoColors = getPicoColors(cssRoot);

        (Object.keys(picoColors) as Array<keyof typeof picoColors>).forEach((key, idx) => {
          const color = picoColors[key];
          colors.set(key, [color]);
        });
        

        conditionalFormatting.subscribe((data) => {
          console.log("Conditional formatting data: "); // Log the conditional formatting data for debugging
          if (data && initialized) {
            console.log("Conditional formatting data: ", data); // Log the conditional formatting data for debugging
            drawBlockDiagram(root, d3.select(group));
          }
        });

        diagramOptions.subscribe((state) => {
          const currentOptions = state.find((option) => option.diagramType === 'nestedblock');
          if (currentOptions && initialized) {
            displayOptions = currentOptions;
            drawBlockDiagram(root, d3.select(group));
          }
        });

        drawBlockDiagram(root, d3.select(group));


        initialized = true; // Set initialized to true after the first render

    });


  </script>

  <!-- <button onclick={print} >Print</button> -->
  <g bind:this={group} data-nodename={root.name} transform="translate({xRootOffset}, {yRootOffset})" class="arcs-layer">
  </g>

  

  <style>

    .app-content {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .app-content>span {
        font-weight: bold;
        margin-right: 0.5rem;
    }

    .app-content>div {
        float: right;
    }

    .app-content .formats {
        border-bottom: unset;

    }
  </style>