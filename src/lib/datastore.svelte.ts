import { SvelteMap } from "svelte/reactivity";
import type { BlockNode, ConditionalFormatting, DisplayOptions, Entity, GraphData, LevelNode, RuleOperator } from "./types";
import { get, writable } from "svelte/store";

// export const N1WIDTH = 1200;
export const N2WIDTH = 1200;
export const N3WIDTH = N2WIDTH * 0.3;
export const APPWIDTH = N3WIDTH*0.8;

export const localStorageKey = 'graphData';
const localStorageLabelsKey = 'labels';
const localStorageDisplayOptionsKey = 'displayOptions';

const localStorageConditionalFormattingKey = 'conditionalFormattingRules';


const emptyOptions: DisplayOptions = {  
  nestedBlockOptions: {
    labelHierarchy: [],
    displayEmpty: false,
    columnsPerLabel: {},
    visibleLabels: [],
    labelColors: {},
    boxModel: {
      minWidth: 100,
      minHeight: 40,
      spacing: 5,
    },
  },
  sunBurstOptions: {
    labelHierarchy: [],
    rootColumns: 0,
  }
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

const Data: GraphData = $state({
    nodes: [],
    relationships: []
});

export function getData() {
    return Data; // Return the current data
}

export function setData(newData: GraphData) {
    Data.nodes = newData.nodes; // Set new nodes
    Data.relationships = newData.relationships; // Set new relationships
    localStorage.setItem(localStorageKey, JSON.stringify(Data));
}


export function resetData() {
    Data.nodes = []; // Clear nodes
    Data.relationships = []; // Clear relationships
    localStorage.removeItem(localStorageKey); // Remove from local storage
    FilterDataStore.set({
        nodes: [],
        relationships: []
    }); // Clear filtered data store
}

export function initializeDataStores(){
    initDisplayOptions();
    initData();
    initConditionalFormattingRules();
}


function initData(): GraphData {
    const saved = localStorage.getItem(localStorageKey);
    if (saved) {
        const parsed = JSON.parse(saved) as GraphData;
        setData(parsed);
        setFilteredData(parsed);
        return parsed;
    } else {
        return {
            nodes: [],
            relationships: []
        };
    }
}


export const FilterDataStore = writable<GraphData>();


export const FilteredData: GraphData = $state({
    nodes: [],
    relationships: []
});

export function setFilteredData(newData: GraphData) {
    FilterDataStore.set(newData);
}

FilterDataStore.subscribe((value) => {
  if(!value || value.nodes?.length === 0) {
    console.log('No filtered data available. Using original data.', value?.nodes?.length );
    return;
  }
  FilteredData.nodes = value.nodes; // Set new nodes
  FilteredData.relationships = value.relationships; // Set new relationships
});  




export const DisplayOpsStore = writable<DisplayOptions>(emptyOptions);

 const DisplayOps: DisplayOptions = $state(emptyOptions);

function initDisplayOptions(): DisplayOptions {
    const saved = localStorage.getItem(localStorageDisplayOptionsKey);
    if (saved) {
        const parsed = JSON.parse(saved) as DisplayOptions;
        setDisplayOptions(parsed); // Update the store with the current display options
        return parsed;
    } else {
        return emptyOptions;
    }
}


export function setDisplayOptions(newDisplayOptions: DisplayOptions) {
    DisplayOpsStore.set(newDisplayOptions); // Update the store with the new display options
    localStorage.setItem(localStorageDisplayOptionsKey, JSON.stringify(newDisplayOptions)); // Save to local storage
}

export function getDisplayOptions() {
    return DisplayOps; // Return the current display options
}


DisplayOpsStore.subscribe((value) => {
  DisplayOps.nestedBlockOptions = value.nestedBlockOptions; // Update the display options in the store
  DisplayOps.sunBurstOptions = value.sunBurstOptions; // Update the display options in the store
});

export let DimensionMap = new SvelteMap<string, {height: number, width: number}>();
export let PositionMap = new SvelteMap<string, {top: number, left: number}>();


const ConditionalFormattingRules: { rules: Array<ConditionalFormatting>} = $state({
  rules: [],
});

export const ConditionalFormattingStore = writable<ConditionalFormatting[]>([]);

ConditionalFormattingStore.subscribe((value) => {
  ConditionalFormattingRules.rules = value; // Update the rules in the store
});

export function getConditionalFormattingRules() {
    return ConditionalFormattingRules.rules;
}
export function setConditionalFormattingRules(newRules: Array<ConditionalFormatting>) {
    ConditionalFormattingStore.set(newRules); // Update the store with the new rules

    localStorage.setItem(localStorageConditionalFormattingKey, JSON.stringify(ConditionalFormattingRules.rules));
}

export function setDimensionMap(newMap: SvelteMap<string, {height: number, width: number}>) {
    DimensionMap = newMap;
}


function initConditionalFormattingRules(): Array<ConditionalFormatting> {
    if (ConditionalFormattingRules.rules.length > 0) {
        return ConditionalFormattingRules.rules;
    }

    const saved = localStorage.getItem(localStorageConditionalFormattingKey);
    if (saved) {
        const parsed = JSON.parse(saved) as Array<ConditionalFormatting>;
        setConditionalFormattingRules(parsed); // Update the store with the current rules
        return parsed;
    } else {
        return [];
    }
}


export function getConditionalRules(node: Entity | BlockNode): ConditionalFormatting[] {
    const rules = ConditionalFormattingRules.rules;

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


