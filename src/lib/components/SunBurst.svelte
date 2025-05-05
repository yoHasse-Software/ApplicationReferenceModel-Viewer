<script lang="ts">
    import { onDestroy, onMount, tick } from 'svelte';
    import * as d3 from 'd3';
    import type { BlockNode, LabelHierarchy } from '$lib/types';
    import { SvelteMap } from 'svelte/reactivity';
    import { getPicoColors } from '$lib/colorUtils';
    import { diagramOptions, emptyOptions, getConditionalRules } from '$lib/datastore.svelte';
    import type { ConditionalFormatting, DiagramOptions } from './db/dexie';
    import { sunBurstWrap } from '$lib/d3Utils';


    const { 
        root,
        updateTooltipText,
        width,
        xRootOffset = 0,
        yRootOffset = 0,

     }: { 
        root: BlockNode,
        updateTooltipText: (text: string[]) => void,
        width: number,
        xRootOffset?: number,
        yRootOffset?: number,
     } = $props();

     type ArcDatum = { x0: number; x1: number; y0: number; y1: number };

  
    /**
     * Outer diameter in pixels. Height will match via viewBox so it is responsive.
    **/

    const NS = '.sb'; 

    const fullDepth = $derived(d3.hierarchy(root).height);
    const radius = $derived(width / 2);

    // const g = $state(d3.select(groupContainer).append('g').attr('class', 'arcs-layer').attr('transform', `translate(${xRootOffset}, ${yRootOffset})`));

    let group: SVGGElement;
    let arcsLayer: SVGGElement;
    let labelsLayer: SVGGElement;

    const activeNodes = $state([root.id]);

    const colors = new SvelteMap<string, string>();

    let sunBurstOptions: DiagramOptions = $state(emptyOptions);
    const conditionalFormattingRuleMap = new SvelteMap<string, ConditionalFormatting[]>();
    
    function getColor(n: string) {
        const level = sunBurstOptions.labelHierarchy.findIndex((label) => label === n);
        const isLeaf = level === sunBurstOptions.labelHierarchy.length - 1;

        const fillColor = isLeaf ? colors.get('primary') : level % 2 === 0 ? colors.get('secondary') : colors.get('contrastInverse');
        const textColor =  isLeaf ? colors.get('contrastInverse') : level % 2 === 0 ? colors.get('contrastInverse') : colors.get('secondary');
        
        return {
            fill: fillColor,
            text: textColor
        };
    };

    // Partition helper (value only on leaves so children take 100 %)
    function partitionRoot(node: d3.HierarchyNode<BlockNode>, R: number) {
      return d3.partition<BlockNode>()
        .size([2 * Math.PI, R])(
          node
            .sum(d => (d.children?.length ? 0 : d.value ?? 1))  // ← defaults to 1
            .sort((a, b) => (b.value ?? 1) - (a.value ?? 1))
        );
    }

    const EPS      = 1e-6;   // never let an angle drop below this
    const MIN_R    = 0.5;    // px – keeps radii strictly > 0
    const GAP      = 1;      // visual gap between rings (optional)
    const arc = d3.arc<ArcDatum>()      // no other changes needed
      .startAngle(d => d.x0)
      .endAngle  (d => Math.max(d.x0 + EPS, d.x1))
      .innerRadius(d => Math.max(MIN_R, d.y0))
      .outerRadius(d => Math.max(MIN_R, d.y1 - GAP));

    // helper — returns the four numbers the arc generator needs
    function arcState(d: d3.HierarchyRectangularNode<BlockNode>): ArcDatum {
      return { x0: d.x0, x1: d.x1, y0: d.y0, y1: d.y1 };
    }


    function addArcListeners(rootNode: d3.HierarchyNode<BlockNode>,sel: d3.Selection<SVGPathElement, any, any, any>) {
      activeNodes.push(rootNode.data.id);
      sel // remove any previous listeners
        .on('click' + NS, async (event: MouseEvent, d: any) => {
          const currentActiveNode = activeNodes[activeNodes.length - 1];
          if(d.data.id === currentActiveNode) { // If clicked on self, go back to parent
              const nodeId = activeNodes.pop();
              const parentNode = d3.hierarchy(root).descendants().find((node: any) => node.data.id === nodeId)?.parent;

              if (parentNode) {
                  await render(parentNode);
                  return;
              }
              await render(d3.hierarchy(root));
              return;
          }
          if (d.children && d.depth !== 0) render(d);
        })
        .on('mouseover' + NS, (event: MouseEvent, d: any) => {
          const target = event.currentTarget as SVGPathElement;
          d3.select(target).style('cursor', d.children ? 'pointer' : 'default');

          updateTooltipText(d.ancestors()
                .map((a: any) => a.data.name)
                .reverse());
        })
        .on('mousemove' + NS, (event: MouseEvent) => {
        })
        .on('mouseout' + NS, (event: MouseEvent, d: any) => {
          const target = event.currentTarget as SVGPathElement;
          d3.select(target).attr('stroke', getColor(d.data.label).text || '#000');
          updateTooltipText(['']);
        });
    }


    function setupPathEnter(rootNode: d3.HierarchyNode<BlockNode> , paths: d3.Selection<SVGPathElement, d3.HierarchyRectangularNode<BlockNode>, SVGGElement, unknown>){
      
      const pathsEnter = paths.enter()
        .append('path')
        .attr('fill',  d => getColor(d.data.label).fill ?? '#000')
        .attr('stroke', d => getColor(d.data.label).text ?? '#fff')
        .attr('d',      d => arc(arcState(d)))                 // first draw
        .each(function (d) {
            (this as SVGPathElement & { _curr: ArcDatum })._curr = arcState(d);
        })
        .call((sel: d3.Selection<SVGPathElement, d3.HierarchyRectangularNode<BlockNode>, SVGGElement, unknown>) => {
          addArcListeners(rootNode, sel);
        })

        pathsEnter.merge(paths as any)
        .transition(d3.transition().duration(400))
        .attrTween('d', function (d) {
            // this as <element & {_curr: ArcDatum}>
            const self = this as SVGPathElement & { _curr: ArcDatum };

            // interpolateObject handles arbitrary keys safely
            const i = d3.interpolateObject<ArcDatum>(self._curr, arcState(d));

            self._curr = i(1);                     // cache for next time
            return (t: number) => arc(i(t)) || ''; // ensure a string is always returned
        })
        .attr('fill',  d => getColor(d.data.label).fill  ?? '#000')
        .attr('stroke',d => getColor(d.data.label).text ?? '#fff');


        pathsEnter.attr('stroke', d => getColor(d.data.label).text ?? '#fff')

    }

    /**
     * Render (or re‑render) the diagram with `rootNode` as the new root.
     */
    async function render(rootNode: d3.HierarchyNode<BlockNode>) {
      console.log(JSON.stringify(rootNode.data, null, 2));
        if(rootNode.children?.length === 0) return;

        conditionalFormattingRuleMap.clear();

        rootNode.each((d: d3.HierarchyNode<BlockNode>) => {
          if (d.data) {
            const rules = getConditionalRules(d.data);
            conditionalFormattingRuleMap.set(d.data.id, rules);
          }
        });

        const fullFactor  = fullDepth + 1;
        const subDepth   = rootNode.height + 1;
        const k          = fullFactor / subDepth;

        const nodes = partitionRoot(rootNode, radius / k).descendants()
        .filter(d => d.x1 - d.x0 > EPS);
  
        // --------------------------- ARCS ----------------------------------
        const paths = d3.select(arcsLayer)
          .selectAll<SVGPathElement, typeof nodes[0]>('path')
          .data(nodes, d => d.data.id ?? d.data.name);

        setupPathEnter(rootNode, paths);

        paths.exit()
        .transition()
        .duration(400)
        .attrTween('d', function (d: any) {
            const self = this as SVGPathElement & { _curr: ArcDatum };
            const i = d3.interpolateObject<ArcDatum>(self._curr, arcState(d));
            self._curr = i(1);                     // cache for next time
            return (t: number) => arc(i(t)) || ''; // ensure a string is always returned
        })
        .style('fill-opacity', 0)
        .remove();

  
        // --------------------------- LABELS -------------------------------
        const labelFilter = (d: d3.HierarchyRectangularNode<any>) =>
          d.depth !== 0 && d.x1 - d.x0 > 0.04 && d.y1 - d.y0 > 20;
  
        const texts = d3.select(labelsLayer)
          .selectAll<SVGTextElement, d3.HierarchyRectangularNode<any>>('text')
          .data([...nodes.filter(labelFilter), rootNode], (d: any) => d.data.id ?? d.data.name);
  
        texts.exit().transition().duration(200).style('opacity', 0).remove();
  
        const textsEnter = texts
          .enter()
          .append('text')
          .attr('x', 0)
          .attr('y', 0)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle') // ⬅ left‑align all wrapped lines
          .attr('font-size', '0.3em')
          .attr('fill', (d: any) => (getColor(d.data.label).text || '#000'))
          .style('opacity', 0);
  
        function labelTransform(d: d3.HierarchyRectangularNode<BlockNode>) {
            if (d.data.id === rootNode.data.id) return 'translate(0,0)';

          const x = ((d.x0 + d.x1) / 2) * (180 / Math.PI) - 90;
          const y = (d.y0 + d.y1) / 2;
          return `rotate(${x}) translate(${y},0) rotate(${x < 90 ? 0 : 180})`;
        }
  
        const textUpdate = textsEnter.merge(texts as any)
          .text((d: any) => d.data.name);


        textUpdate
          .call(sunBurstWrap, 1.1)
          .attr('transform', labelTransform as any)
          .transition()
          .duration(300)
          .style('opacity', 1);
      }

    $effect(() => {

      // console.log('nodes', nodes);
    });


    onMount(async () => {
      const rootcss = getComputedStyle(document.documentElement);
      const picoColors = getPicoColors(rootcss);

      (Object.keys(picoColors) as Array<keyof typeof picoColors>).forEach((key, idx) => {
          const color = picoColors[key];
          colors.set(key, color);
        });
  
      if (!root) {
        return;
      }

      diagramOptions.subscribe(async (state) => {
        const currentOptions = state.find((option) => option.diagramType === 'sunburst');
        if (currentOptions) {
          sunBurstOptions = currentOptions;
          
          await render(d3.hierarchy(root));
        }
      });


    });

  function removePathListeners() {
    d3.select(arcsLayer).selectAll<SVGPathElement, unknown>('path')
      .on('click' + NS, null)
      .on('mouseover' + NS, null)
      .on('mousemove' + NS, null)
      .on('mouseout' + NS, null);
  }

	onDestroy(() => {
    removePathListeners();
  });
  </script>

  <g bind:this={group} data-nodename={root.name} transform="translate({xRootOffset}, {yRootOffset})" class="arcs-layer">
    <g bind:this={arcsLayer} class="arcs-layer"></g>
    <g bind:this={labelsLayer} class="labels-layer" pointer-events='none' ></g>
  </g>
  

  
  