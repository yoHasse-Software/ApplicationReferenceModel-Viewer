<script lang="ts">
  import type { BlockNode } from "$lib/types";
  import Block from "./Block.svelte"; // Self-import for the current component

  const labelOffset = 24; // offset for label text

  const { node, idx }
  :{ node: BlockNode, idx: number } = $props();



</script>

<rect
  x={node.x}
  y={node.y - labelOffset}
  width={node.width}
  height={node.height}
  fill="lightblue"
  stroke="black"
  stroke-width="1"
  rx="4"
  ry="4"
  data-tooltip={node.name}
  data-label={node.label}
  data-id={node.id}
></rect>

<text
  y={node.y + labelOffset * 0.5}
  x={node.x + labelOffset * 0.5}
>{node.name} - {node.label}</text>

{#each node.children ?? [] as child, i}
  <Block node={child} idx={i} />
{/each}



