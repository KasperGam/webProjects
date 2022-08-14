import { Shape } from "two.js/src/shape";
import { Circle } from "two.js/src/shapes/circle";
import { Vector } from "two.js/src/vector";

export interface SimState {
    mouse: SimPoint,
    showMouse: boolean,
    showText: boolean,
    hadLastUpdate: boolean,
    nodeColor: "red" | "green" | "blue" | "black",
    autoscale: boolean,
}

export interface SimPoint {
    x: number,
    y: number,
}

export class PhysicsCircle extends Circle {
    velocity: Vector;
    anchor: Vector;
    mass: number;
    useAcceleration: boolean;

    constructor(x: number, y: number, radius: number, mass: number, resolution?:number) {
        super(x, y, radius, resolution);
        this.velocity = new Vector(0, 0);
        this.anchor = new Vector(0, 0);
        this.useAcceleration = false;
        this.mass = mass;
    }
}