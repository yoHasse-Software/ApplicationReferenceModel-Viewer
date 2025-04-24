import * as d3 from "d3";
import type { BlockNode, DiagramTypes, Entity, RelationShip } from "./types";
import { getDisplayOptions } from "./datastore.svelte";

export function wrap(text: d3.Selection<SVGTextElement, unknown, null, undefined>, width: number) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [] as string[],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            x = text.attr("x"),
            y = text.attr("y"),
            dy = 0, //parseFloat(text.attr("dy")),
            tspan = text.text(null)
                        .append("tspan")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan == null || tspan.node() == null) {
                return;
            }
            if (tspan.node()!.getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("dy", ++lineNumber * lineHeight + dy + "em")
                            .text(word);
            }
        }
    });
}

    /* ------------------------------------------------------------------
     *  Text‑wrapping helper (generic d3 utility)
     *  — clears previous <tspan>s so re‑renders don’t accumulate
     *  — left‑aligns every line so subsequent rows start at the same radial
     *    position (avoids the “continuation along the arc” artefact)
     * ------------------------------------------------------------------ */
    export function sunBurstWrap(
        text: d3.Selection<SVGTextElement, any, any, any>,
        lineHeightEm = 1.1
      ) {
        text.each(function () {
          const textSel = d3.select(this);
    
          // 🔑 remove old tspans in case this label is being updated
          textSel.selectAll('tspan').remove();
    
          const words = textSel.text().split(/\s+/).reverse().map((word) => word.trim()).filter((word) => word.length > 0);
          let word: string | undefined;
          let line: string[] = [];
          let lineNumber = 0;
          const x = 0; // left‑aligned within the rotated frame
          const y = 0;
    
          let tspan = textSel
            .text(null)
            .append('tspan')
            .attr('x', x)
            .attr('y', y)
            .attr('dy', '0em');
    
          while ((word = words.pop())) {
            line.push(word);
            tspan.text(line.join(' '));
            const exceeds =
              tspan.node() &&
              (tspan.node() as SVGTextElement).getComputedTextLength() > 50;
  
            if (exceeds) {
              line.pop(); // remove overflowing word
  
              if (line.length) {
                  // keep the current (now‑shorter) line
                  tspan.text(line.join(' '));
              } else {
                  // first word alone exceeds the width → discard empty tspan
                  tspan.remove();
                  lineNumber--;
              }
  
              // start a new line with the long word (or next words)
              line = [word];
              tspan = textSel
              .append('tspan')
              .attr('x', 0)
              .attr('y', 0)
              .attr('dy', `${++lineNumber * lineHeightEm}em`)
              .text(word);
            }
          }
  
  
        });
      }

/** Build a hierarchical structure from flat nodes / relationships */

const getLabelsHeirarchyFromDiagramType = (diagramType: DiagramTypes) => {
  switch (diagramType) {
    case 'nestedblock':
      return getDisplayOptions().nestedBlockOptions.labelHierarchy;
    case 'graph':
      return [];
    case 'sunburst':
      return getDisplayOptions().sunBurstOptions.labelHierarchy;
    default:
      return [];
  } 
};


export function buildHierarchy(nodes: Entity[], 
    relationships: RelationShip[], 
    diagramType: DiagramTypes, 
    rootStartsAt: string = 'root') : BlockNode[] {
  const labelHierarchy = getLabelsHeirarchyFromDiagramType(diagramType) || [];

  const nodeMap = new Map(
    nodes.map((n) => [
      n.id,
      {
        ...n,
        children: [] as BlockNode[],
        value: labelHierarchy.findIndex((l) => l === n.label) + 1,
        width: 0,
        height: 0,
        x: 0,
        y: 0
      }
    ])
  );

  relationships.forEach((rel) => {
    const from = rel.type !== 'SUPPORTS' ? rel.from : rel.to;
    const to = rel.type !== 'SUPPORTS' ? rel.to : rel.from;

    const parent = nodeMap.get(from);
    const child = nodeMap.get(to);
    if (parent && child && !parent.children.some((c) => c.id === child.id)) {
      parent.children.push(child);
    }
  });

  const rootLabel = rootStartsAt === 'root' ? labelHierarchy[0] : rootStartsAt;

  const roots: BlockNode[] = Array.from(nodeMap.values()).filter(
    (n) => n.label === rootLabel || n.label === 'default'
  );

  if (rootStartsAt === 'root') {
    const singularRoot: BlockNode = {
      id: 'root',
      name: '-',
      label: 'root',
      height: 0,
      width: 0,
      x: 0,
      y: 0,
      value: 0,
      metadata: {},
      children: roots,
    }

    return [singularRoot];
  }

  return roots;
}
