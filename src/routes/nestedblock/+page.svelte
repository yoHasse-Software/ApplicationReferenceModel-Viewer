<script lang="ts">
    import { onMount } from 'svelte';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import { type AppSoftware, type RelationShip, type GroupLevel, type LevelNode, type GraphData, type Entity, type NodeRelation } from '$lib/types';
    import ConditionalFormatDialogue from '$lib/components/ConditionalFormatDialogue.svelte';
    import HierarchyDiagram from '$lib/components/HierarchyDiagram.svelte';
    import { FilteredData, initConditionalFormattingRules, initData, setLabels, setData } from '$lib/datastore.svelte';
    import * as Papa from 'papaparse';
    
    // Example grouped data based on your CSV
    let isConditionalFormatingDialogueOpen = $state(false);

    let sideBarComponent = $state() as Sidebar;

    let rawCsvRows: Array<Record<string, string>> = $state([]);
    let labels: string[] = $state([]);
    let labelConstrains: NodeRelation[] = $state([]);
    let loadType = $state("csv" as "csv" | "db");
    let selectedLabels: string[] = $state([]);
    let showLabelSelector = $state(false);
    let csvIdentityLabel: string = $state("name" as string);


    function flatCsvToGraph(csvRows: Array<Record<string, string>>, labels: string[], otherClmAsMetadata: boolean = false): GraphData {
        const graphData: GraphData = {
            nodes: [],
            relationships: []
        }

        for (const row of csvRows) {
            // Get additional columns and add them to the app object
            const metadata = !otherClmAsMetadata ? {} : row 
                ? Object.keys(row).reduce((acc, key) => {
                    if (!labels.includes(key)) {
                        acc[key] = row[key];
                    }
                    return acc;
                }, {} as Record<string, string>)
                : {};

            if(!row[csvIdentityLabel]) {
                console.error('No identity label found in row:', row);
                continue;
            }

            for (const label of labels) {
                if (!row[label]) {
                    console.error('No label found in row:', row, 'for label:', label);
                    continue;
                }
                const entity: Entity = {
                    id: crypto.randomUUID(),
                    name: row[label],
                    label: label,
                    metadata: metadata,
                };
                graphData.nodes.push(entity);
            }
        }

        return graphData;
    }

    function onFileSelect(event: Event) {
        loadType = "csv";
        const target = event.target as HTMLInputElement | null;
        if (!target?.files?.length) {
            console.error('No file selected');
            return;
        }
        const file = target.files[0];
        const reader = new FileReader();

        rawCsvRows = [];
        labels = [];
        selectedLabels = [];

        reader.onload = function (e) {
            const data = e.target?.result as string;
            const config = {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results: any) => {
                    console.log("Parsed CSV results:", results.data);
                },
            };

            var results = Papa.parse<Record<string, string>>(data, config);

            // Parse sheet to JSON

            rawCsvRows = results.data;
            labels = Object.keys(rawCsvRows[0] || {});
            showLabelSelector = true;
            labelConstrains = [];
        };

        reader.readAsArrayBuffer(file);
        
    }

    function loadCsv(){
        const dataGraph = flatCsvToGraph(rawCsvRows, selectedLabels);
        if (dataGraph.nodes.length === 0) {
            alert('No data found.');
            return [];
        }

        // const nodeTree = generateNodeTree(groupedData);
        setData(dataGraph);
        setLabels(labels);
    }

    async function loadFromDb(){
        const labelParamQuery = "labels=" + selectedLabels.join(',');
        const dataResponse = await fetch(`/api/graph/?${labelParamQuery}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!dataResponse.ok) {
            console.error('Failed to fetch data from database:', dataResponse.statusText);
            return;
        }

        const graphData = await dataResponse.json() as GraphData;

        console.log("Graph data from DB:", graphData);

        setData(graphData);
       

    }

    async function confirmColumnSelection() {
        if (selectedLabels.length === 0) {
            alert('Please select all columns.');
            return;
        }

        if(loadType === "csv"){
            loadCsv();
        }

        else if(loadType === "db"){
            loadFromDb();
        }

        showLabelSelector = false;

        location.reload(); // Reload the page to apply changes

    }

    function closeFormatDialogue(){
        isConditionalFormatingDialogueOpen = false;
    }

    async function onDbSelect(){
        loadType = "db";

        const getRelationShips = await fetch('/api/graph/relationships', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!getRelationShips.ok) {
            console.error('Failed to fetch data from database:', getRelationShips.statusText);
            return;
        }
        const relationShips = await getRelationShips.json() as NodeRelation[];

        labels = relationShips.flatMap(relation => {
            const fromLabel = relation.fromLabel;
            const toLabel = relation.toLabel;
            return [fromLabel, toLabel];
        });
        labels = [...new Set(labels)];
        labelConstrains = relationShips;

        showLabelSelector = true;
    }


    onMount(async () => {
        initData();
        initConditionalFormattingRules();


        selectedLabels = ["ApplicationArea", "ApplicationGroup","Application","Software"];
        await loadFromDb();

    });
  </script>



    


  {#if FilteredData.nodes.length === 0}

    {#if !showLabelSelector}
    <main>
        <article>
            <header>
                <span><strong>Select data to start</strong></span>
            </header>
            <label> 
                <span data-tooltip="Select a file to load data from">Load from excel file</span>
                <input style="margin:auto" type="file" accept=".csv" onchange={onFileSelect} />
            </label>
            <p>Or load from database</p>
            <div style="float:left;" >
                <button class="secondary" onclick={onDbSelect} >Load from database</button>
            </div>
        </article>
    </main>
    {:else}
    <div>
        <h3>Select Labels</h3>
        {#if loadType === "csv"}
            <!-- identityLabel -->
             Select identity label:
            <select bind:value={csvIdentityLabel}>
                <option value="" selected>Select identity label</option>
                {#each labels as col}
                    <option value={col}>{col}</option>
                {/each}
            </select>
            <br>
        {/if}
        {#each selectedLabels as labelName, idx}
            <label>
            {labelName}:
            <select bind:value={selectedLabels[idx]}>
                <option value="" selected>Select {labelName}</option>
            {#each labels as col}
                <option value={col}>{col}</option>
            {/each}
            </select>
            </label>
        {/each}
        <button onclick={() => selectedLabels.push('')} disabled={selectedLabels.length >= 5 ? true : null}>Add Label</button>
        <button onclick={confirmColumnSelection}>Load Data</button>
    </div>
    {/if}

  {/if}

  {#if FilteredData.nodes.length > 0}

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
