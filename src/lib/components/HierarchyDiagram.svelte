<script lang="ts">
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
    import NodeGroup from './NodeGroup.svelte';
    import type { LevelNode } from '$lib/types';
  
    const { data }:{ data: LevelNode[]} = $props();

    const LABEL_HEIGHT = 24;

  
    let svgContainer: SVGSVGElement;
    let groupContainer: SVGGElement;
  
    let layoutNodes: d3.HierarchyRectangularNode<LevelNode>[] = $state([]);
        
  
    function renderLayout() {
      const width = svgContainer.clientWidth || 5000;
      const height = svgContainer.clientHeight || 9000;
      layoutNodes = generateTreemapLayout(data, width, height); // Only take the first root for now
    }
    function generateTreemapLayout(
    data: LevelNode[],
    width: number,
    height: number
): d3.HierarchyRectangularNode<LevelNode>[] {
    const PADDING_BETWEEN_ROOTS = 20;

    const roots = data.map(node =>
        d3.hierarchy(node, d => d.children) as d3.HierarchyRectangularNode<LevelNode>
    );

    const treemap = d3.treemap<LevelNode>()
        .size([width, height])
        .paddingInner(10)
        .paddingOuter(10)
        .paddingTop(LABEL_HEIGHT*1.3);

    let currentYOffset = 0;

    roots.forEach(root => {
        // Ensure empty leaves are visible
        root.eachBefore(node => {
            if (!node.children && node.value === 0) {
                node.data.value = 1;
            }
        });

        root.sum(d => 1);
        treemap(root);

        const rootHeight = root.y1 - root.y0;

        root.each(node => {
            node.y0 += currentYOffset;
            node.y1 += currentYOffset;
        });

        currentYOffset += rootHeight + PADDING_BETWEEN_ROOTS;
    });

    return roots;

    // Helper: recursively shift each group’s children
    function shiftChildrenForLabels(node: d3.HierarchyRectangularNode<LevelNode>, dy: number) {
        if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
                child.y0 += dy;
                child.y1 += dy;
            });

            node.children.forEach(child => shiftChildrenForLabels(child, dy));
        }
    }
}


    onMount(() => {
      const svg = d3.select(svgContainer);
      const g = d3.select(groupContainer);
  
      svg.call(
        (d3.zoom() as d3.ZoomBehavior<SVGSVGElement, unknown>)
          .scaleExtent([0.5, 4])
          .on('zoom', ({ transform }) => g.attr('transform', transform))
      );

  
      renderLayout();
    });


    function getMinimumNodeHeight(node: d3.HierarchyRectangularNode<LevelNode>) {
        const calculatedHeight = node.y1 - node.y0 - node.depth * LABEL_HEIGHT;
        return Math.max(calculatedHeight, LABEL_HEIGHT*1.1);
    }
  </script>
  
  <svg bind:this={svgContainer} width="100%" height="90vh" style="border: 1px solid #ccc">
    <g bind:this={groupContainer}>
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
  