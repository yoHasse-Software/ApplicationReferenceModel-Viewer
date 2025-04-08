

<script lang="ts">
    import { APPWIDTH, LABEL_HEIGHT, N2WIDTH, N3WIDTH } from "$lib/datastore.svelte";
    import { onMount } from "svelte";
    import AppMap from "./AppMap.svelte";



    let { 
        node,
        displayLevel, 
        level,
        title,
        gridChildren = false,
        addHeader = true,
        styling = '',
        nodeChildCount = 0,
        isLeaf = false,
        children } = $props();


    const colors = ['#dfe6e9', '#b2bec3', '#636e72', '#00b894', '#0984e3', '#d63031', '#fdcb6e', '#00b894', '#6c5ce7'];
    const color = colors[node?.value || 0] || colors[0];


    const getRectWidth = () => {
        switch(node.value){
            case 0:
                return N2WIDTH * 5;
            case 1:
                return N2WIDTH;
            case 2:
                return N3WIDTH;
            case 3:
                return APPWIDTH;
        }
    };

    function getClassName() {
        switch(level) {
            case 1:
                return 'n1-box';
            case 2:
                return 'n2-box';
            case 3:
                return 'n3-box';
            case 4:
                return 'app';
            default:
                return '';
        }
    }


    function getTemplateColumns() {
        switch(level) {
            case 1:
                return `repeat(auto-fit, minmax(${N2WIDTH*0.8}px, 1fr))`;
            case 2:
                return `repeat(auto-fit, minmax(${N3WIDTH*0.8}px, 1fr))`;
            case 3:
                return `repeat(auto-fit, minmax(${APPWIDTH*0.8}px, 1fr))`;
            case 4:
                return `repeat(auto-fit, minmax(${APPWIDTH*0.8}px, 1fr))`;
            default:
                return '';
        }
    }

    onMount(() => {
    });
</script>

<g>
    <rect
        data-depth={node?.value}
        width={getRectWidth()}
        height={LABEL_HEIGHT}
        stroke-width="1"
        rx="4"
    />
  <text>
    {node?.value ?? "NOT DEFINED"}
    </text>

  {@render children?.()}
</g>






<style>




</style>










