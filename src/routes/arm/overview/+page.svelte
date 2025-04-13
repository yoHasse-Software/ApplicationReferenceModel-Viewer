
<script lang="ts">

    import type { LevelNode } from "$lib/types";
    import * as d3 from 'd3';
    import { onMount } from "svelte";

    const width = 800;
    const height = 600;
    const radius = Math.min(width, height) / 2 - 10;


    let svgContainer: SVGSVGElement;
    let groupContainer: SVGGElement;

    const { data }: {
        data: {
            nodeTree: LevelNode[]
        }
    } = $props();

    onMount(() => {
        const svg = d3.select(svgContainer);
        const g = d3.select(groupContainer);
    
        svg.call(
            (d3.zoom() as d3.ZoomBehavior<SVGSVGElement, unknown>)
            .scaleExtent([0.5, 4])
            .on('zoom', ({ transform }) => g.attr('transform', transform))
        );

        const levelRoot: LevelNode = {
            id: crypto.randomUUID(),
            name: 'root',
            children: data.nodeTree[0].children,
            value: 0, // You can assign a value to the root node if needed
            isGroup: true


        };


        const root = d3.hierarchy(levelRoot, d => d.children)
            .sum(d => d.value || 1); // You can assign size from `value`

        const packLayout = d3.pack<LevelNode>().size([width, height]).padding(5);

        packLayout(root);

        d3.select(groupContainer).selectAll('circle')
            .data(root.descendants() as d3.HierarchyCircularNode<LevelNode>[])
            .enter()
            .append('circle')
            .attr('cx', (d: d3.HierarchyCircularNode<LevelNode>) => d.x)
            .attr('cy', (d: d3.HierarchyCircularNode<LevelNode>) => d.y)
            .attr('r', (d: d3.HierarchyCircularNode<LevelNode>) => d.r)
                .attr('fill', (d: d3.HierarchyCircularNode<LevelNode>) => {
                    switch (d.depth) {
                        case 0: return 'lightblue'; // Root node color
                        case 1: return 'lightgreen'; // First level color
                        case 2: return 'lightcoral'; // Second level color
                        default: return 'lightgray'; // Default color for deeper levels
                    }
                })
                .attr('stroke', 'black');
    });


</script>

<svg bind:this={svgContainer} width="100vh" height="100vh">
    <g id="graph" bind:this={groupContainer} width="100%" height="100%"></g>
</svg>




