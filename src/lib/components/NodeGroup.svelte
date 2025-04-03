<script lang="ts">
    const { node, x, y, width, height, depth } = $props();

    const colors = ['#dfe6e9', '#b2bec3', '#74b9ff', '#a29bfe', '#6c5ce7'];
  const color = colors[depth % colors.length];

  const LABEL_HEIGHT = 24;
</script>

<g transform={`translate(${x}, ${y})`}>
  <rect
    width={width}
    height={height}
    fill={color}
    stroke="#2d3436"
    stroke-width="1"
    rx="4"
  />

  {#if height > LABEL_HEIGHT}
    <rect width={width} height={LABEL_HEIGHT} fill="#2d3436" opacity={0.1} />
    <text x="8" y={LABEL_HEIGHT / 2 + 4} font-size="12" font-weight="bold"
    overflow="hidden"
    style="white-space: nowrap;">
      {node.name}
    </text>
  {/if}
</g>