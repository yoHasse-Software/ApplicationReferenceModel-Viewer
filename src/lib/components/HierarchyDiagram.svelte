<script lang="ts">
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
    import type { GroupLevel, AppSoftware, LevelNode } from '$lib/types';
    import { SvelteMap, SvelteSet } from 'svelte/reactivity';
    import { DimensionMap, setDimensionMap } from '$lib/datastore.svelte';
    import NodeGroup from './NodeGroup.svelte';
  
    const { data }: { data: GroupLevel[] } = $props();


    let displayData = $derived(data);
  
    let svgContainer: SVGSVGElement;
    let groupContainer: SVGGElement;
    let layoutNodes: LevelNode[] = $state([]);
    let layoutLinks: any[] = $state([]);

    let viewWidth: number = $state(0);
    let itemsPerRow: number = $state(3);
  
    const NODE_WIDTH = 150;
    const NODE_HEIGHT = 50;
    const BOX_PADDING = 10;
    const BLOCK_WIDTH = 140;
    const BLOCK_HEIGHT = 50;
    const GAP_X = 10;
    const GAP_Y = 10;





  
    onMount(() => {
        viewWidth = svgContainer?.clientWidth || 1000;
        itemsPerRow = Math.floor((viewWidth - 100) / (BLOCK_WIDTH + GAP_X))
        const svg = d3.select(svgContainer);
        const g = d3.select(groupContainer);
    
        svg.call(
            d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.5, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            })
        );
    
        renderLayout();
    });

    let collapsedGroups = new SvelteSet<string>();

    function toggleGroup(label: string) {
        if (collapsedGroups.has(label)) collapsedGroups.delete(label);
        else collapsedGroups.add(label);
        renderLayout(); // re-render after toggling
    }


    function convertToNodeIterative(root: GroupLevel): LevelNode {
        const nodeMap = new Map<string, LevelNode>();
        const childrenMap = new Map<string, LevelNode[]>(); // to collect children per parent
        const toProcess: Set<{ group: GroupLevel; parentId?: string }> = new Set();

        const rootId = crypto.randomUUID();
        const rootNode: LevelNode = { 
            id: rootId, 
            name: root.levelName,
            isGroup: true,
        };
        nodeMap.set(rootId, rootNode);

        toProcess.add({ group: root, parentId: undefined });

        // Set is used, but could also be Array if you want guaranteed FIFO/LIFO order
        while (toProcess.size > 0) {
            const [entry] = toProcess; // Get one from Set
            toProcess.delete(entry);

            const { group, parentId } = entry;
            const currentId = [...nodeMap.entries()].find(
                ([, node]) => node.name === group.levelName && node.parent === parentId
            )?.[0] ?? crypto.randomUUID();

            const currentNode = nodeMap.get(currentId) ?? {
                id: currentId,
                name: group.levelName,
                parent: parentId,
                isGroup: true,
            };

            // Store back in case it wasn't yet
            nodeMap.set(currentId, currentNode);

            // Prepare to add children
            const groupChildren: LevelNode[] = [];

            // Add AppSoftware as leaves
            if (group.children) {
                for (const app of group.children) {
                    const appNode: LevelNode = {
                        id: crypto.randomUUID(),
                        name: app.name,
                        parent: currentId,
                        isGroup: false,
                    };
                    groupChildren.push(appNode);
                    nodeMap.set(appNode.id, appNode);
                }
            }

            // Add nested groups
            if (group.groups) {
                for (const subgroup of group.groups) {
                    const subgroupId = crypto.randomUUID();
                    const subgroupNode: LevelNode = {
                        id: subgroupId,
                        name: subgroup.levelName,
                        parent: currentId,
                        isGroup: true,
                    };
                    nodeMap.set(subgroupId, subgroupNode);
                    groupChildren.push(subgroupNode);
                    toProcess.add({ group: subgroup, parentId: currentId });
                }
            }

            if (groupChildren.length > 0) {
                currentNode.children = groupChildren;
            }
        }

        return rootNode;
    }

    function convertToFlatNodeMapWithoutChildren(nodes: LevelNode[]): Map<string, LevelNode> {
        const flatMap = new Map<string, LevelNode>();
        const visitedNodes = new Set<string>();
        
        const stack: LevelNode[] = [...nodes];

        while (stack.length > 0) {
            const currentNode = stack.pop()!;
            if (visitedNodes.has(currentNode.id)) continue;

            visitedNodes.add(currentNode.id);

            
            if (currentNode.children) {
                stack.push(...currentNode.children);
            }
            const nodeWithoutChildren = { ...currentNode };
            delete nodeWithoutChildren.children; // Remove children to avoid deep copying
            flatMap.set(currentNode.id, nodeWithoutChildren);

        }

        return flatMap;
    }
  
    function generateNodeTree(groups: GroupLevel[]): LevelNode[] {
        const nodes: LevelNode[] = [];
        for (const group of groups) {
            const groupNode = convertToNodeIterative(group);
            nodes.push(groupNode);
        }
        return nodes;
    }

    function calculateWidths(nodes: LevelNode[]): SvelteMap<string, {height: number, width: number}> {
        const dimensions = new SvelteMap<string, {height: number, width: number}>();
        const flatNodes = convertToFlatNodeMapWithoutChildren(nodes);

        const baseWidth = BLOCK_WIDTH + BOX_PADDING * 2;
        const baseHeight = BLOCK_HEIGHT + BOX_PADDING * 2;

        for (const node of flatNodes.values()) {
            
            if (!node.parent){
                const width = baseWidth;
                const height = baseHeight;
                dimensions.set(node.id, {height, width});
                continue;
            }

            if (dimensions.has(node.parent)){
                const currentDimensions = dimensions.get(node.parent)!;
                const newWidth = currentDimensions.width + baseWidth;
                const newHeight = currentDimensions.height + baseHeight
                dimensions.set(node.parent, {height: newHeight, width: newWidth});
                continue;
            };

            const width = baseWidth;
            const height = BLOCK_HEIGHT + BOX_PADDING * 2;
            dimensions.set(node.parent, {height, width});
        }

        console.log(dimensions, 'dimensions');

        return dimensions;
        
    }



    function exportSvg() {
        const svgElement = svgContainer.cloneNode(true) as SVGSVGElement;
        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svgElement);

        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "architecture-diagram.svg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    

    function renderLayout() {
        console.log(displayData.length, 'displayData length');
        const nodes = generateNodeTree(displayData);

        setDimensionMap(calculateWidths(nodes));
        layoutNodes = nodes;
    }


    function onWindowResize() {
        viewWidth = svgContainer?.clientWidth || 1000;
        itemsPerRow = Math.floor((viewWidth - 100) / (BLOCK_WIDTH + GAP_X));
        renderLayout();
    }

    function snap(val: number) {
        return Math.round(val / 10) * 10;
    }

  </script>

  <svelte:window onresize={onWindowResize} />

  <button onclick={exportSvg}>Export SVG</button>

  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ccc" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect class="grid-bg" width="100%" height="100%" fill="url(#grid)" />
  <div class="grid">
    <svg bind:this={svgContainer} width="100%" height="100%" style="border: 1px solid #ccc">
        <g bind:this={groupContainer}>
        {#each layoutNodes as node, idx}
            <NodeGroup node={node} idx={idx} />
          {/each}
        </g>
      </svg>
  </div>

  

  <style>
  svg {
    width: 100%;
    height: 90vh;
    display: block;
  }

  rect {
    transition: all 0.3s ease-in-out;
  }

  text {
    pointer-events: none;
  }

  </style>
  