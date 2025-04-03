<script lang="ts">
    import { onMount } from 'svelte';
    import * as XLSX from 'xlsx';
    import Sidebar from './Sidebar.svelte';
    import { type AppSoftware, type ConditionalFormatting, type RuleOperator, type DisplayOptions, type GroupLevel, type LevelNode } from '$lib/types';
    import NLevelView from './NLevelView.svelte';
    import ConditionalFormatDialogue from './ConditionalFormatDialogue.svelte';
    import HierarchyDiagram from './HierarchyDiagram.svelte';
 
    // Example grouped data based on your CSV
    let data: GroupLevel[] = $state([]);
    let filteredData: GroupLevel[] = $state([]);
    let isConditionalFormatingDialogueOpen = $state(false);
    let nodeData: LevelNode[] = $state([]);

    let conditionalFormatDialogue: ConditionalFormatDialogue;
    

    let sideBarComponent = $state() as Sidebar;

    let rawCsvRows: Array<Record<string, string>> = $state([]);
    let columnHeaders: string[] = $state([]);
    let selectedColumns = $state({
        n1: '',
        n2: '',
        n3: '',
        app: ''
    });

    let displayOptions: DisplayOptions = $state({
        showN1: true,
        showN2: true,
        showN3: true,
        showApps: true,
        displayEmpty: false
    });

    function isHeirarcyEmpty(root: GroupLevel): boolean {
      const stack: GroupLevel[] = [root];
      const visited = new Set<GroupLevel>();

      while (stack.length > 0) {
        const current = stack.pop()!;
        if (visited.has(current)) continue;
        visited.add(current);

        // If this node has children, it's NOT empty
        if (current.children && current.children.length > 0) {
          return false;
        }

        // Continue checking nested groups
        if (current.groups && current.groups.length > 0) {
          for (const group of current.groups) {
            stack.push(group);
          }
        }
      }

      // No children found anywhere in the hierarchy
      return true;
    }



    function getConditionalRules(app: AppSoftware): ConditionalFormatting[] {
      const rules = conditionalFormatDialogue.getConditionalFormattingRulese();

      const appRules = rules
        .filter(r => app.metadata[r.column] !== undefined && r.value === app.metadata[r.column]);

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
              return app.metadata[r.column].toString().toLocaleLowerCase() === r.value.toLocaleLowerCase();
            case 'contains':
              return app.metadata[r.column].toString().toLocaleLowerCase().includes(r.value.toLocaleLowerCase());
            case 'startsWith':
              return app.metadata[r.column].toString().startsWith(r.value);
            case 'endsWith':
              return app.metadata[r.column].toString().endsWith(r.value);
            case 'greaterThan':
              return parseFloat(app.metadata[r.column].toString()) > parseFloat(r.value);
            case 'lessThan':
              return parseFloat(app.metadata[r.column].toString()) < parseFloat(r.value);
            case 'between':
              const [min, max] = r.value.split(',').map(Number);
              return parseFloat(app.metadata[r.column].toString()) >= min && parseFloat(app.name) <= max;
            case 'notEquals':
              return app.metadata[r.column] !== r.value;
            case 'notContains':
              return !app.metadata[r.column].toString().includes(r.value);
            case 'notStartsWith':
              return !app.metadata[r.column].toString().startsWith(r.value);
            case 'notEndsWith':
              return !app.metadata[r.column].toString().endsWith(r.value);
            default:
              return false;
          }
        });

      return condRules ?? [];
    }

    function getStyling(app: AppSoftware): string {
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


    function groupData(csvRows: Array<Record<string, string>>, n1Key: string, n2Key: string, n3Key: string, appKey: string): GroupLevel[] {
        const grouped: GroupLevel[] = [];
        for (const row of csvRows) {
            const n1 = row[n1Key];
            const n2 = row[n2Key];
            const n3 = row[n3Key];
            const app: AppSoftware | null = row[appKey] ? {
                name: row[appKey],
                metadata: {} as Record<string, string>
            } : null;

            // Get additional columns and add them to the app object
            const metadata = row 
                ? Object.keys(row).reduce((acc, key) => {
                    if (![n1Key, n2Key, n3Key, appKey].includes(key)) {
                        acc[key] = row[key];
                    }
                    return acc;
                }, {} as Record<string, string>)
                : {};


            let n1Group = grouped.find(g => g.levelName === n1);
            if (!n1Group) {
              n1Group = { levelName: n1, groups: [] };
              grouped.push(n1Group);
            }

            let n2Group = n1Group.groups?.find(g => g.levelName === n2);
            if (!n2Group) {
              n2Group = { levelName: n2, groups: [] } as GroupLevel;
              n1Group.groups?.push(n2Group);
            }

            let n3Group = n2Group.groups?.find(g => g.levelName === n3);
            if (!n3Group) {
              n3Group = { levelName: n3, children: [] };
              n2Group.groups?.push(n3Group);
            }

            if (app) {
              for (const key in metadata) {
                if (metadata.hasOwnProperty(key)) {
                    app.metadata[key] = metadata[key];
                }
              }
              n3Group.children?.push(app);
            }
        }

        return grouped;
    }




    let showColumnSelector = $state(false);

    function handleFile(event: Event) {
        const target = event.target as HTMLInputElement | null;
        if (target?.files?.length) {
            const file = target.files[0];
            const reader = new FileReader();

            reader.onload = function (e) {
              const data = new Uint8Array(e.target?.result as ArrayBuffer);
              const workbook = XLSX.read(data, { type: 'array' });
              const sheetName = workbook.SheetNames[0];
              const sheet = workbook.Sheets[sheetName];

              // Parse sheet to JSON
              const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });

              rawCsvRows = json as Array<Record<string, string>>;
              columnHeaders = Object.keys(rawCsvRows[0] || {});
              showColumnSelector = true;
            };

            reader.readAsArrayBuffer(file);
        }
    }

    function clearData() {
        const confirmation = confirm('Are you sure you want to clear the data?');
        if (!confirmation) return;


        data = [];
        filteredData = [];
        rawCsvRows = [];
        columnHeaders = [];
        selectedColumns.n1 = '';
        selectedColumns.n2 = '';
        selectedColumns.n3 = '';
        selectedColumns.app = '';

        localStorage.removeItem('groupedData');
        localStorage.removeItem('columnHeaders');
        showColumnSelector = false;
    }

    function confirmColumnSelection() {
        const { n1, n2, n3, app } = selectedColumns;

        const groupedData = groupData(rawCsvRows, n1, n2, n3, app);
        if (groupedData.length === 0) {
            alert('No data found.');
            return;
        }

        localStorage.setItem('groupedData', JSON.stringify(groupedData));
        localStorage.setItem('columnHeaders', JSON.stringify(columnHeaders));
        showColumnSelector = false;

        readData();
    }

    function onDataFiltered(data: GroupLevel[]) {
        filteredData = data;
    }

    function onDisplayChanged(displayOpts: DisplayOptions) {
        displayOptions = displayOpts;
    }

    function readData() {
        const saved = localStorage.getItem('groupedData');
        if (saved) {
            data = JSON.parse(saved);
        } else {
            data = [];
        }
        filteredData = data;
        columnHeaders = JSON.parse(localStorage.getItem('columnHeaders') || '[]');
        nodeData = generateNodeTree(data);
    }

    function convertToNodeIterative(root: GroupLevel): LevelNode {
        const nodeMap = new Map<string, LevelNode>();
        const childrenMap = new Map<string, LevelNode[]>(); // to collect children per parent
        const toProcess: Set<{ group: GroupLevel; parentId?: string }> = new Set();

        const rootId = crypto.randomUUID();
        const rootNode: LevelNode = { 
            id: rootId, 
            value: 0,
            name: root.levelName,
            isGroup: true,
        };
        nodeMap.set(rootId, rootNode);

        toProcess.add({ group: root, parentId: undefined });

        // Set is used, but could also be Array if you want guaranteed FIFO/LIFO order
        while (toProcess.size > 0) {
            const [entry] = toProcess; // Get one from Set
            toProcess.delete(entry);

            const { group, parentId } = entry;
            const currentId = [...nodeMap.entries()].find(
                ([, node]) => node.name === group.levelName && node.parent === parentId
            )?.[0] ?? crypto.randomUUID();

            const currentNode = nodeMap.get(currentId) ?? {
                id: currentId,
                value: 0,
                name: group.levelName,
                parent: parentId,
                isGroup: true,
            };

            // Store back in case it wasn't yet
            nodeMap.set(currentId, currentNode);

            // Prepare to add children
            const groupChildren: LevelNode[] = [];

            // Add AppSoftware as leaves
            if (group.children) {
                for (const app of group.children) {
                    const appNode: LevelNode = {
                        id: crypto.randomUUID(),
                        value: 0,
                        name: app.name,
                        parent: currentId,
                        isGroup: false,
                    };
                    groupChildren.push(appNode);
                    nodeMap.set(appNode.id, appNode);
                }
            }

            // Add nested groups
            if (group.groups) {
                for (const subgroup of group.groups) {
                    const subgroupId = crypto.randomUUID();
                    const subgroupNode: LevelNode = {
                        id: subgroupId,
                        value: 0,
                        name: subgroup.levelName,
                        parent: currentId,
                        isGroup: true,
                    };
                    nodeMap.set(subgroupId, subgroupNode);
                    groupChildren.push(subgroupNode);
                    toProcess.add({ group: subgroup, parentId: currentId });
                }
            }

            if (groupChildren.length > 0) {
                currentNode.children = groupChildren;
            }
        }

        return rootNode;
    }

    function generateNodeTree(groups: GroupLevel[]): LevelNode[] {
        const nodes: LevelNode[] = [];
        for (const group of groups) {
            const groupNode = convertToNodeIterative(group);
            nodes.push(groupNode);
        }
        return nodes;
    }


    onMount(() => {
        readData();
    });
  </script>

  <ConditionalFormatDialogue 
    bind:this={conditionalFormatDialogue}
    isOpen={isConditionalFormatingDialogueOpen}
    columnHeaders={columnHeaders}
    onClose={() => isConditionalFormatingDialogueOpen = false} />

  
  <Sidebar bind:this={sideBarComponent}
    data={data} 
    onDisplayChanged={onDisplayChanged}
    onDataFiltered={onDataFiltered}
    onConditionalFormatDialogueOpen={() => isConditionalFormatingDialogueOpen = true}
    onClearData={clearData} />


  {#if data.length === 0}
    {#if !showColumnSelector}
    <input type="file" accept=".xlsx" onchange={handleFile} />
    {:else}
    <div>
        <h3>Select Columns</h3>
        <label>
        N1:
        <select bind:value={selectedColumns.n1}>
            {#each columnHeaders as col}
            <option value={col}>{col}</option>
            {/each}
        </select>
        </label>

        <label>
        N2:
        <select bind:value={selectedColumns.n2}>
            {#each columnHeaders as col}
            <option value={col}>{col}</option>
            {/each}
        </select>
        </label>

        <label>
        N3:
        <select bind:value={selectedColumns.n3}>
            {#each columnHeaders as col}
            <option value={col}>{col}</option>
            {/each}
        </select>
        </label>

        <label>
        App:
        <select bind:value={selectedColumns.app}>
            {#each columnHeaders as col}
            <option value={col}>{col}</option>
            {/each}
        </select>
        </label>

        <button onclick={confirmColumnSelection}>Load Data</button>
    </div>
    {/if}

  {/if}

  {#if data.length > 0}
    <h1>Tillämpningsarkitekturen</h1>
  {/if}

  <HierarchyDiagram data={nodeData}/>

  
<!-- {#each filteredData as n1Block}
  <NLevelView level={1} title={n1Block.levelName} displayLevel={displayOptions.showN1 && (displayOptions.displayEmpty || !isHeirarcyEmpty(n1Block))}>
      {#each n1Block.groups ?? [] as n2Block}
        <NLevelView level={2} title={n2Block.levelName} displayLevel={displayOptions.showN2 && (displayOptions.displayEmpty || !isHeirarcyEmpty(n2Block))} gridChildren={true}>
          {#each n2Block.groups ?? [] as n3Block}
            <NLevelView level={3} title={n3Block.levelName} displayLevel={displayOptions.showN3 && (displayOptions.displayEmpty || !isHeirarcyEmpty(n3Block))} gridChildren={true}>
                {#each n3Block.children ?? [] as app}
                  <NLevelView level={4} title={app} displayLevel={displayOptions.showApps} addHeader={false}
                    styling={getStyling(app)}>
                        <span>{app.name}</span>
                        <div>
                        {#each getConditionalRules(app) as rule}
                          <span class="formats" data-tooltip={`${rule.name} - ${rule.column}`} >{rule.styling.content ?? ''}</span>
                        {/each}
                      </div>
                  </NLevelView>
                {/each}
            </NLevelView>
          {/each}
        </NLevelView>
      {/each}
  </NLevelView>
{/each} -->



<style>
  span[data-tooltip]{
    border-bottom: unset;
  }
  
</style>
