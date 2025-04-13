<script lang="ts">
    import { onMount } from 'svelte';
    import * as XLSX from 'xlsx';
    import Sidebar from './Sidebar.svelte';
    import { type AppSoftware, type GroupLevel, type LevelNode } from '$lib/types';
    import ConditionalFormatDialogue from './ConditionalFormatDialogue.svelte';
    import HierarchyDiagram from './HierarchyDiagram.svelte';
    import { FilteredData, initConditionalFormattingRules, initData, setColumnHeaders, setData } from '$lib/datastore.svelte';


    const { nodeTree }:
    { nodeTree: LevelNode[] } = $props();
 
    // Example grouped data based on your CSV
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

        location.reload(); // Reload the page to apply changes

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

    function sortAndMarkLeafEmpty(node: LevelNode, depth = 1): [LevelNode, boolean] {
        const indent = '  '.repeat(depth - 1);
        console.log(`${indent}🟦 Visiting: ${node.name} (children: ${node.children?.length ?? 0})`);

        if(!node.isGroup) {
            console.log(`${indent}🔹 Leaf node → ${node.name}`)
            return [node, false]; // Leaf node = not empty
        }

        if (!node.children || node.children.length === 0) {
            console.log(`${indent}🔹 Leaf node → EMPTY`);
            return [node, true]; // Leaf with no children = empty
        }

        let allLeafsEmpty = true;

        // Process and sort children
        const sortedWithFlags = node.children.map(child => {
            const [processedChild, isEmpty] = sortAndMarkLeafEmpty(child, depth + 1);

            if (!isEmpty) {
                allLeafsEmpty = false;
            }

            return [processedChild, isEmpty] as [LevelNode, boolean];
        });

        sortedWithFlags.forEach(([child, isEmpty]) => {
            console.log(`${indent}↪ ${child.name} is ${isEmpty ? 'EMPTY' : 'FULL'}`);
        });

        // Sort: full nodes before empty ones
        sortedWithFlags.sort((a, b) => {
            return a[1] === b[1] ? 0 : a[1] ? 1 : -1;
        });

        node.children = sortedWithFlags.map(([child]) => child);

        console.log(`${indent}⬅️ ${node.name} is ${allLeafsEmpty ? 'EMPTY' : 'FULL'} after sorting`);
        return [node, allLeafsEmpty];
        }

    function generateNodeTree(groups: GroupLevel[]): LevelNode[] {
        const nodes: LevelNode[] = [];
        for (const group of groups) {
            const groupNode = convertToNodeIterative(group);
            nodes.push(groupNode);
        }
        return nodes.map(n => sortAndMarkLeafEmpty(n)[0]);
    }

    function closeFormatDialogue(){
        isConditionalFormatingDialogueOpen = false;
        // reload the page
        // location.reload();
    }

    async function loadDataFromDb(){
        const dataResponse = await fetch('/api/arm', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await dataResponse.json();

        const orderedByName = data.sort((a: { name: string }, b: { name: string }) => {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
        });

        setData(orderedByName);

    }


    onMount(() => {
        initData();
        initConditionalFormattingRules();

        

    });
  </script>



    


  {#if FilteredData.length === 0}

    {#if !showColumnSelector}
    <main>
        <article>
            <header>
                <span><strong>Select data to start</strong></span>
            </header>
            <label> 
                <span data-tooltip="Select a file to load data from">Load from excel file</span>
                <input style="margin:auto" type="file" accept=".xlsx" onchange={handleFile} />
            </label>
            <p>Or load from database</p>
            <div style="float:left;" >
                <button class="secondary" onclick={loadDataFromDb} >Load from database</button>
            </div>
        </article>
    </main>
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

    <ConditionalFormatDialogue 
    isOpen={isConditionalFormatingDialogueOpen}
    onClose={() => closeFormatDialogue()} />


    <Sidebar 
    bind:this={sideBarComponent}
    onConditionalFormatDialogueOpen={() => isConditionalFormatingDialogueOpen = true} />
    
    <h1>Tillämpningsarkitekturen</h1>
    <HierarchyDiagram  />
  {/if}


<style>
  span[data-tooltip]{
    border-bottom: unset;
  }

  main {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        text-align: center;
    }
  
</style>
