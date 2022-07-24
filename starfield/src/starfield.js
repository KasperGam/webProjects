let CANVAS;
let CONTEXT;

const WIDTH = 500;
const HEIGHT = 500;

const FPS = 30;

const NUM_STARS = 80;
const STAR_SIZE = 2;

const VELOCITY = 1 / 10;
const TAIL_LENGTH = 1 / 3;
const FRAME_DIFF = 3;

let stars = [];

function runAnimation() {
    setInterval(() => {
        update();
    }, 1000 / FPS);
}

function update() {
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;

    for (let starIndex in stars) {
        const star = stars[starIndex];
        const dx = star.position.x - cx;
        const dy = star.position.y - cy;

        const mx = dx * VELOCITY;
        const my = dy * VELOCITY;
        
        star.lastPosition.x = (star.position.x + mx) - dx * TAIL_LENGTH;
        star.lastPosition.y = (star.position.y + my) - dy * TAIL_LENGTH;

        star.position.x += mx;
        star.position.y += my;

        if(star.lastPosition.x < 0 || star.lastPosition.x > WIDTH || star.lastPosition.y < 0 || star.lastPosition.y > HEIGHT) {
            stars.splice(starIndex, 1);
        }
    }
    generateStars();
    draw();
}

function draw() {
    const ctx = CONTEXT;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.lineWidth = STAR_SIZE;

    for(let star of stars) {
        ctx.strokeStyle = '#DDD';
        drawLine(ctx, star.lastPosition.x, star.lastPosition.y, star.position.x, star.position.y);
    }
}

function drawLine(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.stroke();
}

function generateStars() {
    while (stars.length < NUM_STARS - 1) {
        const x = Math.random() * WIDTH / 3 + WIDTH / 3;
        const y = Math.random() * HEIGHT / 3 + HEIGHT / 3;
        stars.push({
            lastPosition: {x, y},
            position: {x, y},
            frameDiff: 0,
        });
    }
}

function startAnimation() {
    generateStars();
    runAnimation();
}

function onLayout() {
    const canvas = document.getElementById('canvas');
    CANVAS = canvas;

    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    if (canvas.getContext) {
		context = canvas.getContext('2d');
        CONTEXT = context;

        startAnimation();
    } else {
		alert("Canvas not supported!");
	}
}
