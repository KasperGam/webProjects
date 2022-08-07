
export interface SimState {
    nodes: SimNode[],
    mouse: SimPoint
}

export interface SimNode {
    anchor: SimPoint,
    position: SimPoint,
    velocity: SimPoint,
    acceleration: SimPoint,
    mass: number,
    useAcceleration: boolean,
}

export interface SimPoint {
    x: number,
    y: number,
}