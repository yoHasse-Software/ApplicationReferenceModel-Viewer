import * as d3 from "d3";
import type { BlockNode, BoxModel, ColorPalette, DiagramTypes, FontSettings, TitleModel } from "./types";
import { defaultBoxModel, defaultTitleModel } from "./datastore.svelte";
import type { DiagramOptions, Entity, RelationShip } from "./components/db/dataRepository";


export const defaultColorPalette: ColorPalette = {
  primary: "#007bff",
  contrast: "#ffffff",
  secondary: "#6c757d",
  contrastInverse: "#000000",
  primaryColor: "#007bff",
  secondaryColor: "#6c757d",
  primaryBg: "#ffffff",
  secondaryBg: "#f8f9fa",
}



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


function subNodesContainsId(node: BlockNode, id: string): boolean {
  if (node.id === id) {
    console.warn("Found node with id", id, node.id);
    return true;
  }
  if (!node.children) {
    return false;
  }
  for (const child of node.children) {
    if (subNodesContainsId(child, id)) {
      return true;
    }
  }
  return false;
}

export async function buildHierarchy(nodes: Entity[], 
    relationships: RelationShip[], 
    options: DiagramOptions) : Promise<BlockNode[]> {

  const labelHierarchy = options.labelHierarchy;
  if(!labelHierarchy || labelHierarchy.length === 0) {
    throw new Error("Label hierarchy is not defined or empty.");
  }
  const displayEmptyNodes = options.displayEmpty || false; // Get the displayEmpty option from the diagram options
  const leafLabel = labelHierarchy[labelHierarchy.length - 1]; // Get the last label in the hierarchy
  const relHeirarchy = options.hierarchyRelMod || []; // Get the relationship hierarchy from the diagram options
  console.log("started");


  const nodeMap: Map<string, BlockNode> = new Map(
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
    let parent = nodeMap.get(rel.from);
    let child = nodeMap.get(rel.to);

    if(!parent || !child) {
      return;
    }

    const parentLabelIndex = labelHierarchy.indexOf(parent.label);
    const relDirection = parentLabelIndex > 0 ? relHeirarchy[parentLabelIndex-1] || '->' : '->'; // Get the relationship direction from the hierarchy
    if(relDirection === '<-') {
      // Swap parent and child if the relationship direction is reversed
      console.warn("Swapping parent and child", parent.label, child.label);
      const temp = parent;
      parent = child;
      child = temp;
    }

    
    if (!parent.children?.some((c) => c.id === child.id)) {
      parent.children?.push(child) || (parent.children = [child]); // Add child to parent
    }
  });

  
  // ------------------------------------------------------------
  // 1. Prune branches that contain no leaf when displayEmptyNodes
  //    is false.  We mutate `children` in-place so the `nodeMap`
  //    stays consistent everywhere.
  // ------------------------------------------------------------
  if (!displayEmptyNodes) {
    const prune = (node: BlockNode): boolean => {
      // A node is itself a keeper if it is a leaf
      if (node.label === leafLabel) return true;

      // Recursively keep only children that themselves have a leaf
      if(!node.children){
        return false;
      }
        
      node.children = node.children.filter(prune);

      // Keep this node only when something survived underneath it
      return node.children?.length > 0; 
    };
    // Run the prune pass once over every node
    nodeMap.forEach(prune);
    
  }

  // Remove empty nodes if displayEmpty is false
  // console.log(JSON.stringify(Array.from(nodeMap.values()), null, 2)); // Log the node map for debugging


  const rootLabel = !options.rootAtLabel || options.rootAtLabel === 'root' ? labelHierarchy[0] :  options.rootAtLabel; // Get the root label from the diagram options;
  
  const roots: BlockNode[] = Array.from(nodeMap.values()).filter(
    (n) => {
      const isMatch = (n.label === rootLabel || n.label === 'default');
      const hasChildren = n.children && n.children.length > 0;
      return isMatch && (displayEmptyNodes ? true : hasChildren)
    }
  );




  if (options.rootAtLabel === 'root') {
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


const labelHeight = (titleModel: TitleModel) => 
  titleModel.offsets.top + titleModel.offsets.bottom + titleModel.fontSettings.fontSize; // Padding between nodes



export function computeNestedBlockSize(
    node: BlockNode, 
    labelHierarchy: string[], 
    options: DiagramOptions,
    count: number = 0,
    titleModel: TitleModel | undefined = undefined, 
    blockModel: BoxModel | undefined = undefined): { width: number, height: number } {

  if(count > 10000) { // Prevent infinite loop
    return { width: 0, height: 0 }; // Return zero size to avoid infinite loop
  }

  const titleBoxModel: TitleModel = titleModel || defaultTitleModel;
  const boxModel: BoxModel = blockModel || defaultBoxModel;

  const nodeMinWidth = Math.max(boxModel.minWidth, titleBoxModel.fontSettings.fontSize * 16.6); // initial width of child nodes
  const nodeMinHeight = Math.max(boxModel.minHeight, titleBoxModel.fontSettings.fontSize * 2); // initial height of child nodes

  if(!node.children || node.children.length === 0) {
    const isLeaf = labelHierarchy[labelHierarchy.length - 1] === node.label; // Check if the node is a leaf node
    node.width = nodeMinWidth - (isLeaf ? boxModel.spacing*2 : 0); // Set the width of the node to the minimum width
    node.height = nodeMinHeight + labelHeight(titleBoxModel); // Set the height of the node to the minimum height
    return { width: node.width, height: node.height };
  }


  let totalWidth = 0; // Initial width of the node

  const childHeights = new Map<string, number>(); // Map to store the heights of each row group
  const childLabel = node.children[0].label || ""; // Get the label of the first child node
  const childColumns = options.columnsPerLabel[childLabel] || 1; // Get the number of columns for the child node label

  let maxChildWidth = 0; // Variable to store the maximum width of child nodes

  node.children.forEach((child, idx) => {

    const childSize = computeNestedBlockSize(child,labelHierarchy, options, count++, titleBoxModel, boxModel);
    // Gör något med detta... kanske. Problemet är att visa columner är bredare än andra i samma column...
    maxChildWidth = Math.max(maxChildWidth, childSize.width); // Update the maximum width of child nodes
    if(idx < childColumns ){ // Stop adding width if we have reached the max columns
      totalWidth += childSize.width + boxModel.spacing; // Add padding between nodes
    }
    childHeights.set(child.id, childSize.height); // Store the height of the child node
  });

  totalWidth += boxModel.spacing; // Add padding between nodes


  // 1. Group the children by their row index
  const rows = Math.ceil(node.children.length / childColumns); // Calculate the number of rows based on the number of columns
  const rowGroups = Array.from({ length: rows }, (_, i) => node.children?.slice(i * childColumns, (i + 1) * childColumns));

  // 2. Calculate the max height for each row group
  const rowHeights = rowGroups.map(row => {
    if (!row) return 0;
    return Math.max(...row.map((child, idx) => {
      const childNodeHeight = childHeights.get(child.id) || 0; // Get the height of the child node from the map
      return childNodeHeight; // Add padding between rows
    }));
  });

  
  // 3. Set the height of each child node to the max height of its row group
  node.children.forEach((child, idx) => {
    const rowIndex = Math.floor(idx / childColumns);
    const rowHeight = rowHeights[rowIndex] || 0;
    child.height = rowHeight; // Set the height of the child node to the max height of its row group
  });

  // 4. Set the total height of the node to the sum of the row heights
  let totalHeight = rowHeights.reduce((acc, height) => acc + height + boxModel.spacing, 0) + boxModel.spacing; // Add padding between rows
  totalHeight += labelHeight(titleBoxModel); // Add padding between nodes

  node.width = Math.max(nodeMinWidth, totalWidth); 
  node.height = Math.max(nodeMinHeight, totalHeight);


  return {
    width: Math.max(nodeMinWidth, totalWidth),
    height: Math.max(nodeMinHeight, totalHeight) 
  };
  

}

export function computeNestedBlockPosition(
    node: BlockNode, 
    parentNode: BlockNode | undefined,
    options: DiagramOptions,
    previousNode: BlockNode | undefined = undefined) {

  const boxModel: BoxModel = options.boxModel || defaultBoxModel;
  const titleBoxModel: TitleModel = options.titleModel || defaultTitleModel;

  const isRoot = !parentNode; // Check if the node is a root node
  const thisIndex = isRoot ? 0 : parentNode.children!.findIndex(n => n.id === node.id); // Get the index of the current node in the parent's children array
  const nodeColumns = options.columnsPerLabel[node.label] || 1; // Get the number of columns for the node label

  const newRow = thisIndex % nodeColumns === 0; // Check if the current node is the first in a new row

  const previousNodeX = previousNode ? previousNode.x + previousNode.width : 0; // Get the x position of the previous node

  const xPos = () => {
    if(!previousNode){
      return isRoot ? 0 : boxModel.spacing; // First node in the row
    }
    if (isRoot) {
      return newRow ? 0 : previousNodeX + boxModel.spacing; // Root node is always at x = 0
    } else if (newRow) {
      return boxModel.spacing; // reset
    } else {
      return previousNodeX + boxModel.spacing; // Same row, position at the same x as the previous node
    }
  };

  const previousNodeY = previousNode ? previousNode.y + previousNode.height: 0; // Get the y position of the previous node

  const yPos = () => {
    if(!previousNode){ 
      return boxModel.spacing + labelHeight(titleBoxModel); // First node in the row, set y to 0
    }
    if (isRoot) {
      return newRow ? previousNodeY + boxModel.spacing : previousNode.y; // Root node is always at y = 0
    } 
    if (newRow) {
      return previousNodeY + boxModel.spacing; // New row, position below the previous node
    } else {
      return previousNode.y; // Same row, position at the same y as the previous node
    }
  };

  node.x = xPos(); // Set the x position of the node
  node.y = yPos(); // Set the y position of the node to be the same as the previous node

  if(!node.children){
    return;
  }

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const previousChild = i > 0 ? node.children[i - 1] : undefined; // Get the previous child node

    computeNestedBlockPosition(child, node, options, previousChild);
  }

}
