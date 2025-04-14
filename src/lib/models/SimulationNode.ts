import type { SimulationLinkDatum, SimulationNodeDatum } from "d3";


export class SimulationNode implements SimulationNodeDatum {
    x: number = 0;
    y: number = 0;
    fx?: number | null | undefined; 
    fy?: number | null | undefined;
    


    constructor (
        public id: string, 
        public name: string,
        public type: string,
        public metadata: { [key: string]: string | number | boolean } = {},
    ) {}
}


export class SimulationLink implements SimulationLinkDatum<SimulationNode> {
    constructor (
        public source: SimulationNode,
        public target: SimulationNode,
        public metadata: { [key: string]: string | number | boolean } = {},
        public value: number = 1,
    ) {}
}