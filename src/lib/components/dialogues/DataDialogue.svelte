<script lang="ts">
    import { goto } from "$app/navigation";
    import type { DataBaseOptions, Entity } from "$lib/components/db/dataRepository";
    import { getLocalStore } from "$lib/components/localStore.svelte";
    import { closeDialogueOption,isDialogueOpen } from "$lib/datastore.svelte";
    import type { GraphData, NodeRelation } from "$lib/types";
    import Dexie, { liveQuery } from "dexie";
    
    import Papa from "papaparse";
    import { onMount, tick } from "svelte";
    import { idb } from "../db/dexie";
    import { scale } from "svelte/transition";
    let loadType = $state("csv" as "csv" | "db"  | "json");

    let rawCsvRows: Array<Record<string, string>> = $state([]);
    let labels: string[] = $state([]);
    let labelConstrains: NodeRelation[] = $state([]);
    let selectedLabels: string[] = $state([""]);
    let showLabelSelector = $state(false);
    let csvIdentityLabel: string = $state("name" as string);
    let storeNames: string[] = $state([]);
    let sampleTxtArea: HTMLTextAreaElement;
    let loadedEnteteies = liveQuery(
        () => idb.enteties.count()
    );
    let loadedRelationships = liveQuery(
        () => idb.relationships.count()
    );
    const jsonGraphData: GraphData = $state({
        nodes: [],
        relationships: []
    });
    let overwriteExistingData = $state(false);

    async function addToDataStore(dataGraph: GraphData) {
                // const nodeTree = generateNodeTree(groupedData);
        const deepClone = Dexie.deepClone(dataGraph);
        await idb.enteties.bulkPut(deepClone.nodes).catch((error) => {
            console.error('Error saving data to database:', error);
        });
        await idb.relationships.bulkPut(deepClone.relationships).catch((error) => {
            console.error('Error saving data to database:', error);
        });
    }

    async function loadCsv(){
        const dataGraph = flatCsvToGraph(rawCsvRows, selectedLabels);
        if (dataGraph.nodes.length === 0) {
            alert('No data found.');
            return [];
        }

        jsonGraphData.nodes = dataGraph.nodes;
        jsonGraphData.relationships = dataGraph.relationships;
        sampleTxtArea.value = JSON.stringify(jsonGraphData, null, 2);

        await addToDataStore(jsonGraphData);
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
        await getRelationShips.json() as NodeRelation[];
        

    }

    async function confirmColumnSelection() {
        if (selectedLabels.length === 0 || selectedLabels.some(label => label === "")) {
            alert('Please select all columns.');
            return;
        }

        if(loadType === "csv"){
            await loadCsv();
        }
        else if(loadType === "db"){
            await loadFromDb();
        }

        else if(loadType === "json"){
            
            
        }


        showLabelSelector = false;

        location.reload(); // Reload the page to apply changes

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

        await addToDataStore(graphData);
        
    }

    async function onFileSelect(event: Event) {
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
            await readCsv(file);
            
        } else if (fileExtension === 'json') {
            loadType = "json";
            await readJson(file);
        } else {
            console.error('Unsupported file type:', fileExtension);
        }
    }

    async function readJson(file: File) {
        const reader = new FileReader();

        labels = [];
        selectedLabels = [];
        jsonGraphData.nodes = [];
        jsonGraphData.relationships = [];

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

            jsonGraphData.relationships = jsonData.relationships;
            jsonGraphData.nodes = jsonData.nodes;

            labelConstrains = [];
            selectedLabels = labels[0] ? [labels[0]] : [];
        };

        reader.readAsText(file);

        await new Promise((resolve) => {
            reader.onloadend = resolve;
        });


        sampleTxtArea.value = JSON.stringify(jsonGraphData, null, 2);

    }


    async function readCsv(file: File) {
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

            rawCsvRows = results.data;
            labels = Object.keys(rawCsvRows[0] || {});
            showLabelSelector = true;
            labelConstrains = [];
        };

        reader.readAsArrayBuffer(file);

        await new Promise((resolve) => {
            reader.onloadend = resolve;
        });

    }

    let dialogueOnSide = $state(false);

    async function onSave(){
        if (overwriteExistingData) {
            await clearAllData();
        }
        if (loadType === "csv") {
            await loadCsv();
        } else if (loadType === "db") {
            await loadFromDb();
        } else if (loadType === "json") {
            await addToDataStore(jsonGraphData);
        }

        showLabelSelector = false;
        location.reload(); // Reload the page to apply changes
    }

    async function clearAllData() {
        // Display a confirmation dialog to the user
        const confirmed = confirm("Are you sure you want to delete all data? This action cannot be undone.");
        if (!confirmed) {
            return; // User canceled, do nothing
        }
        await idb.enteties.clear();
        await idb.relationships.clear();
        await idb.perspectives.clear();
        await idb.diagramOptions.clear();
        await idb.conditionalFormatting.clear();
    }


    onMount(async () => {
        storeNames = await Dexie.getDatabaseNames() || [];
    });

</script>

{#if isDialogueOpen('datastoreoptions')}

<dialog open class:side-dialogue={dialogueOnSide} transition:scale>
    <article>
        <header style="position: sticky; top: -1rem; z-index: 1;">
            <div class="grid" style="grid-template-columns: 1fr auto; gap: 1rem; align-items: center;">
                <span style="font-size: larger">Datastores</span>
                
                <div role="group" >
                    <button style="margin:unset;" type="button" class="outline" onclick={() => dialogueOnSide = !dialogueOnSide} aria-label="add label" data-tooltip="Toggle dialogue to side" data-placement="bottom">
                        {#if dialogueOnSide}
                            <span class="ico ico-arrow-bar-right"></span>
                        {:else}
                            <span class="ico ico-arrow-bar-left"></span>
                        {/if}
                    </button>
                    <button style="margin:unset;" type="button" class="outline" onclick={() => closeDialogueOption('datastoreoptions')} aria-label="add label">
                        <span class="ico ico-x"></span>
                    </button>
                </div>
            </div>
        </header>
{#if !showLabelSelector}
        <article>
            <header>
                <span><strong>Loaded data</strong></span>
            </header>
            <div class="grid">
            <div>
            <small><em>Loaded Enteties:</em></small>
            <input readonly type="text" value={$loadedEnteteies?.toString()} />
        </div>
            <div>
            <small><em>Loaded Relationships:</em></small>
            <input readonly type="text" value={$loadedRelationships?.toString()} />
        </div>
    </div>
        </article>
    <article>
        <header>
            <span><strong>Add new dataset</strong></span>
        </header>
        <div class="grid">
            <div>
                <small><em>Load data from a csv or json file. The file must be in the correct format.</em></small>

                <label> 
                    <input style="margin:auto" type="file" accept=".csv, .json" onchange={onFileSelect} />
                </label>
            </div>
            <div>
                <small><em>Data that has been loaded</em></small>
            
                <textarea readonly bind:this={sampleTxtArea} >
                </textarea>
            </div>

        </div>
        <label> 
            <input type="checkbox" role="switch" bind:checked={overwriteExistingData} aria-label="Overwrite existing data" /> Overwrite existing data
        </label>
        <small><em>Overwrite existing data in the database. This will delete all existing data.</em></small>
        <hr/>

        <button type="button" onclick={async () => await onSave()} aria-label="add label">
            Save
        </button>
    </article>

{:else}
<div >
    <small><em>This section is required to select which columns are marked as labels and which to determine metadata from actual node-data.</em></small>
    {#if loadType === "csv"}
         Select identity label:
        <select bind:value={csvIdentityLabel}>
            <option value="" selected>Select identity label</option>
            {#each labels as col}
                <option value={col}>{col}</option>
            {/each}
        </select>
        <br>
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
    {/if}
    <div role="group">
        {#if loadType === "csv"}
            <button class="outline" onclick={() => selectedLabels.push('')} disabled={!canAddLabel() ? true : null}>Add Label</button>
        {/if}
        
        <button onclick={async () => await confirmColumnSelection()}>Load Data</button>
    </div>

</div>
{/if}

<article  class="danger-zone">
    <details aria-label="Danger zone" style="margin-bottom: 0;">
        <summary role="button" class="outline" style="color: red; "><b>Danger zone</b></summary>

        <div style="padding: 1rem;" >

            <button class="" style="border: 2px solid red; background-color: red; " type="button" onclick={async () => await clearAllData()} aria-label="remove label">
                Delete all data
            </button>
        </div>
    </details>

</article>

    </article>
</dialog>

{/if}


<style>
    .danger-zone {
        border: 3px solid rgb(175, 22, 22); 
        padding: 0;
    }

    .danger-zone summary {
        border-bottom: 3px solid rgb(175, 22, 22); 
    }

    .danger-zone summary:active {
        border: 3px solid rgb(175, 22, 22);
    }

    .danger-zone summary::after {

    }
</style>