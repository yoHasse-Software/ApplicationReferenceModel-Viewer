<script lang="ts">
    import { onMount } from 'svelte';
    import * as XLSX from 'xlsx';
    import Sidebar from './Sidebar.svelte';
    import { type AppSoftware, type ConditionalFormatting, type RuleOperator, type DisplayOptions, type GroupLevel, type LevelNode } from '$lib/types';
    import ConditionalFormatDialogue from './ConditionalFormatDialogue.svelte';
    import HierarchyDiagram from './HierarchyDiagram.svelte';
    import { Data, FilteredData, initData, setColumnHeaders, setData } from '$lib/datastore.svelte';
 
    // Example grouped data based on your CSV
    let filteredData: GroupLevel[] = $state([]);
    let isConditionalFormatingDialogueOpen = $state(false);

    let sideBarComponent = $state() as Sidebar;

    let rawCsvRows: Array<Record<string, string>> = $state([]);
    let columnHeaders: string[] = $state([]);
    let selectedColumns = $state({
        n1: '',
        n2: '',
        n3: '',
        app: ''
    });




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


    function confirmColumnSelection() {
        const { n1, n2, n3, app } = selectedColumns;

        const groupedData = groupData(rawCsvRows, n1, n2, n3, app);
        if (groupedData.length === 0) {
            alert('No data found.');
            return;
        }

        const nodeTree = generateNodeTree(groupedData);
        setData(nodeTree);
        setColumnHeaders(columnHeaders);

        showColumnSelector = false;

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
                        metadata: app.metadata,
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

    function closeFormatDialogue(){
        isConditionalFormatingDialogueOpen = false;
        // reload the page
        location.reload();
    }

    let hierarchyDiagram: HierarchyDiagram;

    onMount(() => {
        initData();

    });
  </script>

  <ConditionalFormatDialogue 
    isOpen={isConditionalFormatingDialogueOpen}
    columnHeaders={columnHeaders}
    onClose={() => closeFormatDialogue()} />

  
  <Sidebar 
    bind:this={sideBarComponent}
    onConditionalFormatDialogueOpen={() => isConditionalFormatingDialogueOpen = true} />


  {#if FilteredData.length === 0}
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

  {#if FilteredData.length > 0}
    <h1>Tillämpningsarkitekturen</h1>
  {/if}

  <HierarchyDiagram bind:this={hierarchyDiagram} />

<style>
  span[data-tooltip]{
    border-bottom: unset;
  }
  
</style>
