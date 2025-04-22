import type { color } from "d3";

export type AppSoftware = {
    name: string;
    metadata: {
        [key: string]: string | number | boolean;
    };
}


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
    visibleLabels: boolean[];
    displayEmpty: boolean;
    columns: {
        [key: string]: number;
    }
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
