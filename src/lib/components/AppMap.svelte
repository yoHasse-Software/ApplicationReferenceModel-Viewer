<script lang="ts">
    import { onMount } from 'svelte';
    import * as XLSX from 'xlsx';
    import Sidebar from './Sidebar.svelte';
    import { type AppSoftware, type ConditionalFormatting, type ConditionalFormattingRuleType, type DisplayOptions, type N1Group } from '$lib/types';
    import NLevelView from './NLevelView.svelte';
    import ConditionalFormatDialogue from './ConditionalFormatDialogue.svelte';

  
 
    // Example grouped data based on your CSV
    let data: N1Group[] = $state([]);
    let filteredData: N1Group[] = $state([]);
    let isConditionalFormatingDialogueOpen = $state(false);

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
        showApps: true
    });


    function getConditionalRules(app: AppSoftware): ConditionalFormatting[] {
      const rules = conditionalFormatDialogue.getConditionalFormattingRulese();
      const condRules = rules
        .filter(r => app.metadata[r.column] !== undefined && r.value === app.metadata[r.column])
        .filter(r => {
          if (r.column === 'default') {
            return true; // Default rule applies to all apps
          }
          switch(r.type) {
            case 'equals':
              return app.metadata[r.column] === r.value;
            case 'contains':
              return app.metadata[r.column].toString().includes(r.value);
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


    function groupData(csvRows: Array<Record<string, string>>, n1Key: string, n2Key: string, n3Key: string, appKey: string): N1Group[] {
        const grouped: N1Group[] = [];
        for (const row of csvRows) {
            const n1 = row[n1Key];
            const n2 = row[n2Key];
            const n3 = row[n3Key];
            const app = row[appKey] ? {
                name: row[appKey],
                metadata: {} as Record<string, string>
            } : undefined;

            // Get additional columns and add them to the app object
            const metadata = row 
                ? Object.keys(row).reduce((acc, key) => {
                    if (![n1Key, n2Key, n3Key, appKey].includes(key)) {
                        acc[key] = row[key];
                    }
                    return acc;
                }, {} as Record<string, string>)
                : {};


            let n1Group = grouped.find(g => g.n1 === n1);
            if (!n1Group) {
              n1Group = { n1, groups: [] };
              grouped.push(n1Group);
            }

            let n2Group = n1Group.groups.find(g => g.n2 === n2);
            if (!n2Group) {
              n2Group = { n2, children: [] };
              n1Group.groups.push(n2Group);
            }

            let n3Group = n2Group.children.find(g => g.n3 === n3);
            if (!n3Group) {
              n3Group = { n3, apps: [] };
              n2Group.children.push(n3Group);
            }

            if (app) {
              for (const key in metadata) {
                if (metadata.hasOwnProperty(key)) {
                    app.metadata[key] = metadata[key];
                }
              }
              n3Group.apps.push(app);
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

    function onDataFiltered(data: N1Group[]) {
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
  
    {#each filteredData as n1Block}
    <NLevelView level={1} title={n1Block.n1} displayLevel={displayOptions.showN1}>
        {#each n1Block.groups as n2Block}
          <NLevelView level={2} title={n2Block.n2} displayLevel={displayOptions.showN2} gridChildren={true}>
            {#each n2Block.children as n3Block}
              <NLevelView level={3} title={n3Block.n3} displayLevel={displayOptions.showN3} gridChildren={true}>
                  {#each n3Block.apps as app}
                    <NLevelView level={4} title={app} displayLevel={displayOptions.showApps} addHeader={false}>
                          <span>{app.name}</span>
                          <div>
                          {#each getConditionalRules(app) as rule}
                            <span class="formats" data-tooltip={`${rule.name} - ${rule.column}`} >{rule.emoji}</span>
                          {/each}
                        </div>
                    </NLevelView>
                  {/each}
              </NLevelView>
            {/each}
          </NLevelView>
        {/each}
    </NLevelView>

    {/each}
