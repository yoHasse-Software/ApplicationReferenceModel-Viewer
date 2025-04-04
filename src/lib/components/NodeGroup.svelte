<script lang="ts">
    import { getConditionalRules, getStylingFromRules } from "$lib/datastore.svelte";
    import type { LevelNode } from "$lib/types";
    import { onMount } from "svelte";

    const { node, x, y, width, height, depth }:{
        node: LevelNode,
        x: number,
        y: number,
        width: number,
        height: number,
        depth: number
    } = $props();

    const colors = ['#dfe6e9', '#b2bec3', '#74b9ff', '#a29bfe', '#6c5ce7'];
    const color = colors[depth % colors.length];
    const LABEL_HEIGHT = 24;

    
    let displayThis = $state(true);

    let styleString = $state("");
    let extraContent = $state('');

    onMount(() => {
      const conditionalRules = getConditionalRules(node);
      styleString = getStylingFromRules(conditionalRules);

      const content = conditionalRules.find(rule => rule.styling.content)?.styling.content;
      if (content) {
        extraContent = content;
      }
      

    });

    

</script>

{#if displayThis}

<!-- <foreignObject x={x} y={y} width={width} height={400}>
  <article>
    <header>
      {#if depth === 0}
        <h1>{node.name} {extraContent}</h1>
      {:else if depth === 1}
        <h2>{node.name} {extraContent}</h2>
      {:else if depth === 2}
        <h3>{node.name} {extraContent}</h3>
      {:else if depth === 3}
        <h4>{node.name} {extraContent}</h4>
      {/if}
    </header>

    <div class="content" style={styleString}>

    </div>
  </article>

</foreignObject> -->

<g transform={`translate(${x}, ${y})`} >
  <rect
    data-depth={depth}
    width={width}
    height={height}
    stroke-width="1"
    style={styleString}

    rx="4"
  />

  {#if height > LABEL_HEIGHT}
    
    <rect width={width} height={LABEL_HEIGHT}     style={styleString} opacity={0.1}  data-tooltip="{node.name}"/>
    <text data-depth={depth} x="8" y={LABEL_HEIGHT / 2 + 4} font-size="12" font-weight="bold" >
        {node.name} {extraContent}
    </text>
    
  {/if}

</g>

{/if}

<style>
  g>rect[data-depth="0"] {
    fill: var(--pico-primary-background);
  }

  text[data-depth="0"] {
    color: var(--pico-secondary-inverse);
  }

  g>rect[data-depth="1"] {
    fill: var(--pico-background-color);

  }

  text[data-depth="1"] {
    color: var(--pico-primary-foreground);
  }

  g>rect[data-depth="2"] {
    fill: var(--pico-secondary-background);
  }

  text[data-depth="2"] {
    color: var(--pico-secondary-inverse);
  }

  g>rect[data-depth="3"] {
    fill: var(--pico-primary-background);
  }

  text[data-depth="3"] {
    color: var(--pico-secondary-inverse);
  }
</style>