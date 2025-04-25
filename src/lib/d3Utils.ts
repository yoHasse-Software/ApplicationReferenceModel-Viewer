import * as d3 from "d3";
import type { BlockNode, BoxModel, ColorPalette, DiagramTypes, Entity, FontSettings, NestedBlockOptions, RelationShip, TitleModel } from "./types";
import { getDisplayOptions } from "./datastore.svelte";


export const defaultBoxModel: BoxModel = {
  minWidth: 100,
  minHeight: 20,
  margin: {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,

  },
}

export const defaultTitleModel: TitleModel = {
  fontSettings: {
    fontSize: 24,
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontWeight: 'normal',
  },
  margin: {
    top: 10,
    bottom: 2,
    left: 10,
    right: 0,
  },
}

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

const displayEmpty = (diagramType: DiagramTypes) => {
  switch (diagramType) {
    case 'nestedblock':
      return getDisplayOptions().nestedBlockOptions.displayEmpty;
    case 'graph':
      return true;
    case 'sunburst':
      return true; // Sunburst always displays empty nodes
    default:
      return false;
  } 
}

const isLeaf = (node: BlockNode, leafLabel: string) => {
  return node.label === leafLabel && (!node.children || node.children.length === 0);
};


function hasLeafs(node: BlockNode, leafLabel: string): boolean {
  if(isLeaf(node, leafLabel)) {
    console.log("hasLeafs", node.id, node.label, leafLabel);
    return true;
  }
  if(node.children && node.children.length > 0) {
    return node.children.some(child => hasLeafs(child, leafLabel));
  }
  return false;
};




export function buildHierarchy(nodes: Entity[], 
    relationships: RelationShip[], 
    diagramType: DiagramTypes, 
    rootStartsAt: string = 'root') : BlockNode[] {

  const labelHierarchy = getLabelsHeirarchyFromDiagramType(diagramType) || [];
  const displayEmptyNodes = displayEmpty(diagramType);
  const leafLabel = labelHierarchy[labelHierarchy.length - 1]; // Get the last label in the hierarchy

  console.log("leafLabel", leafLabel);
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
    const from = rel.type !== 'SUPPORTS' ? rel.from : rel.to; // Need to fix this, can't have this workaround
    const to = rel.type !== 'SUPPORTS' ? rel.to : rel.from;

    const parent = nodeMap.get(from);
    const child = nodeMap.get(to);
    if (parent && child 
        && !parent.children.some((c) => c.id === child.id)) {
      parent.children.push(child);
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

  const rootLabel = rootStartsAt === 'root' ? labelHierarchy[0] : rootStartsAt;

  const roots: BlockNode[] = Array.from(nodeMap.values()).filter(
    (n) => {
      const isMatch = (n.label === rootLabel || n.label === 'default');
      const hasChildren = n.children && n.children.length > 0;
      return isMatch && (displayEmptyNodes ? true : hasChildren)

    }
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


const nodeMarginY = (boxModel: BoxModel) => 
    boxModel.margin.top + boxModel.margin.bottom; // Padding between nodes


const labelMarginY = (boxModel: BoxModel, titleModel: TitleModel) => 
  nodeMarginY(boxModel) + titleModel.margin.top + titleModel.margin.bottom ; // Padding between nodes

const nodePaddingY = (boxModel: BoxModel, titleModel: TitleModel) => 
  nodeMarginY(boxModel) + labelMarginY(boxModel, titleModel) + titleModel.fontSettings.fontSize; // Padding between nodes



export function computeNestedBlockSize(
    node: BlockNode, 
    labelHierarchy: string[], 
    titleModel: TitleModel | undefined = undefined, 
    blockModel: BoxModel | undefined = undefined): { width: number, height: number } {

  const titleBoxModel: TitleModel = titleModel || defaultTitleModel;
  const boxModel: BoxModel = blockModel || defaultBoxModel;

  const marginX = boxModel.margin.left + boxModel.margin.right; // Padding between nodes
  const marginY = boxModel.margin.top + boxModel.margin.bottom; // Padding between nodes

  const nodeMinWidth = Math.max(boxModel.minWidth, titleBoxModel.fontSettings.fontSize * 16.6); // initial width of child nodes
  const nodeMinHeight = Math.max(boxModel.minHeight, titleBoxModel.fontSettings.fontSize * 2); // initial height of child nodes

  const calculatedMinHeight = nodeMinHeight + marginY; // Minimum width based on the level of the node
  const calculatedMinWidth = nodeMinWidth + marginX; // Minimum width based on the level of the node
  const isLeaf = node.label === labelHierarchy[labelHierarchy.length - 1]; // Check if the node is a leaf node


  if(!node.children || node.children.length === 0) {
    // Get the potential width of children
    node.width = nodeMinWidth + (isLeaf ? 0 : marginX); // Set the width of the node to the minimum width
    node.height = nodeMinHeight + marginY; // Set the height of the node to the minimum height
    return { width: node.width, height: node.height };
  }


  let totalWidth = 0;
  let totalHeight = 0;

  const childHeights = new Map<string, number>(); // Map to store the heights of each row group
  const childLabel = node.children[0].label || ""; // Get the label of the first child node
  const childColumns = getDisplayOptions().nestedBlockOptions.columnsPerLabel[childLabel] || 1; // Get the number of columns for the child node label

  node.children.forEach((child, idx) => {
    const isLeaf = child.label === labelHierarchy[labelHierarchy.length - 1]; // Check if the node is a leaf node

    const childSize = computeNestedBlockSize(child,labelHierarchy,titleModel, blockModel);
    if(childColumns > idx){ // Stop adding width if we have reached the max columns
      totalWidth += childSize.width + boxModel.margin.left; // Add padding between nodes
    }
    childHeights.set(child.id, childSize.height); // Store the height of the child node
  });

  totalWidth += boxModel.margin.right; // Add padding between nodes


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
  totalHeight = rowHeights.reduce((acc, height) => acc + height + boxModel.margin.top, 0) - boxModel.margin.top; // Add padding between rows
  totalHeight += nodePaddingY(boxModel, titleBoxModel); // Add padding between nodes

  node.width = Math.max(calculatedMinWidth, totalWidth); 
  node.height = Math.max(calculatedMinHeight, totalHeight);


  return {
    width: Math.max(calculatedMinWidth, totalWidth),
    height: Math.max(calculatedMinHeight, totalHeight) 
  };
  

}

export function computeNestedBlockPosition(
    node: BlockNode, 
    parentNode: BlockNode | undefined,
    titleModel: TitleModel | undefined = undefined,
    blockModel: BoxModel | undefined = undefined,
    previousNode: BlockNode | undefined = undefined) {

  const boxModel: BoxModel = blockModel || defaultBoxModel;
  const titleBoxModel: TitleModel = titleModel || defaultTitleModel;

  const isRoot = !parentNode; // Check if the node is a root node
  const thisIndex = isRoot ? 0 : parentNode.children!.findIndex(n => n.id === node.id); // Get the index of the current node in the parent's children array
  const nodeColumns = getDisplayOptions().nestedBlockOptions.columnsPerLabel[node.label] || 1; // Get the number of columns for the node label
  const marginX = boxModel.margin.left + boxModel.margin.right; // Padding between nodes
  const marginY = boxModel.margin.top + boxModel.margin.bottom; // Padding between nodes

  const newRow = thisIndex % nodeColumns === 0; // Check if the current node is the first in a new row

  const xPos = () => {
    if(!previousNode){
      return isRoot ? 0 : boxModel.margin.left; // First node in the row, set x to 0
    }
    if (isRoot) {
      return newRow ? 0 : previousNode.x + previousNode.width + boxModel.margin.left; // Root node is always at x = 0
    } else if (newRow) {
      return boxModel.margin.left; // reset
    } else {
      return previousNode.x + previousNode.width + boxModel.margin.left; // Same row, position at the same x as the previous node
    }
  };

  const yPos = () => {
    if(!previousNode){
      return boxModel.margin.top + labelMarginY(boxModel, titleBoxModel) + titleBoxModel.fontSettings.fontSize; // First node in the row, set y to 0
    }
    if (isRoot) {
      return newRow ? previousNode.y + previousNode.height + marginY : previousNode.y; // Root node is always at y = 0
    } else if (newRow) {
      return previousNode.y + previousNode.height + marginY; // New row, position below the previous node
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

    computeNestedBlockPosition(child, node, titleBoxModel, boxModel, previousChild);
  }

}
