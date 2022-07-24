import Two from "two.js";
import "./styles.css";
import { setupGame } from "./game/game";
import { LAYOUT, LAYOUT_IDS } from "./game/constants";

const initCanvas = (parent) => {
  // Make an instance of two and place it on the page.
  const params = {
    fullscreen: false
  };

  const elem = parent;
  const two = new Two(params).appendTo(elem);

  two.renderer.setSize(window.innerWidth, window.innerHeight - LAYOUT.TOP_CONTROLS.HEIGHT - LAYOUT.BACKGROUND.MARGIN);
  two.width = window.innerWidth;
  two.height = window.innerHeight - LAYOUT.TOP_CONTROLS.HEIGHT - LAYOUT.BACKGROUND.MARGIN;

  return two;
}

window.onload = () => {
  let gameControls = document.getElementById(LAYOUT_IDS.GAME_CONTROLS);

  if (!gameControls) {
    gameControls = document.createElement("div");
    gameControls.className = "gameControls";
    gameControls.id = LAYOUT_IDS.GAME_CONTROLS;
    document.body.appendChild(gameControls);

    const newGameButton = document.createElement("button");
    newGameButton.title = "New Game";
    newGameButton.id = LAYOUT_IDS.NEW_GAME_BUTTON;
    newGameButton.className = "newGameButton";
    newGameButton.innerHTML = "New Game";
    gameControls.appendChild(newGameButton);

    const scoreLabel = document.createElement("p");
    scoreLabel.id = LAYOUT_IDS.SCORE_LABEL;
    scoreLabel.className = "scoreLabel";

    scoreLabel.innerHTML = "Score: 0";

    gameControls.appendChild(scoreLabel);
  }

  let gameArea = document.getElementById(LAYOUT_IDS.GAME_AREA);

  if (!gameArea) {
    gameArea = document.createElement("div");
    gameArea.className = LAYOUT_IDS.GAME_AREA;
    gameArea.id = "gameArea";
    document.body.appendChild(gameArea);

    const two = initCanvas(gameArea);
    setupGame(two);
  }
}
