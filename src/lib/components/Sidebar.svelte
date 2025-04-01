
<script lang="ts">
    import type { AppSoftware, ConditionalFormatting, DisplayOptions, N1Group } from "$lib/types";
    import { onMount } from "svelte";
    import { fly } from "svelte/transition";
    import ConditionalFormatDialogue from "./ConditionalFormatDialogue.svelte";

    let { data,
        onDataFiltered: onDataFitered,
        onDisplayChanged,
        onClearData,
        onConditionalFormatDialogueOpen
     }:{
        data: N1Group[];
        onDataFiltered: (filteredData: N1Group[]) => void;
        onDisplayChanged: (displayOptions: DisplayOptions) => void;
        onClearData: () => void;
        onConditionalFormatDialogueOpen: () => void;
    } = $props();

    let isSidebarVisible = $state(true);

    export function toggleSideBar() {
        isSidebarVisible = !isSidebarVisible;
    }


    let filters = $state({
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

    let n1Options = $state([]) as string[];
    let n2Options = $state([]) as string[];
    let n3Options = $state([]) as string[];
    let appOptions = $state([]) as AppSoftware[];

    // Populate the options for the filters based on the data


    function filterGroupedData(changedFilter: string) {
        switch (changedFilter) {
            case 'n1':
                filters.n2 = '';
                filters.n3 = '';
                filters.app = '';
                break;
            case 'n2':
                filters.n3 = '';
                filters.app = '';
                break;
            case 'n3':
                filters.app = '';
                break;
        }

        const filteredData = data
            .filter(n1g => !filters.n1 || n1g.n1 === filters.n1)
            .map(n1g => ({
            ...n1g,
            groups: n1g.groups
                .filter(n2g => !filters.n2 || n2g.n2 === filters.n2)
                .map(n2g => ({
                ...n2g,
                children: n2g.children
                    .filter(n3g => !filters.n3 || n3g.n3 === filters.n3)
                    .map(n3g => ({
                        ...n3g,
                        apps: n3g.apps.filter(app => !filters.app || app.name === filters.app)
                    }))
                    .filter(n3g => n3g.apps.length > 0)
                }))
                .filter(n2g => n2g.children.length > 0)
            }))
            .filter(n1g => n1g.groups.length > 0);

        // Update the options for the filters based on the filtered data
        onDataFitered(filteredData);

        switch (changedFilter) {
            case 'n1':
                console.log('n1', filters.n1, filteredData);
                n2Options = [...new Set(filteredData.flatMap(n1g => n1g.groups.map(n2g => n2g.n2)))];
            case 'n2':
                n3Options = [...new Set(filteredData.flatMap(n1g => n1g.groups.flatMap(n2g => n2g.children.map(n3g => n3g.n3))))];
            case 'n3':
                appOptions = [...new Set(filteredData.flatMap(n1g => n1g.groups.flatMap(n2g => n2g.children.flatMap(n3g => n3g.apps))))];
            case 'app':
                break;
        }


    }

    function displayOptionsChanged(){
        onDisplayChanged(displayOptions);
    }

    function updateFiltering(){
        if(!filters.n1 && filters.n1.trim() === '' 
            && !filters.n2 && filters.n2.trim() === '' 
            && !filters.n3 && filters.n3.trim() === ''
            && !filters.app && filters.app.trim() === '') {

                $inspect('no filters', filters);
                n1Options = [...new Set(data.map(n1g => n1g.n1))];
                n2Options = [...new Set(data.flatMap(n1g => n1g.groups.map(n2g => n2g.n2)))];
                n3Options = [...new Set(data.flatMap(n1g => n1g.groups.flatMap(n2g => n2g.children.map(n3g => n3g.n3))))];
                appOptions = [...new Set(data.flatMap(n1g => n1g.groups.flatMap(n2g => n2g.children.flatMap(n3g => n3g.apps))))];
                return;
        }

        if (filters.n1 && filters.n1.trim() !== '') {
            n2Options = [...new Set(data.filter(n1g => n1g.n1 === filters.n1).flatMap(n1g => n1g.groups.map(n2g => n2g.n2)))];
        } else {
            n2Options = [...new Set(data.flatMap(n1g => n1g.groups.map(n2g => n2g.n2)))];
        }
        if (filters.n2 && filters.n2.trim() !== '') {
            n3Options = [...new Set(data.filter(n1g => n1g.n1 === filters.n1).flatMap(n1g => n1g.groups.filter(n2g => n2g.n2 === filters.n2).flatMap(n2g => n2g.children.map(n3g => n3g.n3))) )];
        } else {
            n3Options = [...new Set(data.flatMap(n1g => n1g.groups.flatMap(n2g => n2g.children.map(n3g => n3g.n3))))];
        }
        if (filters.n3 && filters.n3.trim() !== '') {
            appOptions = [...new Set(data.filter(n1g => n1g.n1 === filters.n1).flatMap(n1g => n1g.groups.filter(n2g => n2g.n2 === filters.n2).flatMap(n2g => n2g.children.filter(n3g => n3g.n3 === filters.n3).flatMap(n3g => n3g.apps))) )];
        } else {
            appOptions = [...new Set(data.flatMap(n1g => n1g.groups.flatMap(n2g => n2g.children.flatMap(n3g => n3g.apps))))];
        }
    }


    $effect(() => {
        // Update the options for the filters based on the data

        if(isSidebarVisible)
        {
            updateFiltering();
        }

    });

    onMount(() => {
        // Initialize the options for the filters based on the data
        n1Options = [...new Set(data.map(n1g => n1g.n1))];
        n2Options = [...new Set(data.flatMap(n1g => n1g.groups.map(n2g => n2g.n2)))];
        n3Options = [...new Set(data.flatMap(n1g => n1g.groups.flatMap(n2g => n2g.children.map(n3g => n3g.n3))))];
        appOptions = [...new Set(data.flatMap(n1g => n1g.groups.flatMap(n2g => n2g.children.flatMap(n3g => n3g.apps))))];
    });


</script>



<div class="sidebar-container {isSidebarVisible ? 'sidebar-open' : ''}">
    <button onclick={toggleSideBar} aria-label="Show sidebar" data-tooltip="Show Filtering" data-placement="right">
        <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-filter"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227z" /></svg>
    </button>

{#if isSidebarVisible}
    <div class="sidebar" in:fly={{ x: -100 }} out:fly={{ x: -100 }}>
        <h2>Filtering</h2>
        <aside>
        <nav>
            <details name="filter-clmns" >
                <summary role="button" class="outline">Filter columns</summary>
                <ul>

                    <li>
                        <label>
                            N1:
                            <select bind:value={filters.n1} onchange={() => filterGroupedData('n1')}>
                                <option value="">All</option>
                                {#each n1Options as n1}
                                    <option value={n1}>{n1}</option>
                                {/each}
                            </select>
                        </label>
                    </li>
                    <li>
                        <label>
                            N2:
                            <select bind:value={filters.n2} onchange={() => filterGroupedData('n2')}>
                                <option value="">All</option>
                                {#each n2Options as n2}
                                    <option value={n2}>{n2}</option>
                                {/each}
                            </select>
                        </label>
                    </li>
                    <li>
                        <label>
                            N3:
                            <select bind:value={filters.n3} onchange={() => filterGroupedData('n3')}>
                                <option value="">All</option>
                                {#each n3Options as n3}
                                    <option value={n3}>{n3}</option>
                                {/each}
                            </select>
                        </label>
                    </li>
                    <li>
                        <label>
                            App:
                            <select bind:value={filters.app} onchange={() => filterGroupedData('app')}>
                                <option value="">All</option>
                                {#each appOptions as app}
                                    <option value={app.name}>{app.name}</option>
                                {/each}
                            </select>
                        </label>
                    </li>
                </ul>
            </details>
            <hr />
            <details name="display-opts" >
                <summary role="button" class="outline">Display options</summary>
                <ul>
                    <li>
                        <label>
                            <input type="checkbox" role="switch" bind:checked={displayOptions.showN1} onchange={displayOptionsChanged} /> Show N1
                        </label>
                    </li>
                    <li>
                        <label>
                            <input type="checkbox" role="switch" bind:checked={displayOptions.showN2} onchange={displayOptionsChanged}  /> Show N2
                        </label>
                    </li>
                    <li>
                        <label>
                            <input type="checkbox" role="switch" bind:checked={displayOptions.showN3} onchange={displayOptionsChanged}  /> Show N3
                        </label>
                    </li>
                    <li>
                        <label>
                            <input type="checkbox" role="switch" bind:checked={displayOptions.showApps} onchange={displayOptionsChanged}  /> Show App
                        </label>
                    </li>
                </ul>
            </details>

        </nav>
        </aside>
        <hr />

        <div role="group">
            <button aria-label="edit-conditional-format" onclick={onConditionalFormatDialogueOpen} >
                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-subscript"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 7l8 10m-8 0l8 -10" /><path d="M21 20h-4l3.5 -4a1.73 1.73 0 0 0 -3.5 -2" /></svg>
            </button>
        </div>

        <div role="group">
            <button onclick={toggleSideBar} >Close</button>
            <button onclick={onClearData} class="outline" aria-label="Clear data" data-tooltip="Clear data" data-placement="bottom">
                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-trash-x"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7h16" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /><path d="M10 12l4 4m0 -4l-4 4" /></svg>
            </button>

        </div>

    </div>
{/if}
</div>



<style>
    .sidebar-container {
        position: fixed;
        top: 0;
        left: 0;
        height: 100%;
    }

    .sidebar-container>button {
        top: 2rem;
        border-top-left-radius: 0%;
        border-bottom-left-radius: 0%;
        border-top-right-radius: 50%;
        border-bottom-right-radius: 50%;
    }

    .sidebar-container.sidebar-open>button {
        position: absolute;
        left: 400px;
    }

    .sidebar {
        width: 400px;
        height: 100%;
        background-color: #f4f4f4;
        padding: 20px;
        box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
        z-index: 1000;
    }

</style>