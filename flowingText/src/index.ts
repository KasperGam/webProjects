import Two from 'two.js';
import { Group } from 'two.js/src/group';
import { Shape } from 'two.js/src/shape';
import { Circle } from 'two.js/src/shapes/circle';
import { Text } from 'two.js/src/text';
import perlin from './perlin';
import { SimState } from './types';

const STATE: SimState = {
  mouse: {x: 0, y: 0},
  nodes: []
}

const CONSTANTS = {
  mouseSpring: 40,
  anchorSmoothMult: 0.1,
  maxSwitchAcceleration: 0.4,
  mouseRange: 120,
  stageHeight: 450,
  perlinNoiseMult: 0.2,
  nodeDensity: 40,
  nodeSize: 7,
  nodeMass: 5,
  mouseDampen: 20,
}

const initCanvas = (parent: HTMLElement) => {
  // Make an instance of two and place it on the page.
  const params = {
    fullscreen: false,
    type: Two.Types.canvas,
  };

  const elem = parent;
  const two = new Two(params).appendTo(elem);

  const width = document.body.clientWidth;
  const height = CONSTANTS.stageHeight;

  two.renderer.setSize(width, height);
  two.width = width;
  two.height = height;

  return two;
}

const isInsideText = (pixels: ImageData) => {
  for(let i=0; i<pixels.data.length; i+= 4) {
    if(pixels.data[i] === 254 && pixels.data[i+1] === 255 && pixels.data[i+2] === 255) {
      return true;
    }
  }
  return false;
}

const drawNewText = (two: Two, text = "") => {
  const textNode = two.scene.getById("mainDrawText") as Text;
  const mainGroup = two.scene.getById("mainGroup") as Group;
  
  textNode.value = text;
  mainGroup.visible = false;

  two.update();
  two.render();

  const canvas = two.renderer.domElement as HTMLCanvasElement;
  const context = two.renderer.ctx as CanvasRenderingContext2D;
  const ratio = two.width / canvas.width;

  const resolution = Math.floor(CONSTANTS.nodeDensity * ratio);
  const noiseMult = CONSTANTS.perlinNoiseMult;

  let index = 0;
  for(let x=0; x<canvas.width; x+= resolution) {
    for(let y=0; y<canvas.height; y+= resolution) {
      const pixels = context.getImageData(x, y, resolution, resolution);
      if (isInsideText(pixels)) {
        const nx = Math.floor(x * ratio);
        const ny = Math.floor(y * ratio);
        // Perlin returns values between [-1, 1] so add 1 and multiply by PI to get skew angle
        const noise = perlin.get(x / resolution * ratio, y / resolution * ratio);
        const skewAngle = (noise + 1) * Math.PI;
        // Get dx and dy from skew angle
        const dx = Math.cos(skewAngle) * resolution * noiseMult + resolution / 2;
        const dy = Math.sin(skewAngle) * resolution * noiseMult + resolution / 2;

        const dotSize = CONSTANTS.nodeSize;

        if (STATE.nodes.length > index) {
          let node = STATE.nodes[index];
          node.anchor = {x: nx + dx, y: ny + dy};
          node.velocity = {x: 0, y: 0};
          node.acceleration = {x: 0, y: 0};
          node.useAcceleration = false;
        } else {
          const circle = new Circle(nx + dx, ny + dy, dotSize);
          circle.fill = `rgb(30, 30, 200)`;
          circle.stroke = `rgb(10, 10, 110)`;
          mainGroup.add(circle);
          STATE.nodes.push({
            anchor: {x: circle.translation.x, y: circle.translation.y},
            position: {x: circle.translation.x, y: circle.translation.y},
            velocity: {x: 0, y: 0},
            acceleration: {x: 0, y: 0},
            mass: CONSTANTS.nodeMass,
            useAcceleration: false,
          })
        }
        index++;
      }
    }
  }

  while (STATE.nodes.length > index + 1) {
    STATE.nodes.pop();
  }

  while (mainGroup.children.length > STATE.nodes.length) {
    mainGroup.children[mainGroup.children.length - 1].remove();
  }
  mainGroup.visible = true;

  two.update();
}

const updateSimulation = (two: Two, frames: number) => {
  const mouseSpring = CONSTANTS.mouseSpring;
  const anchorSmoothMult = CONSTANTS.anchorSmoothMult;

  const mouseRange = CONSTANTS.mouseRange;

  const mainGroup = two.scene.getById("mainGroup");
  const mouseCircle = two.scene.getById("mouseCircle") as Shape;
  const outerMouseCircle = two.scene.getById("outerMouseCircle") as Shape;

  mouseCircle.translation.set(STATE.mouse.x, STATE.mouse.y);
  outerMouseCircle.translation.set(STATE.mouse.x, STATE.mouse.y);

  for(let i=0; i<STATE.nodes.length; i++) {
    let node = STATE.nodes[i];
    const x = node.position.x;
    const y = node.position.y;

    let dx = x - node.anchor.x;
    let dy = y - node.anchor.y;

    const mdx = x - STATE.mouse.x;
    const mdy = y - STATE.mouse.y;
    const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
    
    const mouseForce = (mDist !== 0 && mDist < mouseRange) ? mouseSpring / mDist : 0;
    const mouseAcceleration = mouseForce / node.mass;
    const xMouseAcceleration = mDist ? (mdx / mDist) * mouseAcceleration : 0;
    const yMouseAcceleration = mDist ? (mdy / mDist) * mouseAcceleration : 0;

    const xAcceleration = xMouseAcceleration;
    const yAcceleration = yMouseAcceleration;

    if (mDist > mouseRange || mouseForce < 0.1) {
      const newVX = -dx * anchorSmoothMult;
      const newVY = -dy * anchorSmoothMult;
      // Cap the acceleration of return
      const maxAcceleration = CONSTANTS.maxSwitchAcceleration;
      const dvx = newVX - node.velocity.x;
      const dvy = newVY - node.velocity.y;
      const newAcceleration = Math.sqrt(dvx * dvx + dvy * dvy);
      const mult = newAcceleration > maxAcceleration ? maxAcceleration / newAcceleration : 1;
      node.acceleration.x = 0;
      node.acceleration.y = 0;
      node.velocity.x = newAcceleration > maxAcceleration ? node.velocity.x + dvx * mult : newVX;
      node.velocity.y = newAcceleration > maxAcceleration ? node.velocity.y + dvy * mult : newVY;

      node.useAcceleration = false;
    } else {
      node.acceleration.x = xAcceleration;
      node.acceleration.y = yAcceleration;
      node.velocity.x += node.acceleration.x;
      node.velocity.y += node.acceleration.y;
      // Dampen large velocities if we re-enter mouse range
      if (!node.useAcceleration) {
        node.velocity.x = node.velocity.x / CONSTANTS.mouseDampen;
        node.velocity.y = node.velocity.y / CONSTANTS.mouseDampen;
      }
      node.useAcceleration = true;
    }

    node.position.x += node.velocity.x;
    node.position.y += node.velocity.y;

    const nodeChild = mainGroup.children[i] as Shape;
    nodeChild.translation.set(node.position.x, node.position.y);
  }
}

const startSimulation = (two: Two) => {
  const canvas = two.renderer.domElement as HTMLCanvasElement;
  canvas.onmousemove = (event: MouseEvent) => {
    const x = event.x - canvas.offsetLeft;
    const y = event.y - canvas.offsetTop;

    STATE.mouse.x = x;
    STATE.mouse.y = y;
  };

  canvas.onmouseleave = () => {
    STATE.mouse.x = -CONSTANTS.mouseRange * 2;
    STATE.mouse.y = -CONSTANTS.mouseRange * 2;
  }

  const update = (frames: number) => {
    updateSimulation(two, frames);
  }

  // Bind a function to scale and rotate the group to the animation loop.
  two.bind('update', update);
  // Finally, start the animation loop
  two.play();
}

const explodeNodes = (two: Two) => {
  for(let i=0; i<STATE.nodes.length; i++) {
    let node = STATE.nodes[i];
    node.useAcceleration = false;
    node.acceleration.x = 0;
    node.acceleration.y = 0;
    node.velocity.x = 0;
    node.velocity.y = 0;
    node.position.x = Math.random() * two.width;
    node.position.y = Math.random() * two.height;
  }
}

window.onload = () => {
  let textForm = document.getElementById("textForm") as HTMLFormElement;
  let input = document.getElementById("textInput") as HTMLInputElement;

  let SetTextButton = document.getElementById("SetText") as HTMLButtonElement;
  let explodeButton = document.getElementById("explodeButton") as HTMLButtonElement;

  const urlParams = new URLSearchParams(window.location.search);
  const initialText = urlParams.get('text') ?? 'Hello';
  input.value = initialText;

  let gameArea = document.getElementById("gameArea");
  const two = initCanvas(gameArea);

  const outerMouseCircle = two.makeCircle(-CONSTANTS.mouseRange * 2, -CONSTANTS.mouseRange * 2, CONSTANTS.mouseRange);
  outerMouseCircle.fill = `rgb(255, 200, 200)`;
  outerMouseCircle.stroke = `red`;
  outerMouseCircle.id = `outerMouseCircle`;

  const mouseCircle = two.makeCircle(-CONSTANTS.mouseRange * 2, -CONSTANTS.mouseRange * 2, 10);
  mouseCircle.fill = `red`;
  mouseCircle.stroke = `red`;
  mouseCircle.id = `mouseCircle`;

  const text = two.makeText("hi", two.width / 2, two.height / 2 - 50, {
    stroke: `black`,
    linewidth: 1,
    size: 300,
    family: ["Futura", "sans-serif"]
  });
  text.fill=`rgb(254, 255, 255, 255)`;
  text.id = `mainDrawText`;

  const mainGroup = two.makeGroup();
  mainGroup.id = "mainGroup";
  two.update();

  drawNewText(two, input.value);

  textForm.onsubmit = (event) => {
    event.preventDefault();
    console.log(event.target);
    const text = input.value;
    drawNewText(two, text);
  };

  SetTextButton.onclick = (event) => {
    event.preventDefault();
    const text = input.value;
    drawNewText(two, text);
  }

  explodeButton.onclick = (event) => {
    event.preventDefault();
    explodeNodes(two);
  }

  startSimulation(two);
}
