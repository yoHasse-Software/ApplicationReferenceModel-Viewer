import { SvelteMap } from "svelte/reactivity";
import type { BlockNode, BoxModel, DiagramTypes, DisplayOptions, GraphData, RuleOperator, TitleModel} from "./types";
import { get, writable, type Readable, type Writable } from "svelte/store";
import type { ConditionalFormatting, DataBaseOptions, DiagramOptions, Entity, RelationShip, Perspective } from "./components/db/dataRepository";
import { idb } from "./components/db/dexie";
import { liveQuery } from "dexie";

export const defaultPerspective: Perspective = {
  name: '',
  selectedLabels: [],
}


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

export const defaultConditionalFormatting: ConditionalFormatting = {
  perspectiveId: 0,
  ignoredDiagrams: [],
  isEnabled: true,
  name: '',
  label: '',
  value: '',
  metadataKey: '',
  operator: 'equals',
  styling: {
      backgroundColor: {
          isSet: false,
          color: '#ffffff',
      },
      color: {
          isSet: false,
          color: '#000000',
      },
      borderColor: {
          isSet: false,
          color: '#000000',
      },
  },
}

export const emptyOptions: DiagramOptions = {
  perspectiveId: 0,
  name: '',
  description: '',
  labelHierarchy: [],
  displayEmpty: true,
  columnsPerLabel: {},
  visibleLabels: [],
  labelColors: {},
  hierarchyRelMod: [],
  titleModel: defaultTitleModel,
  boxModel: defaultBoxModel,
  diagramType: "none",
  rootAtLabel: 'root'
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

export const diagramSelectOptions: DiagramTypes[] = [
  'nestedblock',
  'graph',
  'sunburst'
];


export type DialogueOption = 'visualization' | 'datastoreoptions' | 'sunburstoptions' | 'nestedblockoptions' | 'conditionalformatting' | 'diagramoptioncreate' | 'nodeinfo';

const openDialogue = new SvelteMap<DialogueOption, boolean>([
  ['visualization', false],
  ['datastoreoptions', false],
  ['sunburstoptions', false],
  ['nestedblockoptions', false],
  ['conditionalformatting', false],
  ['diagramoptioncreate', false],
  ['nodeinfo', false],
]);

export function isDialogueOpen(dialogue: DialogueOption | undefined = undefined) {
  if (!dialogue) {
    return Array.from(openDialogue.values()).some((value) => value === true);
  }
  return openDialogue.get(dialogue) ?? false;
}

export function toggleDialogueOption(dialogue: DialogueOption) {
  const currentValue = openDialogue.get(dialogue) ?? false;
  openDialogue.set(dialogue, !currentValue);
}

export function openDialogueOption(dialogue: DialogueOption) {
  openDialogue.forEach((value, key) => {
    if (key !== dialogue) {
      openDialogue.set(key, false);
    }
  });
  openDialogue.set(dialogue, true);
}

export function closeDialogueOption(dialogue: DialogueOption | undefined = undefined) {
  if (!dialogue) {
    openDialogue.forEach((value, key) => {
      openDialogue.set(key, false);
    });
    return;
  }
  openDialogue.set(dialogue, false);
}


export const currentViewState = $state({
  currentPerspective: 0,
  currentDiagramType: 'none' as DiagramTypes
});


export function getConditionalRules(node: Entity | BlockNode, formattingOptions: ConditionalFormatting[]): ConditionalFormatting[] {
    const rules = formattingOptions.filter((r) => r.isEnabled); // Get the rules from the store
  
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
