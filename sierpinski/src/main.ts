import './style.css'
import Two from 'two.js';
import { Renderer } from 'two.js/src/renderers/svg';
import { Group } from 'two.js/src/group';
import { Polygon } from 'two.js/src/shapes/polygon';
import { Anchor } from 'two.js/src/anchor';
import { Vector } from 'two.js/src/vector';
import { Path } from 'two.js/src/path';
import { Shape } from 'two.js/src/shape';

const triangleArea = document.getElementById('triangleArea') as HTMLDivElement;
const triIncrease = document.getElementById('triIncrease') as HTMLButtonElement;
const triDecrease = document.getElementById('triDecrease') as HTMLButtonElement;

let triLevel = 0;

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

  const newLevelsGroup = new Group();

  drawSierpinskiTriangleLevel(mainGroup, newLevelsGroup, 1, levels, v1, v2, v3);
  
  while(newLevelsGroup.children.length > 0) {
    const child = (newLevelsGroup.children as Shape[]).pop();
    child?.remove();
    if (child) {
      mainGroup.add(child);
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

  triDecrease.onclick = () => {
    if (triLevel > 0) {
      triLevel--;
    }
    drawSierpinskiTriangle(triTwo, triLevel);
  }

  triIncrease.onclick = () => {
    if (triLevel < 8) {
      triLevel++;
    }
    drawSierpinskiTriangle(triTwo, triLevel);
  }

  window.onresize = () => {
    const newWidth = window.innerWidth - 40;
    triTwo.width = newWidth;
    (triTwo.renderer as Renderer).setSize(newWidth, triTwo.height);
    (triTwo.scene as Group).getById("mainTriangleGroup")
      .translation.set(newWidth / 2, triTwo.height / 2 + 60);
    triTwo.update();
  }
};