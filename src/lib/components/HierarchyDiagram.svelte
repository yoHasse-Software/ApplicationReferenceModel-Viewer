<script lang="ts">
    import { onMount, tick } from 'svelte';
    import * as d3 from 'd3';
    import NodeGroup from './NodeGroup.svelte';
    import type { LevelNode } from '$lib/types';
    import { ConditionalFormattingRules, DisplayOps, DisplayOpsStore, FilterDataStore, FilteredData, getConditionalRules, getStyling, N2WIDTH, N3WIDTH } from '$lib/datastore.svelte';
    import NLevelView from './NLevelView.svelte';


  
    let svgContainer: SVGSVGElement;
    let groupContainer: SVGGElement;
  


    $effect(() => {
        DisplayOps;
        ConditionalFormattingRules;

    });


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

    });

    let heights: number[] = $state([]);
    let refs: HTMLDivElement[] = $state([]);

    async function updateHeights() {
        await tick(); // wait for DOM

        heights = refs.map(el => el?.scrollHeight || 0);
    }

    function getWidth(node: LevelNode) {
        let multiplier = 1;
        if(DisplayOps.showN1){
            multiplier = N2WIDTH;
        }else if(DisplayOps.showN2){
            multiplier = N2WIDTH;
        }else if(DisplayOps.showN3){
            multiplier = N3WIDTH;
        }else if(DisplayOps.showApps){
            multiplier = N3WIDTH;
        }

        return Math.min(3,Math.round((node.children?.length || 0))) * multiplier;
    }



  </script>
  
  <svg bind:this={svgContainer} width="100%" height="90vh" style="border: 1px solid #ccc">
    <g bind:this={groupContainer} >
        {#each FilteredData as root, idx}
        <g
            x={0}
            y={heights.slice(0, idx).reduce((sum, h) => sum + h + 20, 0)} 
            width={getWidth(root) || 500}
            height={5000} >
                <NLevelView level={1} node={root} title={root.name} displayLevel={DisplayOps.showN1} gridChildren={true} nodeChildCount={root.children?.length || 0}>
                    {#each (root.children || []) as n2Block}
                      <NLevelView level={2} node={n2Block} title={n2Block.name} displayLevel={DisplayOps.showN2} gridChildren={true} nodeChildCount={n2Block.children?.length || 0}>
                        {#each (n2Block.children || []) as n3Block}
                          <NLevelView level={3} node={n3Block} title={n3Block.name} displayLevel={DisplayOps.showN3} gridChildren={true} nodeChildCount={n3Block.children?.length || 0}>
                              {#each (n3Block.children || []) as app}
                                <NLevelView level={4} node={app} isLeaf={true} styling={getStyling(app)} title={app} displayLevel={DisplayOps.showApps} addHeader={false}>
                                        <text>{app.name}</text>
                                </NLevelView>
                              {/each}
                          </NLevelView>
                        {/each}
                      </NLevelView>
                    {/each}
                </NLevelView>
              </g>
        {/each}
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