import Two from 'two.js';
import { Group } from 'two.js/src/group';
import { Shape } from 'two.js/src/shape';
import { Text } from 'two.js/src/text';
import perlin from './perlin';
import { PhysicsCircle, SimState } from './types';

const STATE: SimState = {
  mouse: {x: 0, y: 0},
  showMouse: true,
  showText: true,
  hadLastUpdate: true,
  nodeColor: `blue`,
  autoscale: true,
}

const CONSTANTS = {
  mouseForce: 40, // Spring force constant for mouse force on nodes. Is a repelling force
  mouseRange: 120, // Radius of mouse range
  mouseDampen: 20, // How much to dampen velocity on entering mouse area
  anchorSmoothMult: 0.1, // How much anchor force there is to return nodes to anchor point if not in mouse range
  maxSwitchAcceleration: 0.4, // Max acceleration when moving from mouse effects to anchor effects
  perlinNoiseMult: 0.2, // How much the perlin noise will translate nodes from their origional anchor point.
  nodeDensity: 40, // How dense to pack the nodes. This is an inverse- low numbers are more dense.
  nodeSize: 7, // Radius of the nodes
  nodeMass: 5, // Mass of the nodes
  targetTextSize: 300, // Target text size
  stageHeight: 450, // How tall the canvas is
  densityScale: 1, // Scale node density based on text size
  sizeScale: 1, // Scale node size based on text size
}

const LABELS = {
  mouseForce: {
    hint: "Spring force constant for mouse force on nodes. Is a repelling force",
    label: "Mouse force",
  },
  anchorSmoothMult: {
    hint: "How much anchor force there is to return nodes to anchor point if not in mouse range",
    label: "Anchor force",
  },
  maxSwitchAcceleration: {
    hint: "Max acceleration when moving due anchor effects. Large number is less smooth- higher cap on acceleration",
    label: "Anchor smoothing",
  },
  mouseRange: {
    hint: "Radius of mouse range",
    label: "Mouse range",
  },
  stageHeight: {
    hint: "How tall the canvas is",
    label: "Canvas height",
  },
  perlinNoiseMult: {
    hint: "How much the perlin noise will translate nodes from their origional anchor point",
    label: "Anchor position noise",
  },
  nodeDensity: {
    hint: "How dense to pack the nodes. This is an inverse- low numbers are more dense. This is pixels per node",
    label: "Node density",
  },
  nodeSize: {
    hint: "Radius of the nodes",
    label: "Node size",
  },
  nodeMass: {
    hint: "Mass of the nodes",
    label: "Node mass"
  },
  mouseDampen: {
    hint: "How much to dampen velocity on entering mouse area",
    label: "Mouse dampen",
  },
  targetTextSize: {
    hint: "Max and initial text size. Also used for autoscale if enabled",
    label: "Target text size",
  },
  densityScale: {
    hint: "Scale to get node density based on rendered text size",
    label: "Density autoscale",
  },
  sizeScale: {
    hint: "Scale to get node size based on rendered text size",
    label: "Size autoscale",
  }
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

const resizeMainText = (two: Two) => {
  const text = two.scene.getById("mainDrawText");
  const size = text.getBoundingClientRect(true);
  let newSize = 1;
  if (size.width > two.width * .8 || size.width < two.width * .6) {
    newSize = (two.width * .8) / size.width;
  }

  if (size.height > two.height - 20) {
    const newHSize = (two.height - 20) / size.height;
    if (newHSize < newSize) {
      newSize = newHSize;
    }
  }
  text.size = Math.max(Math.min(text.size * newSize, CONSTANTS.targetTextSize), 15);
  text.translation.set(two.width / 2, two.height / 2 - 20);
}

const drawNewText = (two: Two, text = "") => {
  const textNode = two.scene.getById("mainDrawText") as Text;
  const mainGroup = two.scene.getById("mainGroup") as Group;
  
  textNode.value = text;
  mainGroup.visible = false;
  textNode.visible = true;

  // Make sure we update text size for new text
  two.update();
  resizeMainText(two);
  two.update();
  two.render();

  const canvas = two.renderer.domElement as HTMLCanvasElement;
  const context = two.renderer.ctx as CanvasRenderingContext2D;
  const ratio = two.width / canvas.width;

  if (STATE.autoscale) {
    if (CONSTANTS.densityScale === 1 || CONSTANTS.sizeScale === 1) {
      CONSTANTS.densityScale = CONSTANTS.nodeDensity / CONSTANTS.targetTextSize;
      CONSTANTS.sizeScale = CONSTANTS.nodeSize / CONSTANTS.targetTextSize;
    }
  }

  const textSize = textNode.size;

  const resolution = Math.floor(STATE.autoscale ? CONSTANTS.densityScale * textSize * ratio : CONSTANTS.nodeDensity * ratio); 
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

        const dotSize = STATE.autoscale ? CONSTANTS.sizeScale * textNode.size : CONSTANTS.nodeSize;

        if (mainGroup.children.length > index) {
          const circle = mainGroup.children[index] as PhysicsCircle;
          circle.anchor.set(nx + dx, ny + dy);
          circle.velocity.set(0, 0);
          circle.useAcceleration = false;
          circle.mass = CONSTANTS.nodeMass;
          circle.radius = dotSize;
        } else {
          const circle = new PhysicsCircle(nx + dx, ny + dy, dotSize, CONSTANTS.nodeMass);
          const redFill = STATE.nodeColor === `red` ? 200 : 30;
          const greenFill = STATE.nodeColor === `green` ? 200 : 30;
          const blueFill = STATE.nodeColor === `blue` ? 200 : 30;

          const redStroke = STATE.nodeColor === `red` ? 110 : 10;
          const greenStroke = STATE.nodeColor === `green` ? 110 : 10;
          const blueStroke = STATE.nodeColor === `blue` ? 110 : 10;
          circle.fill = `rgb(${redFill}, ${greenFill}, ${blueFill})`;
          circle.stroke = `rgb(${redStroke}, ${greenStroke}, ${blueStroke})`;
          circle.anchor.set(nx + dx, ny + dy);

          mainGroup.add(circle);
        }
        index++;
      }
    }
  }

  while (mainGroup.children.length > index + 1) {
    const child = mainGroup.children[mainGroup.children.length - 1];
    child.remove();
    two.release(child);
  }
  mainGroup.visible = true;
  textNode.visible = STATE.showText;

  two.update();
}

const updateSimulation = (two: Two, frames: number) => {
  const anchorSmoothMult = CONSTANTS.anchorSmoothMult;

  const mouseRange = CONSTANTS.mouseRange;

  const mainGroup = two.scene.getById("mainGroup") as Group;
  const mouseCircle = two.scene.getById("mouseCircle") as Shape;
  const outerMouseCircle = two.scene.getById("outerMouseCircle") as Shape;

  mouseCircle.translation.set(STATE.mouse.x, STATE.mouse.y);
  outerMouseCircle.translation.set(STATE.mouse.x, STATE.mouse.y);

  STATE.hadLastUpdate = false;

  for(let i=0; i<mainGroup.children.length; i++) {
    let node = mainGroup.children[i] as PhysicsCircle;
    const x = node.translation.x;
    const y = node.translation.y;

    let dx = x - node.anchor.x;
    let dy = y - node.anchor.y;

    const mdx = x - STATE.mouse.x;
    const mdy = y - STATE.mouse.y;
    const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
    
    const mouseForce = (mDist !== 0 && mDist < mouseRange) ? CONSTANTS.mouseForce / mDist : 0;
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
      if (newAcceleration > maxAcceleration) {
        const mult = maxAcceleration / newAcceleration;
        node.velocity.addSelf(dvx * mult, dvy * mult);
      } else {
        node.velocity.set(newVX, newVY);
      }
      if (!STATE.hadLastUpdate && (Math.abs(node.velocity.x) > 0.1 || Math.abs(node.velocity.y) > 0.1)) {
        STATE.hadLastUpdate = true;
      }

      node.useAcceleration = false;
    } else {
      STATE.hadLastUpdate = true;
      node.velocity.x += xAcceleration;
      node.velocity.y += yAcceleration;
      // Dampen large velocities if we re-enter mouse range
      if (!node.useAcceleration) {
        node.velocity.multiply(1 / CONSTANTS.mouseDampen);
      }
      node.useAcceleration = true;
    }

    node.translation.addSelf(node.velocity)
  }
  if (!STATE.hadLastUpdate && STATE.mouse.x < 0 && STATE.mouse.y < 0) {
    two.pause();
  }
}

const startSimulation = (two: Two) => {
  // Bind a function to scale and rotate the group to the animation loop.
  const update = (frames: number) => {
    updateSimulation(two, frames);
  }
  two.bind('update', update);

  const canvas = two.renderer.domElement as HTMLCanvasElement;
  canvas.onmousemove = (event: MouseEvent) => {
    const x = event.x - canvas.offsetLeft;
    const y = event.y - canvas.offsetTop;

    STATE.mouse.x = x;
    STATE.mouse.y = y;
    
    if (!two.playing) {
      two.play();
    }
  };

  const isMobile = window.navigator.maxTouchPoints > 0;
  if (isMobile) {
    canvas.ontouchmove = ((event: TouchEvent) => {
      event.preventDefault();
      const x = event.targetTouches.item(0)?.clientX;
      const y = event.targetTouches.item(0)?.clientY;
      if (!isNaN(x) &&  !isNaN(y)) {
        STATE.mouse.x = x;
        STATE.mouse.y = y;
      }
    });
    canvas.ontouchend = () => {
      STATE.mouse.x = -CONSTANTS.mouseRange * 2;
      STATE.mouse.y = -CONSTANTS.mouseRange * 2;
    }
  }

  window.onresize = (() => {
    const newWidth = window.innerWidth;
    const newHeight = two.height;
    two.renderer.setSize(newWidth, newHeight);
    two.width = newWidth;
    two.height = newHeight;
    const textNode = two.scene.getById("mainDrawText") as Text;
    drawNewText(two, textNode.value);
    if (!two.playing) {
      two.play();
    }
  });

  canvas.onmouseleave = () => {
    STATE.mouse.x = -CONSTANTS.mouseRange * 2;
    STATE.mouse.y = -CONSTANTS.mouseRange * 2;
  }

  // Finally, start the animation loop
  two.play();
}

const explodeNodes = (two: Two) => {
  const mainGroup = two.scene.getById("mainGroup") as Group;
  for(let i=0; i<mainGroup.children.length; i++) {
    let node = mainGroup.children[i] as PhysicsCircle;
    node.useAcceleration = false;
    node.velocity.set(0, 0);
    node.translation.set(Math.random() * two.width, Math.random() * two.height);
  }
}

window.onload = () => {
  let textForm = document.getElementById("textForm") as HTMLFormElement;
  let input = document.getElementById("textInput") as HTMLInputElement;

  let SetTextButton = document.getElementById("SetText") as HTMLButtonElement;
  let explodeButton = document.getElementById("explodeButton") as HTMLButtonElement;
  let updateParamsButton = document.getElementById("updateParamsButton") as HTMLButtonElement;

  let hideTextInput = document.getElementById("hideTextInput") as HTMLInputElement;
  let hideMouseInput = document.getElementById("hideMouseInput") as HTMLInputElement;
  let autoscaleInput = document.getElementById("autoscaleInput") as HTMLInputElement;

  const otherControls = document.getElementById("otherControls") as HTMLDivElement;

  let gameArea = document.getElementById("gameArea");

  // Get url params to control UI and values for simulation
  const urlParams = new URLSearchParams(window.location.search);
  const initialText = urlParams.get('text') ?? 'Hello';
  input.value = initialText;

  const initialMouseVisible = !(urlParams.get('showmouse') === 'false');
  const initialTextVisible = !(urlParams.get('showtext') === 'false');
  const autoscale = (urlParams.get('autoscale') ?? 'true') === 'true';
  STATE.showMouse = initialMouseVisible;
  STATE.showText = initialTextVisible;
  STATE.autoscale = autoscale;

  hideTextInput.checked = !initialTextVisible;
  hideMouseInput.checked = !initialMouseVisible;
  autoscaleInput.checked = autoscale;

  const hideUI = urlParams.get('gui') === 'hide';

  const otherControlsInputs: HTMLInputElement[] = [];

  Object.entries(CONSTANTS).forEach(([key, value]) => {
    const initial = urlParams.get(key);
    if (initial) {
      const initialValue = Number.parseFloat(initial);
      if (!isNaN(initialValue)) {
        const cKey = key as keyof typeof CONSTANTS;
        CONSTANTS[cKey] = initialValue;
      }
    }
  });

  let mouseColor = urlParams.get('mousecolor') ?? 'red';
  if (!['red', 'green', 'blue', 'black'].includes(mouseColor)) {
    mouseColor = 'red';
  }

  let nodeColor = urlParams.get('nodecolor') ?? 'blue';
  if (!['red', 'green', 'blue', 'black'].includes(nodeColor)) {
    nodeColor = 'blue';
  }
  const stateNodeColor = nodeColor as "red" | "green" | "blue" | "black";
  STATE.nodeColor = stateNodeColor;

  if (!hideUI) {
    Object.entries(CONSTANTS).forEach(([key, value]) => {
      const input = document.createElement('input') as HTMLInputElement;
      input.value = value.toString();
      input.id = key;
      const cKey = key as keyof typeof LABELS;
      const label = document.createElement("div");
      label.innerHTML = `${LABELS[cKey].label}: `;
      input.title = LABELS[cKey].hint;
      input.alt = LABELS[cKey].hint;
      label.style.padding = `5px`;
      otherControls.appendChild(label);
      label.appendChild(input);
      input.style.maxWidth = `4rem`;
      otherControlsInputs.push(input);
    });  
  }

  const two = initCanvas(gameArea);

  const outerMouseCircle = two.makeCircle(-CONSTANTS.mouseRange * 2, -CONSTANTS.mouseRange * 2, CONSTANTS.mouseRange);
  const mouseRed = mouseColor === `red` ? 255 : 200;
  const mouseGreen = mouseColor === `green` ? 255 : 200;
  const mouseBlue = mouseColor === `blue` ? 255 : 200;
  outerMouseCircle.fill = `rgb(${mouseRed}, ${mouseGreen}, ${mouseBlue})`;
  outerMouseCircle.stroke = mouseColor;
  outerMouseCircle.id = `outerMouseCircle`;

  const mouseCircle = two.makeCircle(-CONSTANTS.mouseRange * 2, -CONSTANTS.mouseRange * 2, 10);
  mouseCircle.fill = mouseColor;
  mouseCircle.stroke = mouseColor;
  mouseCircle.id = `mouseCircle`;

  outerMouseCircle.visible = STATE.showMouse;
  mouseCircle.visible = STATE.showMouse;

  const text = two.makeText(initialText, two.width / 2, two.height / 2 - 20, {
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

  hideMouseInput.onchange = (event) => {
    event.preventDefault();
    const newValue = hideMouseInput.checked;
    STATE.showMouse = !newValue;
    mouseCircle.visible = STATE.showMouse;
    outerMouseCircle.visible = STATE.showMouse;
  }

  hideTextInput.onchange = (event) => {
    event.preventDefault();
    const newValue = hideTextInput.checked;
    STATE.showText = !newValue;
    text.visible = STATE.showText;
  }

  autoscaleInput.onchange = (event) => {
    event.preventDefault();
    const newValue = autoscaleInput.checked;
    STATE.autoscale = newValue;
    const text = input.value;
    drawNewText(two, text);
  }

  updateParamsButton.onclick = () => {
    // Update values
    for(let input of otherControlsInputs) {
      const key = input.id;
      const cKey = key as keyof typeof CONSTANTS;
      const newValue = Number.parseFloat(input.value);
      if (!isNaN(newValue)) {
        CONSTANTS[cKey] = newValue;
      }
    }

    outerMouseCircle.radius = CONSTANTS.mouseRange;
    const text = input.value;
    drawNewText(two, text);
  }

  startSimulation(two);
}
