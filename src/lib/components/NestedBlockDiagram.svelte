<script lang="ts">
    import { onMount, tick } from 'svelte';
    import * as d3 from 'd3';
    import type { BlockNode, Entity, GraphData, RelationShip } from '$lib/types';
    import { ConditionalFormattingRules, DisplayOps, DisplayOpsStore, FilterDataStore, FilteredData, getLabels } from '$lib/datastore.svelte';
    import Block from './Block.svelte';

  
    let svgContainer: SVGSVGElement;
    let groupContainer: SVGGElement;

    const nodeMinWidth = 400; // initial width of child nodes
    const nodeMinHeight = 50; // initial height of child nodes
    const labelOffset = 24;
    const labelPadding = 4; // padding for label text

    const columns = 4;


    const nodePadding = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
    }

    const nodePaddingX = nodePadding.left + nodePadding.right;
    const nodePaddingY = nodePadding.top + nodePadding.bottom;


    $effect(() => {
        DisplayOps;
        ConditionalFormattingRules;

    });

    let heights: number[] = $state([]);
    let refs: HTMLDivElement[] = $state([]);


    function calculateNodeWidthAndHeight(node: BlockNode, totalWidth: number, totalHeight: number): { width: number, height: number } {
      
        const childrenCalculation = node.children?.map(child => {
          const calculated = calculateNodeWidthAndHeight(child, totalWidth, totalHeight)
          child.width = calculated.width;
          child.height = calculated.height;
          return calculated;
        }).reduce(({accWidht, accHeight}, val) => ({
            accWidht: accWidht + val.width,
            accHeight: accHeight + val.height
          }), { accWidht: 0, accHeight: 0 }) || { accWidht: 0, accHeight: 0 };

        const currentLevel = getLabels().indexOf(node.label) || 0;
        if(currentLevel === getLabels().length - 2){
          // Calculate width based on children devided by columns and height based on the number of children
          const childrenWidth = Math.max(nodeMinWidth, childrenCalculation.accWidht / columns) + nodeMinWidth; // Ensure minimum width
          const childrenHeight = Math.max(nodeMinHeight, childrenCalculation.accHeight) + nodeMinHeight; // Ensure minimum height
          return { width: childrenWidth, height: childrenHeight };
        }

        const width = Math.max(nodeMinWidth, childrenCalculation.accWidht + nodeMinWidth) + nodePaddingX; // Ensure minimum width
        const height = Math.max(nodeMinHeight, childrenCalculation.accHeight + nodeMinHeight) + nodePaddingY; // Ensure minimum height

        return { width, height };
    }

    function buildHierarchy(nodes: Entity[], relationships: RelationShip[]) {
      const nodeMap = new Map(nodes.map(n => [n.id, { ...n, children: [] as BlockNode[], width: nodeMinWidth, height: nodeMinHeight, x: 0, y: 0 }]));

      relationships.forEach(rel => {
        const parent = nodeMap.get(rel.from);
        const child = nodeMap.get(rel.to);
        if (parent && child) {
          if(parent.children.some(c => c.id === child.id)) {
            $inspect("child already exists", child, parent.children); // Debugging line to check if the child already exists
            return; // Avoid adding the same child again
          }
          parent.children.push(child);
        }
      });

      const roots = Array.from(nodeMap.values())
        .filter(n => n.label === getLabels()[0])
        .map(n => {
          const {width, height} = calculateNodeWidthAndHeight(n, nodeMinWidth, nodeMinHeight);

          n.width = width;
          n.height = height;
          return n;
        }) as BlockNode[];

      // just return the root nodes
      return roots;
    }

    const levelColors = [
      '#FFDDC1', // Level 0
      '#FFABAB', // Level 1
      '#FFC3A0', // Level 2
      '#FF677D', // Level 3
      '#D4A5A5', // Level 4
      '#392F5A'  // Level 5
    ];


    function drawNode(node: BlockNode, parentGroup: d3.Selection<SVGGElement, unknown, null, undefined>, isRoot: boolean = false, previousNode: BlockNode | undefined = undefined) {

      const level = getLabels().indexOf(node.label) || 0;
      const sameLabel = previousNode ? node.label === previousNode.label : false;
      

      const xPos = () => {
        if (isRoot) {
          return 0; // Root node is always at x = 0
        } else if (sameLabel) {
          return previousNode ? previousNode.x + previousNode.width : 0; // Same label, position next to the previous node
        } else {
          return previousNode ? previousNode.x : 0; // Different label, position at the same x as the previous node
        }
      };
      const yPos = () => {
        if (isRoot) {
          return previousNode ? previousNode.y + previousNode.height : 0; // Root node is always at y = 0
        } else if (sameLabel) {
          return  previousNode ? 0 : 0; // Same label, position below the previous node
        } else {
          return previousNode ? previousNode.y : 0; // Different label, position at the same y as the previous node
        }
      };

      node.x = xPos() + nodePaddingX; // Set the x position of the node
      node.y = yPos() + nodePaddingY; // Set the y position of the node

      const group = parentGroup.append("g")
        .attr("data-nodename", node.name)
        .attr("data-label", node.label)
        .attr("transform", `translate(${node.x}, ${node.y})`);
      
      group.append("rect")
        .attr("width", node.width)
        .attr("height", node.height)
        .attr("data-label", node.label)
        .attr("data-nodename", node.name)
        .attr("fill", levelColors[level % levelColors.length])
        .attr("stroke", "#333");

      group.append("text")
        .attr("x", 0 + labelPadding)
        .attr("y", 0 + labelOffset + labelPadding)
        .text(`${node.name} - ${node.label}` || node.id);


      
      // Do a foreach which sends the child node and also previous node to the next level
      node.children?.reduce((prev, child) => {
        if(prev.id === node.id){
          drawNode(child, group, false);
          return child;
        }

        drawNode(child, group, false, prev);
        return child; // Return the current child as the previous node for the next iteration
      }, node); // Start with the current node as the previous node


    }

    function drawBlockDiagram(orgData: GraphData, svg: d3.Selection<SVGGElement, unknown, null, undefined>) {
      const rootNodes = buildHierarchy(orgData.nodes, orgData.relationships);
        const rootNode: BlockNode = {
            id: 'root',
            name: 'Root',
            label: 'Root',
            metadata: {},
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            children: rootNodes
        };

        // const root = d3.hierarchy<BlockNode>(rootNode, d => d.children);

        // let width = 0;
        // let height = 0;
        // root.each(d => {
        //     width = Math.max(width, d.data.width);
        //     height += d.data.height + labelPadding; // Add padding between nodes
        // });

        // const treeLayout = d3.tree<BlockNode>().size([width, height]);
        // root.sort((a, b) => d3.ascending(a.data.label, b.data.label)); // Sort by label
        // treeLayout(root);
        const checkedNodes = new Set<string>(); // Set to keep track of checked nodes

        rootNode.children?.reduce((prev, node) => {

          if(prev.id === rootNode.id) {
              drawNode(node, svg, true);
              return node;
          }


          node.x = prev.x + prev.width + labelPadding; // Set the x position of the node
          node.y = prev.y; // Set the y position of the node to be the same as the previous node

          drawNode(node, svg, true, prev);
          return node; // Return the current node as the previous node for the next iteration
        }, rootNode); // Start with the root node as the previous node
        return rootNodes;
    }

    async function updateHeights() {
        await tick(); // wait for DOM

        heights = refs.map(el => el?.scrollHeight || 0);
    }

    onMount(() => {
      const svg = d3.select(svgContainer);
      const g = d3.select(groupContainer);
  
        svg.call(
          (d3.zoom() as d3.ZoomBehavior<SVGSVGElement, unknown>)
            .scaleExtent([0.5, 4])
            .on('zoom', ({ transform }) => g.attr('transform', transform))
        );
          
        FilterDataStore.subscribe(async (data) => {
          if (data) {
              await updateHeights();
          }
        });

        DisplayOpsStore.subscribe(async (data) => {
          if (data) {
              await updateHeights();
          }
        });

        drawBlockDiagram(FilteredData, g);

    });




  </script>
  
  <svg bind:this={svgContainer} width="100%" height="90vh" style="border: 1px solid #ccc">
    <g bind:this={groupContainer} >

    </g>
  </svg>
  

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