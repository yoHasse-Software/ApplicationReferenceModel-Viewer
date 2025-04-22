<script lang="ts">
    import { onMount } from 'svelte';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import { type AppSoftware, type RelationShip, type GroupLevel, type LevelNode, type GraphData, type Entity, type NodeRelation } from '$lib/types';
    import ConditionalFormatDialogue from '$lib/components/ConditionalFormatDialogue.svelte';
    import NestedBlockDiagram from '$lib/components/NestedBlockDiagram.svelte';
    import { FilteredData, initConditionalFormattingRules, initData, setLabels, setData, initLabels, initDisplayOptions } from '$lib/datastore.svelte';
    import * as Papa from 'papaparse';
    
    // Example grouped data based on your CSV
    let isConditionalFormatingDialogueOpen = $state(false);

    let sideBarComponent: Sidebar;

    let rawCsvRows: Array<Record<string, string>> = $state([]);
    let labels: string[] = $state([]);
    let labelConstrains: NodeRelation[] = $state([]);
    let loadType = $state("csv" as "csv" | "db"  | "json");
    let selectedLabels: string[] = $state([""]);
    let showLabelSelector = $state(false);
    let csvIdentityLabel: string = $state("name" as string);
    let jsonGraphData: GraphData = $state({} as GraphData);


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
        const target = event.target as HTMLInputElement | null;
        if (!target?.files?.length) {
            console.error('No file selected');
            return;
        }
        const file = target.files[0];

        // Continue
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (fileExtension === 'csv') {
            loadType = "csv";
            readCsv(file);
            
        } else if (fileExtension === 'json') {
            loadType = "json";
            readJson(file);
        } else {
            console.error('Unsupported file type:', fileExtension);
        }


    }

    function readJson(file: File) {
        const reader = new FileReader();

        labels = [];
        selectedLabels = [];

        reader.onload = function (e) {
            const data = e.target?.result as string;
            const jsonData = JSON.parse(data) as GraphData;

            // Get all different labels from enteties and add to labels
            const uniqueLabels = new Set<string>();
            jsonData.nodes.forEach((node) => {
                if (node.label) {
                    uniqueLabels.add(node.label);
                }
            });
            labels = Array.from(uniqueLabels);

            jsonGraphData = jsonData;
            console.log("Parsed JSON data:", jsonData);


            labelConstrains = [];
            selectedLabels = labels[0] ? [labels[0]] : [];
            showLabelSelector = true;
        };

        reader.readAsText(file);

    }

    function readCsv(file: File) {
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
    }

    function loadJson(){
        const dataGraph = jsonGraphData;
        if (dataGraph.nodes.length === 0) {
            alert('No data found.');
            return [];
        }

        // filter out selected labels and their relationships
        const filteredNodes = dataGraph.nodes.filter(node => selectedLabels.includes(node.label));
        const filteredRelationships = dataGraph.relationships.filter(rel => {
            return filteredNodes.some(node => node.id === rel.from || node.id === rel.to);
        });

        dataGraph.nodes = filteredNodes;
        dataGraph.relationships = filteredRelationships;

        // const nodeTree = generateNodeTree(groupedData);
        setData(dataGraph);
    }

    async function loadFromDb(){
        console.log("Loading from DB with labels:", selectedLabels);
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
        if (selectedLabels.length === 0 || selectedLabels.some(label => label === "")) {
            alert('Please select all columns.');
            return;
        }

        setLabels(selectedLabels);

        if(loadType === "csv"){
            loadCsv();
        }
        else if(loadType === "db"){
            await loadFromDb();
        }
        else if(loadType === "json"){
            loadJson();
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

        console.log()

        labels = relationShips.flatMap(relation => {
            const fromLabel = relation.fromLabel;
            const toLabel = relation.toLabel;
            return [fromLabel, toLabel];
        });

        labels = [...new Set(labels)];
        labelConstrains = relationShips;

        showLabelSelector = true;
    }

    function getLabelOptions(index: number){
        console.log('getfor', index, loadType);
        if(loadType === 'csv'){
            return labels;
        }

        if(loadType === 'json'){
            return labels;
        }
        
        if(loadType === 'db'){
            if (index === 0) {
                return labels;
            }
            console.log(selectedLabels[index - 1]);
            const labelOptions = labelConstrains
                .filter((relation) => relation.fromLabel === selectedLabels[index - 1])
                .map((relation) => relation.toLabel);

            console.log('labelOptions', labelOptions);

            return [...new Set(labelOptions)];
        }

        return [];
    }

    const canAddLabel = () => {
        if(selectedLabels.length >= 5) {
            console.error('Maximum number of labels reached.');
            return false;
        }

        if(selectedLabels.length === 1){
            return true;
        }
        const lastLabel = selectedLabels.length > 2 ? selectedLabels[selectedLabels.length - 2] : selectedLabels[0];
        if (lastLabel === "" && selectedLabels.length > 1) {
            console.error('Last label is empty. Please select a label.', selectedLabels);
            return false;
        }
        
        const labelOptions = getLabelOptions(selectedLabels.length-1);

        if (labelOptions.length === 0) {
            console.error('No more labels available for selection. Based on relationship constraints.', selectedLabels);
            return false;
        }
        return labelOptions.length > 0;
    };


    onMount(async () => {
        initLabels();
        initDisplayOptions();
        initData();
        initConditionalFormattingRules();
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
                <span data-tooltip="Select a file to load data from">Load from csv or json file</span>
                <input style="margin:auto" type="file" accept=".csv, .json" onchange={onFileSelect} />
            </label>
            <p>Or load from database</p>
            <div style="float:left;" >
                <button class="secondary" onclick={onDbSelect} >Load from database</button>
            </div>
        </article>
    </main>
    {:else}
    <div >
        <h3>Select Labels</h3>
        {#if loadType === "csv"}
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
                Level {idx+1}:
                <div role="group">

                <select bind:value={selectedLabels[idx]}>
                    <option value="" selected>Select for level {idx+1}</option>
                {#each getLabelOptions(idx) as col}
                    <option value={col}>{col}</option>
                {/each}
                </select>
                <button type="button" onclick={() => selectedLabels.splice(idx, 1)} disabled={selectedLabels.length <= 1 ? true : null} aria-label="remove label">
                    <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-trash"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>
                </button>
                </div>

            </label>
        {/each}
        {#if !canAddLabel()}
            <span style="color: red;">
                {#if getLabelOptions(selectedLabels.length).length === 0}
                    No more labels available for selection. Based on relationship constraints.
                {:else}
                    Maximum number of labels reached.
                {/if}
            </span>
        {/if}
        <div role="group">
            <button class="outline" onclick={() => selectedLabels.push('')} disabled={!canAddLabel() ? true : null}>Add Label</button>
            <button onclick={async () => await confirmColumnSelection()}>Load Data</button>
        </div>

    </div>
    {/if}

  {/if}


  {#if FilteredData.nodes.length > 0}
    <h1>Tillämpningsarkitekturen</h1>
    <NestedBlockDiagram  />
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
