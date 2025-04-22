<script lang="ts">
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
    import {
      Data,
      getLabels,
    } from '$lib/datastore.svelte';
    import type { BlockNode } from '$lib/types';
    import { SvelteMap } from 'svelte/reactivity';
    import { getPicoColors } from '$lib/colorUtils';


    const { 
        root,
        svgContainer,
        groupContainer,
        xRootOffset = 0,
        yRootOffset = 0,

     }: { 
        root: BlockNode,
        svgContainer: SVGSVGElement,
        groupContainer: SVGGElement,
        xRootOffset?: number,
        yRootOffset?: number,
     } = $props();

  
    /**
     * Outer diameter in pixels. Height will match via viewBox so it is responsive.
     */
    let width: number = 600;
  

    const colors = new SvelteMap<string, string>();
    
    function getColor(n: string) {
        const level = getLabels().indexOf(n) || 0;
        const isLeaf = level === getLabels().length - 1;

        const fillColor = isLeaf ? colors.get('primary') : level % 2 === 0 ? colors.get('secondary') : colors.get('contrastInverse');
        const textColor =  isLeaf ? colors.get('contrastInverse') : level % 2 === 0 ? colors.get('contrastInverse') : colors.get('secondary');
        
        return {
            fill: fillColor,
            text: textColor
        };
    };
  
    onMount(() => {
        
      const rootcss = getComputedStyle(document.documentElement);
      const picoColors = getPicoColors(rootcss);

      (Object.keys(picoColors) as Array<keyof typeof picoColors>).forEach((key, idx) => {
          const color = picoColors[key];
          colors.set(key, color);
        });
  
      if (!root) return;
  
      const radius = width / 2;
  
      // --------------------------- SVG scaffold ---------------------------
    //   const svg = d3
    //     .select(container)
    //     .append('svg')
    //     .attr('viewBox', `${-width / 2} ${-width / 2} ${width} ${width}`)
    //     .attr('width', '100%')
    //     .attr('height', '90vh')
    //     .style('font', '10px sans-serif');
  
      const g = d3.select(groupContainer)
        .append('g')
        .attr('transform', `translate(${xRootOffset}, ${yRootOffset})`);
      const arcsLayer = g.append('g');
      const labelsLayer = g.append('g').attr('pointer-events', 'none');
      
  
      // Tooltip ------------------------------------------------------------
      const tooltip = d3
        .select(svgContainer)
        .append('div')
        .attr('class', 'sunburst-tooltip')
        .style('opacity', 0);
  
      // Colour palette -----------------------------------------------------
  
      // Generic arc generator ---------------------------------------------
      const arc = d3
        .arc<d3.HierarchyRectangularNode<any>>()
        .startAngle((d) => d.x0)
        .endAngle((d) => d.x1)
        .innerRadius((d) => d.y0)
        .outerRadius((d) => d.y1 - 1);
  
      // Partition helper (value only on leaves so children take 100 %)
      const partitionRoot = (node: d3.HierarchyNode<any>) =>
        d3
          .partition<any>()
          .size([2 * Math.PI, radius])(
            node
              .sum((d: any) => (d.children?.length ? 0 : d.value))
              .sort((a: any, b: any) => b.value - a.value)
          );

  
      /* Arc length at centroid radius ≈ label pixel budget */
      const labelWidth = (d: d3.HierarchyRectangularNode<any>) => {
        const angle = d.x1 - d.x0;
        const r = (d.y0 + d.y1) / 2;
        return Math.max(angle * r, 1); // never below 30 px so wrap() isn’t fooled
      };

        const fullDepth = d3.hierarchy(root).height;        // depth of the *full* tree
        const ringPx    = radius / (fullDepth + 1);         // one ring = this many pixels


  
      /**
       * Render (or re‑render) the diagram with `rootNode` as the new root.
       */
      function render(rootNode: d3.HierarchyNode<BlockNode>) {
        if(rootNode.children?.length === 0) return;
        

        // Clear the layers before rendering, not as cool?
        arcsLayer.selectAll('path').remove();
        labelsLayer.selectAll('text').remove();

        const partition = d3.partition<BlockNode>()
        .size([2 * Math.PI, fullDepth + 1])               // depth units, not pixels
        (rootNode
                .sum(d => d.children?.length ? 0 : d.value));


        const rootPartition = partitionRoot(rootNode);


  
        // --------------------------- ARCS ----------------------------------
        const paths = arcsLayer
          .selectAll<SVGPathElement, d3.HierarchyRectangularNode<any>>('path')
          .data(rootPartition.descendants(), (d: any) => d.data.id ?? d.data.name);
  
        paths.exit().transition().duration(200).attr('fill-opacity', 0).remove();
  
        const pathsEnter = paths
          .enter()
          .append('path')
          .attr('stroke', (d: any) => (getColor(d.data.label).text || '#fff'))
          .on('click', (event: MouseEvent, d: any) => {
            console.log('click', d.data.name, d.data.id, rootNode.data.id);
            if(d.data.id === rootNode.data.id) {
                render(d3.hierarchy(root));
                return;
            }
            if (d.children && d.depth !== 0) render(d);
          })
          .on('mouseover', (event: MouseEvent, d: any) => {
            const target = event.currentTarget as SVGPathElement;
            d3.select(target).style('cursor', d.children ? 'pointer' : 'default');
            // d3.select(target).attr('transform', 'scale(1.02)');
            tooltip
              .style('opacity', 1)
              .html(
                `${d
                  .ancestors()
                  .map((a: any) => a.data.name)
                  .reverse()
                  .join(' › ')}<br/><b>${d.value}</b>`
              );
          })
          .on('mousemove', (event: MouseEvent) => {
            tooltip
              .style('left', `${event.pageX + 12}px`)
              .style('top', `${event.pageY + 12}px`);
          })
          .on('mouseout', (event: MouseEvent, d: any) => {
            const target = event.currentTarget as SVGPathElement;
            d3.select(target).attr('stroke', getColor(d.data.label).text || '#000');
            // d3.select(target).attr('transform', 'scale(1)');
            tooltip.style('opacity', 0);
          });


  
        pathsEnter
          .merge(paths as any)
          .transition()
          .duration(300)
          .attr('d', arc as any)
          .attr('fill', (d: any) => (getColor(d.data.label).fill || '#000'));
  
        // --------------------------- LABELS -------------------------------
        const labelFilter = (d: d3.HierarchyRectangularNode<any>) =>
          d.depth !== 0 && d.x1 - d.x0 > 0.04 && d.y1 - d.y0 > 20;
  
        const texts = labelsLayer
          .selectAll<SVGTextElement, d3.HierarchyRectangularNode<any>>('text')
          .data([...rootPartition.descendants().filter(labelFilter), rootNode], (d: any) => d.data.id ?? d.data.name);
  
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
  
        textsEnter.merge(texts as any)
          .text((d: any) => d.data.name)
          // clear & wrap *before* transform so width calc is correct
        //   .each(function (d) {
        //     sunBurstWrap(d3.select(this), labelWidth(d));
        //   })
          .attr('transform', labelTransform as any)
          .transition()
          .duration(300)
          .style('opacity', 1);
      }
  
      // --------------------------- INIT ----------------------------------
      render(d3.hierarchy(root));

    });
  </script>
  
  <style>
    .sunburst-tooltip {
      position: absolute;
      pointer-events: none;
      background: rgba(255, 255, 255, 0.95);
      padding: 4px 8px;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      font-size: 12px;
      white-space: nowrap;
    }
  </style>
  
  <!-- <div bind:this={container} class="relative"></div> -->
  