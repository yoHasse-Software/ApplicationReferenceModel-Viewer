import { SvelteMap } from "svelte/reactivity";
import type { ConditionalFormatting, DisplayOptions, LevelNode } from "./types";
import { get, writable } from "svelte/store";

// export const N1WIDTH = 1200;
export const N2WIDTH = 1200;
export const N3WIDTH = N2WIDTH * 0.3;
export const APPWIDTH = N3WIDTH*0.8;
export const LABEL_HEIGHT = 24;



export const Data: LevelNode[] = $state([]);

export function setData(newData: LevelNode[]) {
    Data.splice(0, Data.length); // Clear existing data
    Data.push(...newData); // Add new data
    localStorage.setItem('groupedData', JSON.stringify(Data));
}

export function resetData() {
    Data.splice(0, Data.length); // Clear existing data
    localStorage.removeItem('groupedData'); // Remove from local storage
    FilterDataStore.set([]); // Clear filtered data store
}


export function initData(): LevelNode[] {
    if (Data.length > 0) {
        return Data;
    }

    const saved = localStorage.getItem('groupedData');
    if (saved) {
        const parsed = JSON.parse(saved) as LevelNode[];



        setData(parsed); // Initialize DataStore with parsed data
        setFilteredData(parsed); // Initialize FilterDataStore with parsed data
        return parsed;
    } else {
        return [];
    }
}


export const FilterDataStore = writable<LevelNode[]>([]);


export const FilteredData: LevelNode[] = $state([]);

export function setFilteredData(newData: LevelNode[]) {
    FilterDataStore.set(newData);
}

FilterDataStore.subscribe((value) => {
  if(value.length === 0) {
    console.log('No filtered data available. Using original data.', value.length);
    return;
  }
  
  FilteredData.length = 0; // Clear the existing data
  FilteredData.push(...value); // Add new data
});  



let columnHeaders: string[] = $state([]);
export function getColumnHeaders() {
    if (columnHeaders.length > 0) {
        return columnHeaders;
    } else {
        columnHeaders = JSON.parse(localStorage.getItem('columnHeaders') || '[]');
        return columnHeaders;
    }
}

export function setColumnHeaders(newHeaders: string[]) {
    columnHeaders = newHeaders;
    localStorage.setItem('columnHeaders', JSON.stringify(columnHeaders));
}

export const DisplayOpsStore = writable<DisplayOptions>({
    showN1: true,
    showN2: true,
    showN3: true,
    showApps: true,
    displayEmpty: true
});

export const DisplayOps: DisplayOptions = $state({
    showN1: true,
    showN2: true,
    showN3: true,
    showApps: true,
    displayEmpty: true
});

DisplayOpsStore.subscribe((value) => {
  DisplayOps.showN1 = value.showN1;
  DisplayOps.showN2 = value.showN2;
  DisplayOps.showN3 = value.showN3;
  DisplayOps.showApps = value.showApps;
  DisplayOps.displayEmpty = value.displayEmpty;
});

export let DimensionMap = new SvelteMap<string, {height: number, width: number}>();
export let PositionMap = new SvelteMap<string, {top: number, left: number}>();

export const ConditionalFormattingRules: Array<ConditionalFormatting> = $state([]);


export function setDimensionMap(newMap: SvelteMap<string, {height: number, width: number}>) {
    DimensionMap = newMap;
}

export function saveConditionalFormattingRulesToStorage() {
    localStorage.setItem('ConditionalFormattingRules', JSON.stringify(ConditionalFormattingRules));
}

export function initConditionalFormattingRules(): Array<ConditionalFormatting> {
    if (ConditionalFormattingRules.length > 0) {
        return ConditionalFormattingRules;
    }

    const saved = localStorage.getItem('ConditionalFormattingRules');
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


