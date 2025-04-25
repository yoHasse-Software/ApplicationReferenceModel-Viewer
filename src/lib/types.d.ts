import type { color } from "d3";

export type AppSoftware = {
    name: string;
    metadata: {
        [key: string]: string | number | boolean;
    };
}

type DiagramTypes = 'nestedblock' | 'graph' | 'sunburst';


export type GraphData = {
    nodes: Entity[];
    relationships: RelationShip[];
}

export type Entity = {
    id: string;
    name: string;
    label: string;
    metadata: {
        [key: string]: string | number | boolean;
    };
}

export type BlockNode = Entity & {
    width: number;
    height: number;
    x: number;
    y: number;
    children?: BlockNode[];
    value?: number;
};


export type RelationShip = {
    from: string;
    type: string;
    to: string;
    metadata: {
        [key: string]: string | number | boolean;
    };
}

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

export type NestedBlockOptions = {
    labelHierarchy: string[];
    visibleLabels: string[];
    displayEmpty: boolean;
    rootAtLabel?: string;
    boxModel?: BoxModel;
    titleModel?: TitleModel;
    columnsPerLabel: {
        [key: string]: number;
    };
    labelColors: {
        [key: string]: string;
    };
}

export type SunBurstOptions = {
    labelHierarchy: string[];
    rootAtLabel?: string;
    maxDepth?: number;
    diameter?: number;
    rootColumns: number;
    labelColors?: {
        [key: string]: string;
    };
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
    margin: Insets;
}

export type BoxModel = {
    minHeight: number;
    minWidth: number;
    margin: Insets;
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



export type RuleOperator = 'equals' | 'metadataKeyEquals' | 'metadataKeyContains' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'notEquals' | 'notContains' | 'notStartsWith' | 'notEndsWith';


export type ConditionalFormatting = { 
    id: string;
    name: string;
    label: string; 
    value: string; 
    metadataKey: string;
    operator: RuleOperator;
    styling: {
        backgroundColor: {
            isSet: boolean;
            color?: string = '#000000';
        };
        color: {
            isSet: boolean;
            color?: string = '#000000';
        };
        borderColor: {
            isSet: boolean;
            color?: string = '#000000';
        };
        fontWeight?: 'normal' | 'bold';
        fontStyle?: 'normal' | 'italic';
        textDecoration?: 'none' | 'underline' | 'line-through';
        content?: string;
    }
}
