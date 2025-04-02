import { SvelteMap } from "svelte/reactivity";

export let DimensionMap = new SvelteMap<string, {height: number, width: number}>();
export let PositionMap = new SvelteMap<string, {top: number, left: number}>();

export function setDimensionMap(newMap: SvelteMap<string, {height: number, width: number}>) {
    DimensionMap = newMap;
}

