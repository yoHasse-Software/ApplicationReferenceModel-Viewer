export type AppSoftware = {
    name: string;
    metadata: {
        [key: string]: string | number | boolean;
    };
}

export type N3Group = { n3: string; apps: App[] };

export type N2Group = { n2: string; children: N3Group[] };

export type N1Group = { n1: string; groups: N2Group[] };

export type DisplayOptions = {
    showN1: boolean;
    showN2: boolean;
    showN3: boolean;
    showApps: boolean;
}

export type ConditionalFormattingRuleType = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'notEquals' | 'notContains' | 'notStartsWith' | 'notEndsWith';



export type ConditionalFormatting = { 
    name: string;
    column: string; 
    value: string; 
    type: ConditionalFormattingRuleType;
    emoji: string }
