

<script lang="ts">
    import { DimensionMap, PositionMap } from "$lib/datastore.svelte";
    import type { LevelNode } from "$lib/types";
    import Self from './NodeGroup.svelte';
    const BLOCK_WIDTH = 140;
    const BLOCK_HEIGHT = 50;

    const { node, idx }: { node: LevelNode, idx: number } = $props();

    const { top, left } = calculatePosition(node, idx);


    function calculatePosition(node: LevelNode, idx: number) {
        let top = 0;
        let left = 0;

        if(!node.parent){
            console.log("No parent found for node", node.id);
            PositionMap.set(node.id, { top: BLOCK_HEIGHT*idx, left: BLOCK_WIDTH*idx });
        }

        if(node.parent ){
            if(!PositionMap.has(node.parent!)){
                PositionMap.set(node.parent!, { top: 0, left: 0 });
            }
            const parentPos = PositionMap.get(node.parent)!;
            top = parentPos.top + (BLOCK_HEIGHT + 10) * idx;
            left = parentPos.left + (BLOCK_WIDTH + 10) * idx;
        }

        else {
            top = BLOCK_HEIGHT * idx;
            left = (BLOCK_WIDTH + 10) * idx;
        }
        // Store the position in the PositionMap for future reference
        PositionMap.set(node.id, { top, left });

        return { top, left };
    }



</script>


<g transform={`translate(${top}, ${left})`}>
    <rect
      width={DimensionMap.get(node.id)?.width || BLOCK_WIDTH}
      height={DimensionMap.get(node.id)?.height || BLOCK_HEIGHT}
      fill={node.isGroup ? '#dfe6e9' : '#a29bfe'}
      stroke={node.isGroup ? '#2d3436' : '#6c5ce7'}
      rx="6"
    />
    <text x="10" y="15" font-size="13">
      {node.name}
    </text>
    {#if node.children}
        {#each node.children as child, childIdx}
            <Self node={child} idx={childIdx} />
        {/each}
    {/if}
</g>