import type { BoxModel, DiagramTypes, GraphData, RuleOperator, TitleModel } from "$lib/types";
import type { Readable, Writable } from "svelte/store";

export interface Entity {
    id: string;
    name: string;
    label: string;
    metadata: {
        [key: string]: string | number | boolean;
    };
}
export interface RelationShip {
    id: string;
    from: string;
    label: string;
    type: "<->" | "->" | "<-";
    to: string;
    metadata: {
        [key: string]: string | number | boolean;
    };
}

export interface ConditionalFormatting { 
    id?: number;
    perspectiveId: number;
    name: string;
    isEnabled: boolean;
    label: string; 
    value: string; 
    metadataKey: string;
    operator: RuleOperator;
    ignoredDiagrams: number[];
    styling: {
        backgroundColor: {
            isSet: boolean;
            color?: string;
        };
        color: {
            isSet: boolean;
            color?: string;
        };
        borderColor: {
            isSet: boolean;
            color?: string;
        };
        fontWeight?: 'normal' | 'bold';
        fontStyle?: 'normal' | 'italic';
        textDecoration?: 'none' | 'underline' | 'line-through';
        content?: string;
    }
}

export interface Perspective {
    id?: number;
    name: string;
    selectedLabels: string[];
}

export interface DiagramOptions {
    id?: number;
    name: string;
    description: string;
    perspectiveId: number;
    diagramType: DiagramTypes;
    labelHierarchy: string[];
    hierarchyRelMod: string[];
    visibleLabels: string[];
    displayEmpty: boolean;
    rootAtLabel?: string;
    boxModel?: BoxModel;
    titleModel?: TitleModel;
    rootColumns?: number;
    diameter?: number;
    maxDepth?: number;
    columnsPerLabel: {
        [key: string]: number;
    };
    labelColors: {
        [key: string]: string;
    };
}

export type DataBaseOptions = {
  selectedDb: string;
  dbVersion: number;
}

export type LabelRelationShips = {
    fromLabel: string;
    toLabel: string;
    relationshipType: "<->" | "->" | "<-";
    relationshipLabel: string;
}
