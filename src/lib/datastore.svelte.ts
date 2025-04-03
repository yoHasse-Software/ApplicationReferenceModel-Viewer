import { SvelteMap } from "svelte/reactivity";
import type { ConditionalFormatting, DisplayOptions, LevelNode } from "./types";

export const Data: LevelNode[] = $state([]);

export function setData(newData: LevelNode[]) {
    Data.length = 0; // Clear the existing data
    Data.push(...newData); // Add new data
    localStorage.setItem('groupedData', JSON.stringify(Data));
}

export function initData(): LevelNode[] {
    if (Data.length > 0) {
        return Data;
    }

    const saved = localStorage.getItem('groupedData');
    if (saved) {
        const parsed = JSON.parse(saved) as LevelNode[];
        Data.push(...parsed);
        return parsed;
    } else {
        return [];
    }
}

export const FilteredData: LevelNode[] = $state([]);

export function setFilteredData(newData: LevelNode[]) {
    console.log('Setting filtered data:', newData);
    FilteredData.length = 0; // Clear the existing data
    FilteredData.push(...newData); // Add new data
}

export function getFilteredData(): LevelNode[] {
    if (FilteredData.length > 0) {
        return FilteredData;
    }

    return Data;
}

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


export let displayOptions: DisplayOptions = $state({
    showN1: true,
    showN2: true,
    showN3: true,
    showApps: true,
    displayEmpty: false
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
    }

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


