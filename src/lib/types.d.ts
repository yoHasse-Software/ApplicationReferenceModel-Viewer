import type { color } from "d3";
import type { Entity } from "./components/db/dexie";

export type DiagramTypes = 'none' | 'nestedblock' | 'graph' | 'sunburst';
export type RuleOperator = 'equals' | 'metadataKeyEquals' | 'metadataKeyContains' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'notEquals' | 'notContains' | 'notStartsWith' | 'notEndsWith';


export type GraphData = {
    nodes: Entity[];
    relationships: RelationShip[];
}


export interface BlockNode extends Entity {
    width: number;
    height: number;
    x: number;
    y: number;
    children?: BlockNode[];
    value?: number;
};


export type NodeRelation = {
    fromLabel: string;
    toLabel: string;
    relationType: string;
}


export type GroupLevel = { levelName: string; groups?: GroupLevel[]; children?: AppSoftware[]; };

export type DisplayOptions = {
    nestedBlockOptions: NestedBlockOptions;
    sunBurstOptions: SunBurstOptions;
}

export type LabelHierarchy = {
    fromLabel: string;
    toLabel: string;
    relationType: string;
}

export type RelationShipsOption = {
    fromLabel: string;
    toLabel: string;
    direction: "from" | "to" | "both";
    relationType: string;
 }

export type LevelNode = {
    value: number;
    id: string;
    name: string;
    parent?: string; // ID of the parent node
    children?: LevelNode[];
    isGroup: boolean;
    metadata?: {
        [key: string]: string | number | boolean;
    };
}


export type FontSettings = {
    fontSize: number;
    fontFamily: "Arial, Helvetica, sans-serif" | "Courier New, Courier, monospace" | "Georgia, serif" | "Times New Roman, Times, serif" | "Verdana, sans-serif";
    fontWeight: "normal" | "bold" | "bolder" | "lighter";
}

export type TitleModel = {
    fontSettings: FontSettings;
    offsets: Insets;
}

export type BoxModel = {
    minHeight: number;
    minWidth: number;
    spacing: number;
}

export type Insets = {
    top: number;
    right: number;
    bottom: number;
    left: number;
}


export type ColorPalette = {
    primary: string;
    secondary: string;
    primaryColor: string;
    secondaryColor: string;
    primaryBg: string;
    secondaryBg: string;
    contrast: string;
    contrastInverse: string;
}
