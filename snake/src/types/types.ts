import Two from "two.js";
import { Group } from "two.js/src/group";

export interface GameUI {
    scene: Two,
    background: Group,
    board: Group,
    boardRows: number,
    boardCols: number,
}

export interface GameState {
    snake: Snake,
    lastMoveFrame: number,
    framesPerMove: number,
    activeState: PlayState,
    food: GameCoord,
}

export enum PlayState {
    Playing,
    Paused,
    GameOver,
    Init,
}

export interface Snake {
    head: GameCoord,
    body: GameCoord[],
    facing: GameDirection,
}

export interface GameCoord {
    row: number,
    col: number,
}

export enum GameDirection {
    Up,
    Down,
    Left,
    Right,
}