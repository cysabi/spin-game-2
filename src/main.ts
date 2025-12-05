import { Box, Edge, World, Testbed } from "planck/with-testbed";
import "./style.css";
import { PLAYER_1, SYSTEM, on } from "@rcade/plugin-input-classic";
import { Chain, Polygon, Vec2 } from "planck";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <h1>cysabi-rcade</h1>
  <p id="status">Press 1P START</p>
  <div id="controls"></div>
`;

const status = document.querySelector<HTMLParagraphElement>("#status")!;
const controls = document.querySelector<HTMLDivElement>("#controls")!;

let gameStarted = false;

on("press", console.log);

let world = new World({
  gravity: { x: 0, y: 0 },
});
const testbed = Testbed.mount({});

function getVectorsForRegularPolygonOfSize(size: number, points: number) {
  let hexagonPoints: Vec2[] = [];
  const angle = (2 * Math.PI) / points;
  for (let i = 0; i < points; i++) {
    let xx = size * Math.cos(angle * i);
    let yy = size * Math.sin(angle * i);
    hexagonPoints.push(Vec2(xx, yy));
  }
  hexagonPoints.push(hexagonPoints[0]);
  return hexagonPoints;
}

let arena = world.createBody({
  type: "static",
  position: { x: 0, y: 10 },
  // angle: Math.PI * 0.1,
});
arena.createFixture({
  shape: new Chain(getVectorsForRegularPolygonOfSize(30, 6)),
});

let player1spinner = world.createBody({
  type: "dynamic",
  position: { x: -10, y: 0 },
});
player1spinner.createFixture({
  shape: new Polygon(getVectorsForRegularPolygonOfSize(2, 6)),
  density: 1.0,
  friction: 0.3,
  restitution: 1,
});

let player2spinner = world.createBody({
  type: "dynamic",
  position: { x: 10, y: 0 },
});
player2spinner.createFixture({
  shape: new Polygon(getVectorsForRegularPolygonOfSize(2, 6)),
  density: 1.0,
  friction: 0.3,
  restitution: 1,
});

let previousTimestamp: number | null = null;
function update(timestamp: number) {
  if (previousTimestamp) {
    const dt = timestamp - previousTimestamp;
    world.step(dt);
    previousTimestamp = timestamp;
  }
  if (!gameStarted) {
    gameStarted = true;
    testbed.start(world);

    player1spinner.applyLinearImpulse(
      Vec2(500, 500),
      player1spinner.getPosition(),
    );

    player1spinner.applyAngularImpulse(5);
    player2spinner.applyLinearImpulse(
      Vec2(500, 500),
      player2spinner.getPosition(),
    );
    player2spinner.applyAngularImpulse(5);

    if (SYSTEM.ONE_PLAYER) {
      status.textContent = "Game Started!";
      // gameStarted = true;
      testbed.start(world);
    }
  } else {
    const inputs: string[] = [];
    if (PLAYER_1.DPAD.up) inputs.push("↑");
    if (PLAYER_1.DPAD.down) inputs.push("↓");
    if (PLAYER_1.DPAD.left) inputs.push("←");
    if (PLAYER_1.DPAD.right) inputs.push("→");
    if (PLAYER_1.A) inputs.push("A");
    if (PLAYER_1.B) inputs.push("B");

    controls.textContent = inputs.length > 0 ? inputs.join(" ") : "-";
  }

  requestAnimationFrame(update);
}

update(performance.now());
