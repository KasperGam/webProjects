import './style.css'
import Two from 'two.js';
import { Renderer } from 'two.js/src/renderers/svg';
import { Group } from 'two.js/src/group';
import { Polygon } from 'two.js/src/shapes/polygon';
import { Anchor } from 'two.js/src/anchor';
import { Vector } from 'two.js/src/vector';
import { Path } from 'two.js/src/path';
import { Shape } from 'two.js/src/shape';
import { Rectangle } from 'two.js/src/shapes/rectangle';

const triangleArea = document.getElementById('triangleArea') as HTMLDivElement;
const triIncrease = document.getElementById('triIncrease') as HTMLButtonElement;
const triDecrease = document.getElementById('triDecrease') as HTMLButtonElement;

const squareArea = document.getElementById('squareArea') as HTMLDivElement;
const squareDecrease = document.getElementById('squareDecrease') as HTMLButtonElement;
const squareIncrease = document.getElementById('squareIncrease') as HTMLButtonElement;

let triLevel = 0;
let carpetLevel = 0;

let triLevelRendered = 0;
let carpetLevelRendered = 0;

const drawSierpinskiTriangle = (two: Two, levels: number) => {
  const mainGroup = (two.scene as Group).getById("mainTriangleGroup") as Group;
  const size = Math.min(two.height - 200, two.width / 3);
  let base = mainGroup.getById("baseTriangle") as Polygon | null;
  if (!base) {
    const newTriangle = new Polygon(0, 0, size, 3);
    newTriangle.fill = "#F00";
    newTriangle.stroke = "#F00";
    newTriangle.id = "baseTriangle";
    mainGroup.add(newTriangle);
    base = newTriangle;
  }
  
  const vertices = base.vertices as Anchor[];
  const v1 = vertices[0];
  const v2 = vertices[1];
  const v3 = vertices[2];

  if (levels > triLevelRendered) {
    const newLevelsGroup = new Group();
    drawSierpinskiTriangleLevel(mainGroup, newLevelsGroup, 1, levels, v1, v2, v3);
    triLevelRendered = levels;
    
    while(newLevelsGroup.children.length > 0) {
      const child = (newLevelsGroup.children as Shape[]).pop();
      child?.remove();
      if (child) {
        mainGroup.add(child);
      }
    }
  } else {
    for(let child of mainGroup.children) {
      child.visible = false;
    }

    base.visible = true;

    for (let i=0; i<=levels; i++) {
      const levelGroup = mainGroup.getById(`level_${i}`) as Group | null;
      if (levelGroup) {
        levelGroup.visible = true;
      }
    }
  }

  two.update();
}

const drawSierpinskiTriangleLevel = (main: Group, shared: Group, level: number, maxLevel: number, v1: Vector, v2: Vector, v3: Vector) => {
  if (maxLevel - level < 0) {
    const thisLevel = main.getById(`level_${level}`) as Group | null;
    if (thisLevel) {
      thisLevel.visible = false;
    }
    return;
  }

  const levelGroup = main.getById(`level_${level}`);
  let needsDraw = true;
  if (levelGroup as Group) {
    (levelGroup as Group).visible = true;
    needsDraw = false;
  }

  let sharedGroup = shared.getById(`level_${level}`) as Group | null;
  if (!sharedGroup) {
    sharedGroup = new Group();
    shared.add(sharedGroup);
    sharedGroup.id = `level_${level}`;
  }

  const p1 = Vector.add(v1, v2).multiply(0.5);
  const p2 = Vector.add(v2, v3).multiply(0.5);
  const p3 = Vector.add(v1, v3).multiply(0.5);

  if (needsDraw) {
    const a1 = new Anchor(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    const a2 = new Anchor(p2.x, p2.y, p3.x, p3.y, p1.x, p1.y);
    const a3 = new Anchor(p3.x, p3.y, p1.x, p1.y, p2.x, p2.y);
    const newMiddle = new Path([a1, a2, a3], true, false);
    newMiddle.fill = "#242424";
    newMiddle.stroke = "#242424";
    sharedGroup.add(newMiddle);
  }

  drawSierpinskiTriangleLevel(main, shared, level + 1, maxLevel, v1, p1, p3);
  drawSierpinskiTriangleLevel(main, shared, level + 1, maxLevel, p1, v2, p2);
  drawSierpinskiTriangleLevel(main, shared, level + 1, maxLevel, p3, p2, v3);

  return sharedGroup;
}

const drawSierpinskiCarpet = (two: Two, levels: number) => {
  const mainGroup = (two.scene as Group).getById("mainSquareGroup") as Group;
  const size = Math.min(two.height - 50, two.width / 3);
  let base = mainGroup.getById("baseCarpet") as Rectangle | null;
  if (!base) {
    const newRect = new Rectangle(0, -25, size, size);
    newRect.fill = "#F00";
    newRect.stroke = "#F00";
    newRect.id = "baseCarpet";

    mainGroup.add(newRect);
    base = newRect;
  }

  if (levels > carpetLevelRendered) {
    const newLevelsGroup = new Group();

    drawSierpinskiCarpetLevel(mainGroup, newLevelsGroup, 1, levels, new Vector(base.translation.x, base.translation.y), base.width);

    carpetLevelRendered = levels;
    
    while(newLevelsGroup.children.length > 0) {
      const child = (newLevelsGroup.children as Shape[]).pop();
      child?.remove();
      if (child) {
        mainGroup.add(child);
      }
    }
  } else {
    for(let child of mainGroup.children) {
      child.visible = false;
    }

    base.visible = true;

    for (let i=0; i<=levels; i++) {
      const levelGroup = mainGroup.getById(`level_${i}`) as Group | null;
      if (levelGroup) {
        levelGroup.visible = true;
      }
    }
  }

  two.update();
}

const drawSierpinskiCarpetLevel = (main: Group, shared: Group, level: number, maxLevel: number, point: Vector, size: number) => {
  if (maxLevel - level < 0) {
    const thisLevel = main.getById(`level_${level}`) as Group | null;
    if (thisLevel) {
      thisLevel.visible = false;
    }
    return;
  }

  const levelGroup = main.getById(`level_${level}`);
  let needsDraw = true;
  if (levelGroup as Group) {
    (levelGroup as Group).visible = true;
    needsDraw = false;
  }

  let sharedGroup = shared.getById(`level_${level}`) as Group | null;
  if (!sharedGroup) {
    sharedGroup = new Group();
    shared.add(sharedGroup);
    sharedGroup.id = `level_${level}`;
  }

  const newSize = size / 3;

  if (needsDraw) {
    const newMiddleRect = new Rectangle(point.x, point.y, newSize, newSize);
    newMiddleRect.fill = "#242424";
    newMiddleRect.stroke = "#242424";
    sharedGroup.add(newMiddleRect);
  }

  for(let x= -1; x<= 1; x++) {
    for(let y= -1; y<= 1; y++) {
      if (x !== 0 || y !== 0) {
        const newPoint = new Vector(point.x + x * newSize, point.y + y * newSize);
        drawSierpinskiCarpetLevel(main, shared, level + 1, maxLevel, newPoint, newSize);
      }
    }
  }
};

window.onload = () => {
  const options = {
    fullscreen: false,
    width: window.innerWidth - 40,
    height: 500,
    type: Two.Types.svg,
  }

  // Create two canvas for triangle
  const triTwo = new Two(options).appendTo(triangleArea);
  const mainTriGroup = triTwo.makeGroup();
  mainTriGroup.id = "mainTriangleGroup";
  mainTriGroup.translation.set(triTwo.width / 2, triTwo.height / 2 + 60);
  drawSierpinskiTriangle(triTwo, triLevel);

  // Create two canvas for carpet
  const squareTwo = new Two(options).appendTo(squareArea);
  const mainSquareGroup = squareTwo.makeGroup();
  mainSquareGroup.id = "mainSquareGroup";
  mainSquareGroup.translation.set(squareTwo.width / 2, squareTwo.height / 2);
  drawSierpinskiCarpet(squareTwo, carpetLevel);

  triDecrease.onclick = () => {
    if (triLevel > 0) {
      triLevel--;
      drawSierpinskiTriangle(triTwo, triLevel);
    }
  }

  triIncrease.onclick = () => {
    if (triLevel < 8) {
      triLevel++;
      drawSierpinskiTriangle(triTwo, triLevel);
    }
  }

  squareDecrease.onclick = () => {
    if (carpetLevel > 0) {
      carpetLevel--;
      drawSierpinskiCarpet(squareTwo, carpetLevel);
    }
  }

  squareIncrease.onclick = () => {
    if (carpetLevel < 5) {
      carpetLevel++;
      drawSierpinskiCarpet(squareTwo, carpetLevel);
    }
  }

  window.onresize = () => {
    const newWidth = window.innerWidth - 40;
    triTwo.width = newWidth;
    (triTwo.renderer as Renderer).setSize(newWidth, triTwo.height);
    (triTwo.scene as Group).getById("mainTriangleGroup")
      .translation.set(newWidth / 2, triTwo.height / 2 + 60);
    triTwo.update();

    squareTwo.width = newWidth;
    (squareTwo.renderer as Renderer).setSize(newWidth, squareTwo.height);
    (squareTwo.scene as Group).getById("mainSquareGroup")
      .translation.set(newWidth / 2, squareTwo.height / 2 + 60);
    squareTwo.update();
  }
};