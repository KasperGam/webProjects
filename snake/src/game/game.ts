import Two from "two.js";
import { Group } from "two.js/src/group";
import { Rectangle } from "two.js/src/shapes/rectangle";
import { GameCoord, GameDirection, GameState, GameUI, PlayState, Snake } from "../types/types";
import { LAYOUT, LAYOUT_IDS } from "./constants";

let UI: GameUI;
let STATE: GameState;

export const setupGame = (two: Two) => {
    const numRows = 20;
    const numCols = 20;

    if(!UI) {
        const backgroundGroup = newBackground(two);
        const boardGroup = newBoard(two, backgroundGroup, numCols, numRows);
        UI = {
            scene: two,
            background: backgroundGroup,
            board: boardGroup,
            boardRows: numRows,
            boardCols: numCols,
        }
    }

    STATE = newGameState(numRows, numCols);
    drawGame(UI, STATE);

    two.update();

    const scoreLabel = document.getElementById(LAYOUT_IDS.SCORE_LABEL);
    const newGameButton = document.getElementById(LAYOUT_IDS.NEW_GAME_BUTTON);
    newGameButton.onclick = () => {
        if (STATE.activeState === PlayState.Playing) {
            two.pause();
            newGameButton.innerHTML = "Resume";
            STATE.activeState = PlayState.Paused;
        } else if (STATE.activeState === PlayState.Paused) {
            two.play();
            newGameButton.innerHTML = "Pause";
            STATE.activeState = PlayState.Playing;
        } else {
            console.log("new game started!");
            scoreLabel.innerHTML = "Score: 0";
            newGameButton.innerHTML = "Pause";
            // reset game state
            STATE = newGameState(numRows, numCols);
            drawGame(UI, STATE);
            two.update();
            two.play();
            STATE.activeState = PlayState.Playing;
        }
    }

    window.onresize = () => {
        resizeUI(UI, STATE, window.innerWidth, window.innerHeight);
    }

    document.addEventListener(`keydown`, (event: KeyboardEvent) => {
        const keyCode = event.code;
        let newDirection = null;
        switch (keyCode) {
        case 'ArrowUp':
            newDirection = GameDirection.Up;
            break;
        case 'ArrowLeft':
            newDirection = GameDirection.Left;
            break;
        case 'ArrowDown':
            newDirection = GameDirection.Down;
            break;
        case 'ArrowRight':
            newDirection = GameDirection.Right;
            break;
        }

        if (newDirection !== null) {
            event.preventDefault();
            setGameDirection(STATE, newDirection);
        }
    });

    two.bind('update', uiUpdate);
}

const newGameState = (rows: number, cols: number) => {
    const startRow = Math.floor(rows / 2);
    const startCol = Math.floor(cols / 2);

    const startSnake: Snake = {
        head: {
            row: startRow,
            col: startCol,
        },
        body: [],
        facing: GameDirection.Right
    };

    return {
        snake: startSnake,
        lastMoveFrame: 0,
        framesPerMove: 6,
        activeState: PlayState.Init,
        food: newFoodLocation(startSnake, rows, cols),
    } as GameState;
}

const uiUpdate = (frameCount: number) => {
    const framesSinceMove = frameCount - STATE.lastMoveFrame;
    if (framesSinceMove > STATE.framesPerMove) {
        updateSnake(STATE, UI);
        STATE.lastMoveFrame = frameCount;
    }
}

const newFoodLocation = (snake: Snake, rows: number, cols: number) => {
    // All avaliable positions is all minus snake positions
    const position = Math.floor(Math.random() * (rows * cols - 1 - snake.body.length));

    let index = 0;
    for(let row = 0; row < rows; row++) {
        for(let col = 0; col < cols; col++) {
            if(!isSnake(row, col, snake)) {
                if (index === position) {
                    return {
                        row: row,
                        col: col,
                    }
                } else {
                    index++;
                }
            }
        }
    }
    return null;
}

const updateSnake = (state: GameState, ui: GameUI) => {
    const snake = state.snake;
    const headPos = snake.head;

    const newHeadPos = nextPosition(headPos, snake.facing, ui.boardRows, ui.boardCols);
    if (!newHeadPos || isSnake(newHeadPos.row, newHeadPos.col, snake)) {
        state.activeState = PlayState.GameOver;
        const newGameButton = document.getElementById(LAYOUT_IDS.NEW_GAME_BUTTON);
        newGameButton.innerHTML = "New Game";
        ui.scene.pause();
        return;
    }

    snake.head = {
        row: newHeadPos.row,
        col: newHeadPos.col,
    }
    drawSnakeSection(ui, newHeadPos);
    drawBackgroundSection(ui, headPos);

    const food = state.food;
    if (food.row === newHeadPos.row && food.col === newHeadPos.col) {
        // Add new body segment and new food
        snake.body.unshift(headPos);
        drawSnakeSection(ui, headPos);
        const newFood = newFoodLocation(snake, ui.boardRows, ui.boardCols);
        state.food = newFood;
        state.snake = snake;
        drawFood(ui, newFood);
        const scoreLabel = document.getElementById(LAYOUT_IDS.SCORE_LABEL);
        scoreLabel.innerHTML = `Score: ${snake.body.length}`;
    } else {
        // Move last body segment to prev head location
        if (snake.body.length > 0) {
            const lastSegment = snake.body.pop();
            drawBackgroundSection(ui, lastSegment);
            lastSegment.row = headPos.row;
            lastSegment.col = headPos.col;
            // Insert at front
            snake.body.unshift(lastSegment);
            drawSnakeSection(ui, lastSegment);
        }
    }
}

const setGameDirection = (state: GameState, direction: GameDirection) => {
    // Don't allow opposite direction change when we have length, have to turn around
    if(state.snake.body.length > 0 && isOppositeDirection(state.snake.facing, direction)) {
        return;
    }
    state.snake.facing = direction;
}

// UTIL

const isOppositeDirection = (dir1: GameDirection, dir2: GameDirection) => {
    return dir1 === GameDirection.Down && dir2 === GameDirection.Up
        || dir1 === GameDirection.Up && dir2 === GameDirection.Down
        || dir1 === GameDirection.Left && dir2 === GameDirection.Right
        || dir1 === GameDirection.Right && dir2 === GameDirection.Left;
}

const drawBackgroundSection = (ui: GameUI, coord: GameCoord) => {
    const tile = getTile(ui.board, coord.row, coord.col);
    tile.fill = "#DDD";
}

const drawSnakeSection = (ui: GameUI, coord: GameCoord) => {
    const tile = getTile(ui.board, coord.row, coord.col);
    tile.fill = "#222";
}

const drawFood = (ui: GameUI, coord: GameCoord) => {
    const tile = getTile(ui.board, coord.row, coord.col);

    const foodRect = ui.board.getById(LAYOUT_IDS.FOOD) as Rectangle;
    foodRect.visible = true;
    foodRect.position.set(tile.position.x, tile.position.y);
}

const nextPosition = (pos: GameCoord, direction: GameDirection, maxRows: number, maxCols: number) => {
    const row = pos.row;
    const col = pos.col;

    const nextRow = 
        direction === GameDirection.Up 
        ? row - 1 
        : direction === GameDirection.Down 
        ? row + 1 
        : row;

    const nextCol = 
        direction === GameDirection.Left 
        ? col - 1 
        : direction === GameDirection.Right 
        ? col + 1 
        : col;

    if (nextRow < 0 || nextRow >= maxRows || nextCol < 0 || nextCol >= maxCols) {
        return null;
    }

    return {
        row: nextRow,
        col: nextCol
    } as GameCoord;
}

const drawGame = (ui: GameUI, state: GameState) => {
    const tileGroup = ui.board;
    for(let row = 0; row < ui.boardRows; row++) {
        for (let col = 0; col < ui.boardCols; col++) {
            const tile = getTile(tileGroup, row, col);
            if (isSnake(row, col, state.snake)) {
                tile.fill = '#222';
            } else {
                tile.fill = '#DDD';
            }
        }
    }

    const foodRect = tileGroup.getById(LAYOUT_IDS.FOOD) as Rectangle;
    foodRect.visible = true;
    const foodTile = getTile(tileGroup, state.food.row, state.food.col);
    foodRect.position.set(foodTile.position.x, foodTile.position.y);
}

const isSnake = (row: number, col: number, snake: Snake) => {
    if (snake.head.row === row && snake.head.col === col) {
        return true;
    }

    const isSegment = snake.body.findIndex((section) => {
        return section.col === col && section.row === row;
    })

    return isSegment >= 0;
}

const getTile = (tileGroup: Group, row: number, col: number) => {
    return tileGroup.getById(`${row}_${col}`) as Rectangle;
}

const newBackground = (two: Two) => {
    const size = Math.min(two.width - LAYOUT.BACKGROUND.MARGIN * 2, two.height - LAYOUT.TOP_CONTROLS.HEIGHT - LAYOUT.BACKGROUND.MARGIN * 2)
    const background = new Rectangle(0, 0, size, size);
    background.id = LAYOUT_IDS.BACKGROUND_RECT;
    background.fill = '#AAA';
    const group = new Group(background);
    group.position.set(two.width / 2, background.height / 2 + LAYOUT.BACKGROUND.MARGIN);

    two.add(group);
    return group;
};

const newBoard = (two: Two, backgroundGroup: Group, cols: number, rows: number) => {
    const boardGroup = new Group();

    const background = backgroundGroup.getById(LAYOUT_IDS.BACKGROUND_RECT) as Rectangle;
    const margin = LAYOUT.BOARD.TILE_MARGIN;

    const totalWidth = background.width - margin * 2;
    const totalHeight = background.height - margin * 2;

    const tileWidth = totalWidth / cols - margin * 2;
    const tileHeight = totalHeight / rows - margin * 2;

    for(let row = 0; row < rows; row++) {
        for(let col = 0; col < cols; col++) {
            const x = (totalWidth / cols) * col;
            const y = (totalHeight / rows) * row;
            const tile = new Rectangle(x + margin, y + margin, tileWidth, tileHeight);
            tile.id = `${row}_${col}`;
            tile.stroke = "#DDD";
            tile.fill = "#DDD";
            boardGroup.add(tile);
        }
    }

    const foodRect = new Rectangle(0, 0, tileWidth / 4, tileHeight / 4);
    foodRect.visible = false;
    foodRect.stroke = "#E33";
    foodRect.fill = "#E33";
    foodRect.id = LAYOUT_IDS.FOOD;
    boardGroup.add(foodRect);

    boardGroup.position.set(-(background.width / 2 - tileWidth / 2) + margin, -(background.height / 2 - tileHeight / 2) + margin);
    backgroundGroup.add(boardGroup);
    return boardGroup;
}

const resizeUI = (ui: GameUI, state: GameState, width: number, height: number) => {
    const two = ui.scene;
    two.renderer.setSize(width, height - LAYOUT.TOP_CONTROLS.HEIGHT - LAYOUT.BACKGROUND.MARGIN);
    two.width = width;
    two.height = height;

    const background = ui.background.getById(LAYOUT_IDS.BACKGROUND_RECT) as Rectangle;
    const size = Math.min(two.width - LAYOUT.BACKGROUND.MARGIN * 2, two.height - LAYOUT.TOP_CONTROLS.HEIGHT - LAYOUT.BACKGROUND.MARGIN * 2)

    background.width = size;
    background.height = size;

    ui.background.position.set(two.width / 2, background.height / 2 + LAYOUT.BACKGROUND.MARGIN);

    const margin = LAYOUT.BOARD.TILE_MARGIN;

    const cols = ui.boardCols;
    const rows = ui.boardRows;

    const totalWidth = background.width - margin * 2;
    const totalHeight = background.height - margin * 2;

    const tileWidth = totalWidth / cols - margin * 2;
    const tileHeight = totalHeight / rows - margin * 2;

    for(let row = 0; row < rows; row++) {
        for(let col = 0; col < cols; col++) {
            const x = (totalWidth / cols) * col;
            const y = (totalHeight / rows) * row;
            const tile = getTile(ui.board, row, col);
            tile.position.set(x + margin, y + margin);
            tile.width = tileWidth;
            tile.height = tileHeight;
        }
    }

    const foodRect = ui.board.getById(LAYOUT_IDS.FOOD) as Rectangle;
    foodRect.width = tileWidth / 4;
    foodRect.height = tileHeight / 4;
    const foodTile = getTile(ui.board, state.food.row, state.food.col);
    foodRect.position.set(foodTile.position.x, foodTile.position.y);

    ui.board.position.set(-(background.width / 2 - tileWidth / 2) + margin, -(background.height / 2 - tileHeight / 2) + margin);

    two.update();
}