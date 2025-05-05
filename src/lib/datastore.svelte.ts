import { SvelteMap } from "svelte/reactivity";
import type { BlockNode, BoxModel, DiagramTypes, DisplayOptions, GraphData, RuleOperator, TitleModel} from "./types";
import { get, writable } from "svelte/store";
import { db, type ConditionalFormatting, type DiagramOptions, type Entity } from "./components/db/dexie";
import { liveQuery } from "dexie";


// export const N1WIDTH = 1200;
export const N2WIDTH = 1200;
export const N3WIDTH = N2WIDTH * 0.3;
export const APPWIDTH = N3WIDTH*0.8;

export const defaultBoxModel: BoxModel = {
  minWidth: 100,
  minHeight: 40,
  spacing: 10
}

export const defaultTitleModel: TitleModel = {
  fontSettings: {
    fontSize: 24,
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontWeight: 'normal',
  },
  offsets: {
    top: 10,
    bottom: 0,
    left: 10,
    right: 0,
  },
}

export const emptyOptions: DiagramOptions = {
  labelHierarchy: [],
  displayEmpty: true,
  columnsPerLabel: {},
  visibleLabels: [],
  labelColors: {},
  hierarchyRelMod: [],
  titleModel: defaultTitleModel,
  boxModel: defaultBoxModel,
  diagramType: "none"
}





export const RuleOperatoruleOptions: RuleOperator[] = [
    'equals',
    'contains',
    'startsWith',
    'endsWith',
    'greaterThan',
    'lessThan',
    'between',
    'notEquals',
    'notContains',
    'notStartsWith',
    'notEndsWith',
];

export type DialogueOption = 'sunburstoptions' | 'nestedblockoptions' | 'conditionalformatting' | 'labeloptions' | 'filteroptions' | 'exportoptions' | 'importoptions' | 'resetoptions' | 'helpoptions';

export const openDialogue = new SvelteMap<DialogueOption, boolean>([
  ['sunburstoptions', false],
  ['nestedblockoptions', false],
  ['conditionalformatting', false],
  ['labeloptions', false],
  ['filteroptions', false],
  ['exportoptions', false],
  ['importoptions', false],
  ['resetoptions', false],
  ['helpoptions', false]
]);


export const enteties = liveQuery(
    () => db.enteties.toArray() // Get all entities
)


export const relationships = liveQuery(
    () => db.relationships.toArray() // Get all relationships
)

export const conditionalFormatting = liveQuery(
    () => db.conditionalFormatting.toArray() // Get all conditional formatting rules
)

export const diagramOptions = liveQuery(
    () => db.diagramOptions.toArray() // Get all diagram options
)



let inmemoryRules: ConditionalFormatting[] = $state([]);

export function initialize(){
  conditionalFormatting.subscribe((rules) => {
    inmemoryRules = rules;
  });
}





export let DimensionMap = new SvelteMap<string, {height: number, width: number}>();
export let PositionMap = new SvelteMap<string, {top: number, left: number}>();


export function setDimensionMap(newMap: SvelteMap<string, {height: number, width: number}>) {
    DimensionMap = newMap;
}





export function getConditionalRules(node: Entity | BlockNode): ConditionalFormatting[] {
    const rules = inmemoryRules; // Get the rules from the store
  
    if (!rules || rules.length === 0) {
      return []; // No rules available
    }

    const nodeRule = rules
      .filter(r => r.label === node.label || r.label === 'default');

    if (nodeRule.length === 0) {
      return [];
    }    

    const condRules = nodeRule
      .filter(r => {
        if (r.label === 'default') {
          return true; // Default rule applies to all apps
        }

        const value = node[r.metadataKey as keyof Entity] || node.metadata?.[r.metadataKey];

        switch(r.operator) {
          case 'equals':
            return value?.toString().toLocaleLowerCase() === r.value?.toLocaleLowerCase() || false;
          case 'contains':
            return value?.toString().toLocaleLowerCase().includes(r.value?.toLocaleLowerCase());
          case 'startsWith':
            return value.toString().startsWith(r.value);
          case 'endsWith':
            return value.toString().endsWith(r.value);
          case 'greaterThan':
            return parseFloat(value.toString()) > parseFloat(r.value);
          case 'lessThan':
            return parseFloat(value.toString()) < parseFloat(r.value);
          case 'between':
            const [min, max] = r.value.split(',').map(Number);
            return parseFloat(value.toString()) >= min && parseFloat(node.name) <= max;
          case 'notEquals':
            return value !== r.value;
          case 'notContains':
            return !value.toString().includes(r.value);
          case 'notStartsWith':
            return !value.toString().startsWith(r.value);
          case 'notEndsWith':
            return !value.toString().endsWith(r.value);
          default:
            return false;
        }
      });

    if (condRules.length === 0) {
      return []; // No rules matched
    }
    

    return condRules ?? [];
  }


