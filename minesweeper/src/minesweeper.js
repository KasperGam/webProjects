// ------------- Constants -------------
const BLOCK_HEIGHT = 24;
const BLOCK_WIDTH = 24;

const LINE_WIDTH = 3;

const BOMB = `B`;
const FLAG = `X`;

// ------------- Variables -------------
let TOTAL_WIDTH = 600;
let TOTAL_HEIGHT = 600;

let NUMBER_OF_ROWS = 25;
let NUMBER_OF_COLUMNS = 25;

let NUM_BOMBS = 80;

let GRID_CANVAS;
let GRID_CONTEXT;
let BOMBS_LEFT_LABEL;

// ------------- Game Data -------------
// 2D array for base values
let grid = [];
let gameOver = false;
let bombsLeft = 0;

function generateGridData() {
    // Reset game data
    gameOver = false;
    bombsLeft = 0;
    grid = [];
    const bombChance = NUM_BOMBS / (NUMBER_OF_ROWS * NUMBER_OF_COLUMNS)

    // Generate grid data. Use bomb number to randomly spawn bombs
    for(let i = 0; i<NUMBER_OF_ROWS; i++) {
        let rowArray = [];
        for(let j = 0; j<NUMBER_OF_COLUMNS; j++) {
            const spawnBomb = Math.random() <= bombChance;
            rowArray.push({visited: false, flagged: false, value: spawnBomb ? BOMB : 0 });
            bombsLeft += spawnBomb ? 1 : 0;
        }
        grid.push(rowArray);
    }

    // Fill in correct bomb neighbor values
    for (let i = 0; i<NUMBER_OF_ROWS; i++) {
        for (let j = 0; j<NUMBER_OF_COLUMNS; j++) {
            let totalAround = 0;
            // check cells around this one for bombs. Check all 8 cells on each side of this one
            if (grid[i][j].value !== BOMB) {
                for(let k = i-1; k<=i+1; k++) {
                    for (let l = j-1;l<=j+1; l++) {
                        // Make sure we are inside the grid bounds
                        if (k >= 0 && l >= 0 && k < NUMBER_OF_ROWS && l < NUMBER_OF_COLUMNS) {
                            if(grid[k][l].value === BOMB) {
                                totalAround++;
                            }
                        }
                    }
                }
                grid[i][j].value = totalAround;
            }
        }
    }
}

function drawGrid() {
    context = GRID_CONTEXT;
    context.lineWidth = LINE_WIDTH;

    context.clearRect(-LINE_WIDTH, -LINE_WIDTH, GRID_CANVAS.width + LINE_WIDTH * 2, GRID_CANVAS.height + LINE_WIDTH * 2);

    // Background color fill
    context.fillStyle = '#CCC';
    context.fillRect(0, 0, TOTAL_WIDTH, TOTAL_HEIGHT);

    BOMBS_LEFT_LABEL.innerHTML = `${bombsLeft}`;

    // Vertical column lines
    for(let i = 0; i<=NUMBER_OF_COLUMNS; i++) {
        drawLine(context, BLOCK_WIDTH * i, -LINE_WIDTH / 2, BLOCK_WIDTH * i, TOTAL_HEIGHT + LINE_WIDTH / 2);
    }
    // Horizontal row lines
    for (let j = 0; j<= NUMBER_OF_ROWS; j++) {
        drawLine(context, -LINE_WIDTH / 2, BLOCK_HEIGHT * j, TOTAL_WIDTH + LINE_WIDTH / 2, BLOCK_HEIGHT * j);
    }

    context.fillStyle = '#999';
    context.font = '14px arial'

    for(let i = 0; i<NUMBER_OF_ROWS; i++) {
        for(let j = 0; j<NUMBER_OF_COLUMNS; j++) {
            let cell = grid[i][j];
            const x = BLOCK_WIDTH * j + LINE_WIDTH / 2;
            const y = BLOCK_HEIGHT * i + LINE_WIDTH / 2;
            const w = BLOCK_WIDTH - LINE_WIDTH;
            const h = BLOCK_HEIGHT - LINE_WIDTH;
            // If visited, fill in cell value and new background color
            if (cell.visited) {
                // If a bomb, fill in red
                context.fillStyle = cell.value === BOMB ? '#DD0000' : '#999';
                context.fillRect(x, y, w, h);
                // Draw value
                if (cell.value !== 0) {
                    drawTextCentered(context, `${cell.value}`, x, y, w, h);
                }
            }
            // Draw flags
            if (cell.flagged) {
                drawTextCentered(context, FLAG, x, y, w, h);
            }

            if (cell.value === BOMB && gameOver) {
                drawTextCentered(context, BOMB, x, y, w, h);
            }
        }
    }
}

function drawTextCentered(ctx, text, x, y, w, h) {
    ctx.fillStyle = '#111';
    const size = ctx.measureText(text);
    ctx.fillText(text, x + (w - size.width) / 2, y + (h + size.actualBoundingBoxAscent) / 2);
}

function drawLine(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.stroke();
}

function gridClick(clickEvent) {
    const rect = GRID_CANVAS.getBoundingClientRect();
    let x = clickEvent.clientX - LINE_WIDTH - rect.left;
    let y = clickEvent.clientY - LINE_WIDTH - rect.top;

    const col = Math.floor(x / BLOCK_WIDTH);
    const row = Math.floor(y / BLOCK_HEIGHT);

    // Check in bounds
    if(col < 0 || row < 0 || col >= NUMBER_OF_COLUMNS || row >= NUMBER_OF_ROWS) {
        return;
    }

    // If game over, don't accept further gameplay
    if (gameOver) {
        return;
    }

    // Flags protect their cells
    if (grid[row][col].flagged) {
        return;
    }

    // Set visited and spread the click if we clicked on a 0 neighbor cell
    grid[row][col].visited = true;
    if (grid[row][col].value === 0) {
        spreadClick({row, col});
    }

    // If we clicked on a bomb, it is game over
    if (grid[row][col].value === BOMB) {
        gameOver = true;
    }

    // Redraw the board
    drawGrid();
}

function spreadClick(point) {
    const queue = [point];

    // Whenever we click on a point that has 0 neighbor bombs (value 0), 
    // reveal all other connected cells that are not bombs
    while(queue.length > 0) {
        let {row, col} = queue.shift();

        // If value is 0, enqueue all non-bomb neighbors
        if(grid[row][col].value === 0) {
            // Set visited
            grid[row][col].visited = true;

            // Check neighbors
            for(let i = row - 1; i <= row + 1; i++) {
                for(let j = col - 1; j <= col + 1; j++) {
                    if(i >= 0 && j >= 0 && i < NUMBER_OF_ROWS && j < NUMBER_OF_COLUMNS && !grid[i][j].visited) {
                        const gridVal = grid[i][j].value;
                        const valToShow = gridVal !== BOMB;
                        const isThisCell = i === row && j === col;
                        const isInQueue = queue.find((val) => val.row === i && val.col === j) !== undefined;
                        // Only add this cell to spread if it has not been added previously.
                        // Do not add bomb cells.
                        if(valToShow && !isThisCell && !isInQueue) {
                            queue.push({row: i, col: j});
                        }
                    }
                }
            }
        } else if (grid[row][col].value !== BOMB) {
            // If non-bomb cell, set visited
            grid[row][col].visited = true;
        }
    }
}

function flagClick(event) {
    const rect = GRID_CANVAS.getBoundingClientRect();

    let x = event.clientX - LINE_WIDTH - rect.left;
    let y = event.clientY - LINE_WIDTH - rect.top;

    const col = Math.floor(x / BLOCK_WIDTH);
    const row = Math.floor(y / BLOCK_HEIGHT);

    // Check in bounds
    if(col < 0 || row < 0 || col >= NUMBER_OF_COLUMNS || row >= NUMBER_OF_ROWS) {
        return;
    }

    // If not visited, set flagged
    if(!grid[row][col].visited) {
        grid[row][col].flagged = !grid[row][col].flagged;

        if (grid[row][col].flagged) {
            bombsLeft--;
        } else {
            bombsLeft++;
        }
    }

    // Redraw grid
    drawGrid();
}

function setupGame() {
    // Set height and width
    TOTAL_WIDTH = NUMBER_OF_COLUMNS * BLOCK_WIDTH;
    TOTAL_HEIGHT = NUMBER_OF_ROWS * BLOCK_HEIGHT;
    generateGridData();
    drawGrid();
}

function onLayout() {
	// Entry point
	canvas = document.getElementById('minesweeperCanvas');
    canvas.width = TOTAL_WIDTH + LINE_WIDTH * 2;
    canvas.height = TOTAL_HEIGHT + LINE_WIDTH * 2;

    GRID_CANVAS = canvas;

    bombsLeft = document.getElementById('bombsLeft');
    BOMBS_LEFT_LABEL = bombsLeft;

    widthField = document.getElementById('widthField');
    widthField.addEventListener('change', (event) => {
        const value = parseInt(widthField.value, 10);
        if (value) {
            NUMBER_OF_COLUMNS = value;
            setupGame();
        }
    });

    heightField = document.getElementById('heightField');
    heightField.addEventListener('change', (event) => {
        const value = parseInt(heightField.value, 10);
        if (value) {
            NUMBER_OF_ROWS = value;
            setupGame();
        }
    });

    bombField = document.getElementById('bombField');
    bombField.addEventListener('change', (event) => {
        const value = parseInt(bombField.value, 10);
        if (value) {
            NUM_BOMBS = value;
            setupGame();
        }
    });

    newGameButton = document.getElementById('newGameButton');
    newGameButton.onclick = setupGame;

    widthField.value = NUMBER_OF_COLUMNS;
    heightField.value = NUMBER_OF_ROWS;
    bombField.value = NUM_BOMBS;

	if (canvas.getContext) {
		context = canvas.getContext('2d');
        // Translate context to not cut off line width
        context.translate(LINE_WIDTH, LINE_WIDTH);

        GRID_CONTEXT = context;

        setupGame();

        // Add click and right click listeners
		canvas.addEventListener('click', gridClick, false);
        canvas.addEventListener('contextmenu', (event) => {
            // Prevent context menu from showing
            event.preventDefault();
            // Right click will set/unset flags
            flagClick(event);
            return false;
        }, false);
	} else {
		alert("Canvas not supported!");
	}
}