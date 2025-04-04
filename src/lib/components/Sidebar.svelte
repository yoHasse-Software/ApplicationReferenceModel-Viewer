
<script lang="ts">
    import { Data, setFilteredData, setData, resetData, DisplayOpsStore, DisplayOps } from "$lib/datastore.svelte";
    import { type DisplayOptions, type LevelNode } from "$lib/types";
    import { onMount } from "svelte";
    import { fly } from "svelte/transition";

    let { 
        onConditionalFormatDialogueOpen
     }:{
        onConditionalFormatDialogueOpen: () => void;
    } = $props();

    let isSidebarVisible = $state(true);

    export function toggleSideBar() {
        isSidebarVisible = !isSidebarVisible;
    }

    type Filter = {
        n1: string;
        n2: string;
        n3: string;
        app: string;
    };

    let filters = $state({
        n1: '',
        n2: '',
        n3: '',
        app: ''
    });

    let displayOps = $state<DisplayOptions>({
        displayEmpty: true,
        showN1: true,
        showN2: true,
        showN3: true,
        showApps: true
    });

    let n1Options = $state([]) as string[];
    let n2Options = $state([]) as string[];
    let n3Options = $state([]) as string[];
    let appOptions = $state([]) as LevelNode[];

    // Populate the options for the filters based on the data
    function filterChildrenRecursively(node: LevelNode): LevelNode | undefined {
        // ✅ If it's a leaf (not a group), keep it
        if (!node.isGroup) return node;

        // ✅ If it's a group but has no children → discard it
        if (!node.children || node.children.length === 0) return undefined;

        // ✅ Recursively filter children
        const filteredChildren = node.children
            .map(filterChildrenRecursively)
            .filter((n): n is LevelNode => !!n); // filter out nulls

        // ❌ If none of the children survive, discard this node too
        if (filteredChildren.length === 0) return undefined;

        // ✅ Keep the node, with pruned children
        return {
            ...node,
            children: filteredChildren
        };
    }


    function filterTree(rootNode: LevelNode, filters: Filter, depth = 1): LevelNode | null {
        const nameMatches =
            (depth === 1 && filters.n1 === rootNode.name) ||
            (depth === 2 && filters.n2 === rootNode.name) ||
            (depth === 3 && filters.n3 === rootNode.name) ||
            (depth === 4 && filters.app === rootNode.name);

        // Recurse into children conditionally:
        let filteredChildren: LevelNode[] | undefined;

        if (rootNode.children) {
            // ✅ Only filter children if there's a deeper filter
            const deeperFiltersExist =
                (depth === 1 && (filters.n2 || filters.n3 || filters.app)) ||
                (depth === 2 && (filters.n3 || filters.app)) ||
                (depth === 3 && filters.app);

            if (deeperFiltersExist || !nameMatches) {
                filteredChildren = rootNode.children
                    .map(child => filterTree(child, filters, depth + 1))
                    .filter((c): c is LevelNode => !!c);
            } else if (nameMatches) {
                // ✅ Node matched and no deeper filters → keep all children
                filteredChildren = rootNode.children;
            }
        }

        const hasVisibleChildren = filteredChildren && filteredChildren.length > 0;

        if (nameMatches || hasVisibleChildren) {
            return {
                ...rootNode,
                children: hasVisibleChildren ? filteredChildren : undefined
            };
        }

        return null;
    }

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

        if(noFiltersApplied()) {
            if(!displayOps.displayEmpty){
                console.log('displayEmpty', Data.length);
                setFilteredData(Data.map(n1g => filterChildrenRecursively(n1g)).filter((n): n is LevelNode => !!n));
                return;
            }
            setFilteredData(Data);
            return;
        }



        const isAnyFilterSet = filters.n1 || filters.n2 || filters.n3 || filters.app;

        const filteredData: LevelNode[] = isAnyFilterSet
            ? Data.map(n1g => filterTree(n1g, filters))
                .filter((n): n is LevelNode => !!n)
            : Data;




        // Update the options for the filters based on the filtered data
        console.log('filteredData', filteredData);
        setFilteredData(filteredData);

        switch (changedFilter) {
            case 'n1':
                console.log('n1', filters.n1, filteredData);
                n2Options = [...new Set(filteredData.flatMap(n1g => n1g.children?.map(n2g => n2g.name) ?? []))];
            case 'n2':
                n3Options = [...new Set(filteredData.flatMap(n1g => n1g.children?.flatMap(n2g => n2g.children?.map(n3g => n3g.name).filter((name): name is string => name !== undefined) ?? []) ?? []))];
            case 'n3':
                appOptions = [...new Set(filteredData.flatMap(n1g => n1g.children?.flatMap(n2g => n2g.children?.flatMap(n3g => n3g.children) ?? []) ?? []) ?? [])]
                    .filter((app) => !app?.isGroup)
                    .filter(app => app !== undefined);
            case 'app':
                break;
        }


    }

    function DisplayOpsChanged(){
        console.log('DisplayOpsChanged', displayOps);
        console.log('DisplayOps', DisplayOps);
        if(DisplayOps.displayEmpty !== displayOps.displayEmpty) {
            filterGroupedData('n1');
        }
        
        DisplayOpsStore.set(displayOps);

    }



    function onClearData(){
        resetData();
        location.reload();
    }

    function noFiltersApplied() {
        return !filters.n1 && filters.n1.trim() === ''
            && !filters.n2 && filters.n2.trim() === ''
            && !filters.n3 && filters.n3.trim() === ''
            && !filters.app && filters.app.trim() === '';
    }

    function resetOptions(){
        n1Options = [...new Set(Data.map(n1g => n1g.name))];
        n2Options = [...new Set(Data.flatMap(n1g => n1g.children?.map(n2g => n2g.name) ?? []))];
        n3Options = [...new Set(Data.flatMap(n1g => n1g.children?.flatMap(n2g => n2g.children?.map(n3g => n3g.name).filter((name): name is string => name !== undefined) ?? []) ?? []))];
        appOptions = [...new Set(Data.flatMap(n1g => n1g.children?.flatMap(n2g => n2g.children?.flatMap(n3g => n3g.children) ?? []) ?? []) ?? [])]
            .filter(app => app !== undefined);

    }


    function updateFiltering(){
        if(noFiltersApplied()) {
            resetOptions();
            return;
        }

        if (filters.n1 && filters.n1.trim() !== '') {
            n2Options = [...new Set(Data.filter(n1g => n1g.name === filters.n1).flatMap(n1g => n1g.children?.map(n2g => n2g.name) ?? []))];
        } else {
            n2Options = [...new Set(Data.flatMap(n1g => n1g.children?.map(n2g => n2g.name).filter((name): name is string => name !== undefined)))] as string[];
        }
        if (filters.n2 && filters.n2.trim() !== '') {
            n3Options = [...new Set(Data.filter(n1g => n1g.name === filters.n1).flatMap(n1g => n1g.children?.filter(n2g => n2g.name === filters.n2).flatMap(n2g => n2g.children?.map(n3g => n3g.name))) )] as string[];
        } else {
            n3Options = [...new Set(Data.flatMap(n1g => n1g.children?.flatMap(n2g => n2g.children?.map(n3g => n3g.name))))] as string[];
        }
        if (filters.n3 && filters.n3.trim() !== '') {
            appOptions = [...new Set(Data.filter(n1g => n1g.name === filters.n1).flatMap(n1g => n1g.children?.filter(n2g => n2g.name === filters.n2).flatMap(n2g => n2g.children?.filter(n3g => n3g.name === filters.n3).flatMap(n3g => n3g.children))) )].filter(app => app !== undefined);
        } else {
            appOptions = [...new Set(Data.flatMap(n1g => n1g.children?.flatMap(n2g => n2g.children?.flatMap(n3g => n3g.children))))].filter(app => app !== undefined);
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
        updateFiltering();
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
                            <input type="checkbox" role="switch" 
                                bind:checked={displayOps.displayEmpty} onchange={DisplayOpsChanged}  /> Display Empty levels

                        </label>
                        <small >
                            <em>If true, include models that doesn't have an application assigned.</em>
                        </small>
                    </li>
                    <li>
                        <label>
                            <input type="checkbox" role="switch" bind:checked={displayOps.showN1} onchange={DisplayOpsChanged} /> Show N1
                        </label>
                    </li>
                    <li>
                        <label>
                            <input type="checkbox" role="switch" bind:checked={displayOps.showN2} onchange={DisplayOpsChanged}  /> Show N2
                        </label>
                    </li>
                    <li>
                        <label>
                            <input type="checkbox" role="switch" bind:checked={displayOps.showN3} onchange={DisplayOpsChanged}  /> Show N3
                        </label>
                    </li>
                    <li>
                        <label>
                            <input type="checkbox" role="switch" bind:checked={displayOps.showApps} onchange={DisplayOpsChanged}  /> Show App
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