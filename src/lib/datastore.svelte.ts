import { SvelteMap } from "svelte/reactivity";
import type { ConditionalFormatting, DisplayOptions, GraphData, LevelNode } from "./types";
import { get, writable } from "svelte/store";

// export const N1WIDTH = 1200;
export const N2WIDTH = 1200;
export const N3WIDTH = N2WIDTH * 0.3;
export const APPWIDTH = N3WIDTH*0.8;

export const localStorageKey = 'graphData';
const localStorageLabelsKey = 'labels';

const localStorageConditionalFormattingKey = 'conditionalFormattingRules';





export const Data: GraphData = $state({
    nodes: [],
    relationships: []
});

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


export function initData(): GraphData {
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
  console.log('Filtered data updated:', FilteredData.nodes.length, FilteredData.relationships.length);
});  



let labels: string[] = $state([]);

export function initLabels(){
  if (labels.length > 0) {
      return labels;
  } else {
      labels = JSON.parse(localStorage.getItem(localStorageLabelsKey) || '[]');
      return labels;
  }
}
export function getLabels() {
    return labels;
}

export function setLabels(newLabels: string[]) {
    labels = newLabels;
    localStorage.setItem(localStorageLabelsKey, JSON.stringify(labels));
}

export const DisplayOpsStore = writable<DisplayOptions>({
    visibleLabels: [],
    displayEmpty: true
});

export const DisplayOps: DisplayOptions = $state({
    visibleLabels: [],
    displayEmpty: true
});

DisplayOpsStore.subscribe((value) => {
  DisplayOps.visibleLabels = value.visibleLabels;
  DisplayOps.displayEmpty = value.displayEmpty;
});

export let DimensionMap = new SvelteMap<string, {height: number, width: number}>();
export let PositionMap = new SvelteMap<string, {top: number, left: number}>();

export const ConditionalFormattingRules: Array<ConditionalFormatting> = $state([]);


export function setDimensionMap(newMap: SvelteMap<string, {height: number, width: number}>) {
    DimensionMap = newMap;
}

export function saveConditionalFormattingRulesToStorage() {
    localStorage.setItem(localStorageConditionalFormattingKey, JSON.stringify(ConditionalFormattingRules));
}

export function initConditionalFormattingRules(): Array<ConditionalFormatting> {
    if (ConditionalFormattingRules.length > 0) {
        return ConditionalFormattingRules;
    }

    const saved = localStorage.getItem(localStorageConditionalFormattingKey);
    if (saved) {
        const parsed = JSON.parse(saved) as Array<ConditionalFormatting>;
        ConditionalFormattingRules.push(...parsed);
        return parsed;
    } else {
        return [];
    }
}


export function getConditionalRules(node: LevelNode): ConditionalFormatting[] {
    const rules = ConditionalFormattingRules;

    if(node.metadata === undefined) {
        return [];
    }
    const metadata = node.metadata!;


    const appRules = rules
      .filter(r => metadata[r.column] !== undefined && r.value === metadata[r.column]);

    if (appRules.length === 0) {
      return [];
    }

    const condRules = appRules
      .filter(r => {
        if (r.column === 'default') {
          return true; // Default rule applies to all apps
        }
        switch(r.operator) {
          case 'equals':
            return metadata[r.column].toString().toLocaleLowerCase() === r.value.toLocaleLowerCase();
          case 'contains':
            return metadata[r.column].toString().toLocaleLowerCase().includes(r.value.toLocaleLowerCase());
          case 'startsWith':
            return metadata[r.column].toString().startsWith(r.value);
          case 'endsWith':
            return metadata[r.column].toString().endsWith(r.value);
          case 'greaterThan':
            return parseFloat(metadata[r.column].toString()) > parseFloat(r.value);
          case 'lessThan':
            return parseFloat(metadata[r.column].toString()) < parseFloat(r.value);
          case 'between':
            const [min, max] = r.value.split(',').map(Number);
            return parseFloat(metadata[r.column].toString()) >= min && parseFloat(node.name) <= max;
          case 'notEquals':
            return metadata[r.column] !== r.value;
          case 'notContains':
            return !metadata[r.column].toString().includes(r.value);
          case 'notStartsWith':
            return !metadata[r.column].toString().startsWith(r.value);
          case 'notEndsWith':
            return !metadata[r.column].toString().endsWith(r.value);
          default:
            return false;
        }
      });

    return condRules ?? [];
  }

 export function getStyling(app: LevelNode): string {
    console.log('Getting styling for app:', app.name);
    const rules = getConditionalRules(app);
    if (rules.length === 0) {
      return '';
    }

    let styleString = '';
    for (const rule of rules) {
      const { styling } = rule;
      if (styling.backgroundColor.isSet) {
        styleString += `background-color: ${styling.backgroundColor.color};`;
      }
      if (styling.color.isSet) {
        styleString += `color: ${styling.color.color};`;
      }
      if (styling.fontWeight) {
        styleString += `font-weight: ${styling.fontWeight};`;
      }
      if (styling.fontStyle) {
        styleString += `font-style: ${styling.fontStyle};`;
      }
      if (styling.textDecoration) {
        styleString += `text-decoration: ${styling.textDecoration};`;
      }
      if (styling.borderColor.isSet) {
        styleString += `border:4px solid ${styling.borderColor.color};`;
      }
    }

    console.log('Styling for app:', app.name, 'is', styleString);

    return styleString;
}

export function getStylingFromRules(rules: ConditionalFormatting[]): string {
    if (rules.length === 0) {
      return '';
    }

    let styleString = '';
    for (const rule of rules) {
      const { styling } = rule;
      if (styling.backgroundColor.isSet) {
        styleString += `fill: ${styling.backgroundColor.color};`;
      }
      if (styling.color.isSet) {
        styleString += `color: ${styling.color.color};`;
      }
      if (styling.fontWeight) {
        styleString += `font-weight: ${styling.fontWeight};`;
      }
      if (styling.fontStyle) {
        styleString += `font-style: ${styling.fontStyle};`;
      }
      if (styling.textDecoration) {
        styleString += `text-decoration: ${styling.textDecoration};`;
      }
    }

    return styleString;
}


