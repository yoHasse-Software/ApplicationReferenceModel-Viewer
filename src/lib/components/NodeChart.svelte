


<script lang="ts">
    import { SimulationLink, SimulationNode } from "$lib/models/SimulationNode";
    import * as d3 from 'd3';
    import { onMount } from "svelte";
    import { db } from "./db/dexie";

    let group: SVGGElement;

    async function createSimulationNodes(){
        const data = (await db.enteties.toArray()).map(d => ({...d}));
        const relationships = (await db.relationships.toArray()).map(d => ({...d}));

        console.log(relationships);

        // Specify the color scale.
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        // The force simulation mutates links and nodes, so create a copy
        // so that re-evaluating this cell produces the same result.

        const links = relationships.map(d => {

            const from = data.find(node => node.id === d.from);
            const to = data.find(node => node.id === d.to);
            if (!from || !to) {
                throw new Error(`Node not found for id: ${d.from} or ${d.to}`);
            }

            const fromNode = new SimulationNode(from.id, from.name, from.label, from.metadata);
            const toNode = new SimulationNode(to.id, to.name, to.label, to.metadata);

            return new SimulationLink(fromNode, toNode)

        });
        const nodes = data.map(d => new SimulationNode(d.id, d.name, d.label, d.metadata));


        console.log(links);


        // Create a simulation with several forces.
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id((d) => (d as SimulationNode).id))
            .force("charge", d3.forceManyBody())
            .force("x", d3.forceX())
            .force("y", d3.forceY());

        // Create the SVG container.

        // Add a line for each link, and a circle for each node.
        const link = d3.select(group).append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", d => Math.sqrt(d.value));

        const node = d3.select(group).append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", 5)
            .attr("fill", d => color(d.type));

        node.append("title")
            .text(d => d.name);

        // Add a drag behavior.
        (node as d3.Selection<SVGCircleElement, SimulationNode, SVGGElement, unknown>)
            .call(d3.drag<SVGCircleElement, SimulationNode>()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));
        
        // Set the position attributes of links and nodes each time the simulation ticks.
        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
        });

        // Reheat the simulation when drag starts, and fix the subject position.
        function dragstarted(event: d3.D3DragEvent<SVGCircleElement, SimulationNode, SimulationNode>) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        // Update the subject (dragged node) position during drag.
        function dragged(event: d3.D3DragEvent<SVGCircleElement, SimulationNode, SimulationNode>) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        // Restore the target alpha so the simulation cools after dragging ends.
        // Unfix the subject position now that it’s no longer being dragged.
        function dragended(event: d3.D3DragEvent<SVGCircleElement, SimulationNode, SimulationNode>) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        // When this cell is re-run, stop the previous simulation. (This doesn’t
        // really matter since the target alpha is zero and the simulation will
        // stop naturally, but it’s a good practice.)
        // invalidation.then(() => simulation.stop());

    }


      // Specify the dimensions of the chart.
    onMount(async () => {
        await createSimulationNodes();
    });


</script>


<g bind:this={group}>
</g>



