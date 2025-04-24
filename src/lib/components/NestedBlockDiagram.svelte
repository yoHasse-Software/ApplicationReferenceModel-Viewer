
<script lang="ts">
    import { onMount, tick } from 'svelte';
    import * as d3 from 'd3';
    import type { BlockNode, Entity, GraphData, RelationShip } from '$lib/types';
    import { ConditionalFormattingStore, DisplayOpsStore, FilterDataStore, FilteredData, getConditionalRules, getData, getDisplayOptions } from '$lib/datastore.svelte';
    import { wrap } from '$lib/d3Utils';
    import { SvelteMap } from 'svelte/reactivity';
    import { getPicoColors } from '$lib/colorUtils';

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

    let minimap: HTMLDivElement;
    

    const fontSettings = {
        fontSize: 24,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'normal'
    }
    const titleMargin = {
        top: 10,
        bottom: 10,
        right: 10,
        left: 10
    }

    const nodeMargin = {
        top: 20,
        bottom: 20,
        right: 20,
        left: 20
    }

    const nodeMarginY = nodeMargin.top + nodeMargin.bottom;
    const labelMarginY = titleMargin.top + titleMargin.bottom;
    const nodePaddingY = nodeMarginY + labelMarginY + fontSettings.fontSize; // Padding between nodes


    const nodeMinWidth = fontSettings.fontSize * 16.6 ; // initial width of child nodes
    const nodeMinHeight = fontSettings.fontSize * 2; // initial height of child nodes

    const colors = new SvelteMap<string, string[]>();

    const getLabels = () => {
        return getData().nodes.map(node => node.label)
            .filter((label, index, self) => label && self.indexOf(label) === index)
            .sort((a, b) => {
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            });
    };

    function computeSize(node: BlockNode): { width: number, height: number } {
      const levelRvsIdx = (getLabels().toReversed().indexOf(node.label) + 1);
      const levelMinheight = nodeMinHeight * levelRvsIdx; // Minimum width based on the level of the node
      const levelMinWidth = nodeMinWidth * levelRvsIdx; // Minimum width based on the level of the node

      const debug = getLabels().toReversed()[levelRvsIdx-2];

      if(!node || !node.children || node.children.length === 0) {
        // Get the potential width of children
        const childWidth =  levelRvsIdx - 2 > 0 ? nodeMinWidth * (levelRvsIdx-2) : nodeMinWidth; // Minimum width based on the level of the node
        node.width = childWidth;
        node.height = levelMinheight; // Set the height of the node to the minimum height
        return { width: childWidth, height: levelMinheight };
      }


      let totalWidth = 0;
      let totalHeight = 0;

      const childHeights = new Map<string, number>(); // Map to store the heights of each row group
      const childLabel = node.children[0].label || ""; // Get the label of the first child node
      const childColumns = getDisplayOptions().nestedBlockOptions.columnsPerLabel[childLabel] || 1; // Get the number of columns for the child node label

      node.children.forEach((child, idx) => {
        const childSize = computeSize(child);
        if(childColumns > idx){ // Stop adding width if we have reached the max columns
          totalWidth += childSize.width + nodeMargin.left; // Add padding between nodes
        }
        childHeights.set(child.id, childSize.height); // Store the height of the child node
      });

      // 1. Group the children by their row index
      const rows = Math.ceil(node.children.length / childColumns); // Calculate the number of rows based on the number of columns
      const rowGroups = Array.from({ length: rows }, (_, i) => node.children?.slice(i * childColumns, (i + 1) * childColumns));

      // 2. Calculate the max height for each row group
      const rowHeights = rowGroups.map(row => {
        if (!row) return 0;
        return Math.max(...row.map((child, idx) => {
          const childNodeHeight = childHeights.get(child.id) || 0; // Get the height of the child node from the map
          return childNodeHeight; // Add padding between rows
        }));
      });

      // 3. Set the height of each child node to the max height of its row group
      node.children.forEach((child, idx) => {
        const rowIndex = Math.floor(idx / childColumns);
        const rowHeight = rowHeights[rowIndex] || 0;
        child.height = rowHeight; // Set the height of the child node to the max height of its row group
      });

      // 4. Set the total height of the node to the sum of the row heights
      totalHeight = rowHeights.reduce((acc, height) => acc + height + nodeMargin.top, 0) - nodeMargin.top; // Add padding between rows
      totalHeight += nodePaddingY; // Add padding for the label and header
      

      totalWidth += nodeMargin.left; // Remove padding from the last child

      node.width = Math.max(nodeMinWidth, totalWidth); 
      node.height = Math.max(levelMinheight, totalHeight);


      return {
        width: Math.max(nodeMinWidth, totalWidth),
        height: Math.max(levelMinheight, totalHeight) 
      };
      

    }

    function computePosition(node: BlockNode, parentNode: BlockNode, previousNode: BlockNode | undefined = undefined) {

      const isRoot = parentNode.id === 'root'; // Check if the node is a root node
      const thisIndex = parentNode.children!.findIndex(n => n.id === node.id); // Get the index of the current node in the parent's children array
      const nodeColumns = getDisplayOptions().nestedBlockOptions.columnsPerLabel[node.label] || 1; // Get the number of columns for the node label

      const newRow = thisIndex % nodeColumns === 0; // Check if the current node is the first in a new row

      const xPos = () => {
        if(!previousNode){
          return isRoot ? 0 : nodeMargin.left; // First node in the row, set x to 0
        }
        if (isRoot) {
          return newRow ? 0 : previousNode.x + previousNode.width + nodeMargin.left; // Root node is always at x = 0
        } else if (newRow) {
          return nodeMargin.left; // reset
        } else {
          return previousNode.x + previousNode.width + nodeMargin.left; // Same row, position at the same x as the previous node
        }
      };

      const yPos = () => {
        if(!previousNode){
          return nodeMargin.top + labelMarginY + fontSettings.fontSize; // First node in the row, set y to 0
        }
        if (isRoot) {
          return newRow ? previousNode.y + previousNode.height + nodeMargin.top : previousNode.y; // Root node is always at y = 0
        } else if (newRow) {
          return previousNode.y + previousNode.height + nodeMargin.top; // New row, position below the previous node
        } else {
          return previousNode.y; // Same row, position at the same y as the previous node
        }
      };

      node.x = xPos(); // Set the x position of the node
      node.y = yPos(); // Set the y position of the node to be the same as the previous node

      if(!node.children){
        return;
      }

      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const previousChild = i > 0 ? node.children[i - 1] : undefined; // Get the previous child node

        computePosition(child, node, previousChild);
      }

    }

    function buildHierarchy(nodes: Entity[], relationships: RelationShip[]) {
      const nodeMap = new Map(nodes.map(n => [n.id, { ...n, children: [] as BlockNode[], width: nodeMinWidth, height: nodeMinHeight, x: 0, y: 0 }]));

      relationships.forEach(rel => {
        const from = rel.type !== "SUPPORTS" ? rel.from : rel.to; // Get the from node based on the relationship type
        const to = rel.type !== "SUPPORTS" ? rel.to : rel.from; // Get the to node based on the relationship type

        const parent = nodeMap.get(from);
        const child = nodeMap.get(to);
        if (parent && child) {
          if(parent.children.some(c => c.id === child.id)) {
            return; 
          }
          parent.children.push(child);
        }
      });

      const roots = Array.from(nodeMap.values())
        .filter(n => n.label === getLabels()[0]);

      const fakeRoot = {
        id: 'root',
        name: 'Root',
        label: 'Root',
        metadata: {},
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        children: roots
      };

      computeSize(fakeRoot); // Compute the size of the fake root node
      for (let index = 0; index < fakeRoot.children.length; index++) {
        const child = fakeRoot.children[index];
        const previousChild = index > 0 ? fakeRoot.children[index - 1] : undefined; // Get the previous child node
        computePosition(child, fakeRoot, previousChild); // Compute the position of the child node
      }

      // just return the root nodes
      return roots;
    }



    function drawNode(node: BlockNode, parentGroup: any) {
      const level = getLabels().indexOf(node.label) || 0;
      const isLeaf = level === getLabels().length - 1;

      const fillColor = isLeaf ? colors.get('primary') : level % 2 === 0 ? colors.get('secondary') : colors.get('contrastInverse');
      const textColor =  isLeaf ? colors.get('contrastInverse') : level % 2 === 0 ? colors.get('contrastInverse') : colors.get('secondary');

      const conditionalFormatting = getConditionalRules(node);

      const textContent = conditionalFormatting.filter(rule => rule.styling.content)
        .map(rule => rule.styling.content).join(' ');

      const bgColor = conditionalFormatting.findLast(rule => rule.styling.backgroundColor.isSet)?.styling.backgroundColor.color || fillColor || "#fff";

      // Only use the last color if multiple rules are applied
      const borderColor = conditionalFormatting.findLast(rule => rule.styling.borderColor.isSet)?.styling.borderColor.color || fillColor || "#fff";
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
          .attr("height", fontSettings.fontSize + titleMargin.top + titleMargin.bottom)
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
        .attr("fill", "none") // No fill for the border
        .attr("stroke-width", 8) // Border width
        .attr("stroke", borderColor || "#fff");

      group.append("text")
        .attr("x", 0 + titleMargin.left)
        .attr("y", 0 + titleMargin.top + fontSettings.fontSize* 0.9) // Adjust the y position to center the text vertically
        .attr("font-size", fontSettings.fontSize)
        .attr("font-family", fontSettings.fontFamily)
        .attr("font-weight", fontSettings.fontWeight)
        .attr("fill", textColor || "#000")
        .text(`${node.name} ${textContent}`)
        .call(wrap, node.width - titleMargin.left - titleMargin.right); // Wrap the text to fit within the node width


      
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

    

    onMount(() => {

      const cssRoot = getComputedStyle(document.documentElement);
        const picoColors = getPicoColors(cssRoot);

        (Object.keys(picoColors) as Array<keyof typeof picoColors>).forEach((key, idx) => {
          const color = picoColors[key];
          colors.set(key, [color]);
        });


        drawBlockDiagram(root, d3.select(group));
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