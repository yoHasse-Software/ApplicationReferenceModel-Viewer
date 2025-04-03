<script lang="ts">
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
    import NodeGroup from './NodeGroup.svelte';
    import type { LevelNode } from '$lib/types';
    import { ConditionalFormattingRules, displayOptions, FilteredData } from '$lib/datastore.svelte';


    const LABEL_HEIGHT = 24;
    const PADDING = 10;

  
    let svgContainer: SVGSVGElement;
    let groupContainer: SVGGElement;
  
    let layoutNodes: d3.HierarchyRectangularNode<LevelNode>[] = $state([]);

    const VERTICAL_ON_STACKING = 2; // Number of nodes to force vertical stacking
        
    function estimateSizeForRoot(root: LevelNode): [number, number] {
        const maxDepth = getDepth(root);
        const leafCount = countLeaves(root);

        const width = Math.max(leafCount * 120, 500); // base width per leaf node
        // if(root.isGroup && root.children && root.children.length > VERTICAL_ON_STACKING){
        //     const verticalHeight = Math.max(maxDepth*root.children.length, 500); // base height per leaf node
        //     return [width, verticalHeight];
        // }
        const height = Math.max(maxDepth, 150);  // base height per level



        return [width, height];
    }

    function getDepth(node: LevelNode, current = 1): number {
        if (!node.children || node.children.length === 0) return current;
        return Math.max(...node.children.map(child => getDepth(child, current + 1)));
    }

    function countLeaves(node: LevelNode): number {
        if (!node.children || node.children.length === 0) return 1;
        return node.children.reduce((acc, child) => acc + countLeaves(child), 0);
    }
  
    function renderLayout(renderData: LevelNode[]) {
        layoutNodes = generateTreemapLayout(renderData); // Only take the first root for now
    }

    function getSum(node: LevelNode) {
        if(!node.isGroup){
            return LABEL_HEIGHT;
        }

        if(!node.children || node.children.length === 0) {
            return LABEL_HEIGHT;
        }

        return 0;

    }

    function customTile(node: d3.HierarchyRectangularNode<LevelNode>, x0: number, y0: number, x1: number, y1: number) {
        const childCount = node.children?.length || 0;
        if (node.depth === 0 && childCount > VERTICAL_ON_STACKING) { // Force vertical stacking for N2
            d3.treemapSlice(node, x0, y0, x1, y1);
        } else {
            d3.treemapBinary(node, x0, y0, x1, y1); // Horizontal for other levels
        }
    }

    function generateTreemapLayout(
        data: LevelNode[],
    ): d3.HierarchyRectangularNode<LevelNode>[] {
        const PADDING_BETWEEN_ROOTS = 20;

        const roots = data.map(node =>
            d3.hierarchy(node, d => d.children) as d3.HierarchyRectangularNode<LevelNode>
        );


        let currentYOffset = 0;

        roots.forEach(root => {

            const [w, h] = estimateSizeForRoot(root.data);

            const treemap = d3.treemap<LevelNode>()
                .size([w, h])
                .paddingInner(PADDING)
                .paddingOuter(PADDING)
                .paddingTop(LABEL_HEIGHT * 1.3)
                .round(true); // helps avoid subpixel jitter
            
 
            root.sum(d => getSum(d));

            treemap(root);


            root.each(node => {
                node.y0 += currentYOffset;
                node.y1 += currentYOffset;
            });

            currentYOffset += h + PADDING_BETWEEN_ROOTS;
        });

        return roots;

    }

    $effect(() => {
        displayOptions;
        ConditionalFormattingRules;
        renderLayout(FilteredData);
    });

    export function reRender() {
        renderLayout(FilteredData);
    }

    onMount(() => {
      const svg = d3.select(svgContainer);
      const g = d3.select(groupContainer);
  
      svg.call(
        (d3.zoom() as d3.ZoomBehavior<SVGSVGElement, unknown>)
          .scaleExtent([0.5, 4])
          .on('zoom', ({ transform }) => g.attr('transform', transform))
      );

    });



  </script>
  
  <svg bind:this={svgContainer} width="100%" height="90vh" style="border: 1px solid #ccc" overflow="hidden">
    <g bind:this={groupContainer} overflow="hidden">
        {#if layoutNodes}
        {#each layoutNodes as root}
            {#each root.descendants() as node (node.data.id)}
                {#if node.x1 - node.x0 > 1 && node.y1 - node.y0 > 1}
                    <NodeGroup
                        node={node.data}
                        x={node.x0}
                        y={node.y0}
                        width={node.x1 - node.x0}
                        height={node.y1 - node.y0}
                        depth={node.depth}
                    />
                {/if}

            {/each}
        {/each}
        {/if}
    </g>
  </svg>
  