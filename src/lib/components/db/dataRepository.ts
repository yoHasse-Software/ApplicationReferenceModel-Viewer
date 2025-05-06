import type { BoxModel, DiagramTypes, RuleOperator, TitleModel } from "$lib/types";
import type { Writable } from "svelte/store";

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
    id: string;
    name: string;
    label: string; 
    value: string; 
    metadataKey: string;
    operator: RuleOperator;
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

export interface DiagramOptions {
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


export interface DataRepository {
    getEnteties(): Promise<Entity[]>;
    getEntitiesByLabel(label: string): Promise<Entity[]>;
    getAllLabels(): Promise<string[]>;
    getRelationships(): Promise<RelationShip[]>;
    getConditionalFormatting(): Promise<ConditionalFormatting[]>;
    getDiagramOptions(): Promise<DiagramOptions[]>;
    getLabelRelationships(label:string): Promise<RelationShip[]>;
    getLabelRelations(labels: string[]): Promise<LabelRelationShips[]>;
    initialize(): Promise<void>;
    getAvailableStores(): Promise<string[]>;
    addConditionalFormatting(conditionalFormatting: ConditionalFormatting): Promise<void>;
    updateConditionalFormatting(conditionalFormatting: ConditionalFormatting): Promise<void>;
    deleteConditionalFormatting(id: string): Promise<void>;

    addDiagramOptions(diagramOptions: DiagramOptions): Promise<void>;
    updateDiagramOptions(diagramOptions: DiagramOptions): Promise<void>;
}