<script lang="ts">
    import AppMap from "$lib/components/AppMap.svelte";
    import type { LevelNode } from "$lib/types";
    import { onMount } from "svelte";

    const { data }: {
        data: {
            nodeTree: LevelNode[]
        }
    } = $props();

    onMount(() => {
        // This is a workaround to ensure that the component is mounted before the data is passed
        // This is necessary because the data is passed as a prop and the component needs to be mounted first
        // before the data is available
        $inspect(data.nodeTree);
    });
</script>


<AppMap nodeTree={data.nodeTree} />
