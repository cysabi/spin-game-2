import { PLAYER_1, PLAYER_2, SYSTEM, on } from "@rcade/plugin-input-classic";
import {
  PLAYER_1 as PLAYER_1_SPINNER,
  PLAYER_2 as PLAYER_2_SPINNER,
} from "@rcade/plugin-input-spinners";
import { Testbed, World, Chain, Polygon, Vec2 } from "planck/with-testbed";
import "./style.css";

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
  position: { x: -20, y: 10 },
});
player1spinner.createFixture({
  shape: new Polygon(getVectorsForRegularPolygonOfSize(2, 6)),
  density: 1.0,
  friction: 0.7,
  restitution: 1,
});

let player2spinner = world.createBody({
  type: "dynamic",
  position: { x: 20, y: 10 },
  angle: 0,
});
player2spinner.createFixture({
  shape: new Polygon(getVectorsForRegularPolygonOfSize(2, 6)),
  density: 1.0,
  friction: 0.7,
  restitution: 1,
});

let player1arrow = world.createBody({
  type: "static",
  position: { x: -20, y: 10 },
  active: false,
  angle: 0,
});

player1arrow.createFixture({
  shape: new Chain([
    Vec2(0, 0),
    Vec2(10, 0),
    Vec2(10, 3),
    Vec2(13, 0),
    Vec2(10, -3),
    Vec2(10, 0),
  ]),
  density: 1.0,
  friction: 0.3,
  restitution: 1,
});

let player2arrow = world.createBody({
  type: "static",
  position: { x: 20, y: 10 },
  active: false,
});
player2arrow.createFixture({
  shape: new Chain([
    Vec2(0, 0),
    Vec2(-10, 0),
    Vec2(-10, -3),
    Vec2(-13, 0),
    Vec2(-10, 3),
    Vec2(-10, 0),
  ]),
  density: 1.0,
  friction: 0.3,
  restitution: 1,
});

let hasPlayer1Launched = false;
let hasPlayer2Launched = false;

function launchPlayer1() {
  if (hasPlayer1Launched) return;
  hasPlayer1Launched = true;
  const direction = Math.sin(player1arrow.getAngle());
  player1spinner.applyLinearImpulse(
    Vec2(500, direction * 500),
    player1spinner.getPosition(),
  );

  console.log(player1spinner.getAngularVelocity());
  world.destroyBody(player1arrow);
}

function launchPlayer2() {
  if (hasPlayer2Launched) return;
  hasPlayer2Launched = true;
  const direction = Math.sin(player2arrow.getAngle());
  player2spinner.applyLinearImpulse(
    Vec2(-500, -direction * 500),
    player2spinner.getPosition(),
  );
  world.destroyBody(player2arrow);
}

let previousTimestamp: number | null = null;

function update(timestamp: number) {
  const player1PowerBar = document.getElementById("player-1-power-bar");
  const player2PowerBar = document.getElementById("player-2-power-bar");
  if (previousTimestamp) {
    const dt = timestamp - previousTimestamp;
    world.step(dt);
    previousTimestamp = timestamp;
  }
  if (!gameStarted) {
    gameStarted = true;
    testbed.start(world);

    setTimeout(() => {
      launchPlayer1();
      launchPlayer2();
    }, 5000);

    if (SYSTEM.ONE_PLAYER) {
      status.textContent = "Game Started!";
      // gameStarted = true;
      testbed.start(world);
    }
  } else {
    const dt = timestamp - (previousTimestamp ?? 0);
    const dt_seconds = dt / 1000;
    const SPEED = 10;

    if (PLAYER_1.A && !hasPlayer1Launched) {
      launchPlayer1();
    }

    const testStepDelta = 20;
    const testStepResolution = 64;
    if (!hasPlayer1Launched) {
      const amount = (testStepDelta / testStepResolution) * SPEED;
      // const amount =
      //   (PLAYER_1_SPINNER.SPINNER.step_delta /
      //     PLAYER_1_SPINNER.SPINNER.step_resolution) *
      //   SPEED;

      player1spinner.applyAngularImpulse(amount * dt_seconds);
    }

    if (!hasPlayer2Launched) {
      const amount = (testStepDelta / testStepResolution) * SPEED;
      // const amount =
      //   (PLAYER_2_SPINNER.SPINNER.step_delta /
      //     PLAYER_2_SPINNER.SPINNER.step_resolution) *
      //   SPEED;

      player2spinner.applyAngularImpulse(amount * dt_seconds);
    }

    if (PLAYER_2.A && !hasPlayer2Launched) {
      launchPlayer2();
    }

    if (PLAYER_1.DPAD.up) {
      let newAngle = player1arrow.getAngle() + 0.05;
      if (newAngle > 1) newAngle = 1;
      player1arrow.setAngle(newAngle);
    }
    if (PLAYER_1.DPAD.down) {
      let newAngle = player1arrow.getAngle() - 0.05;
      if (newAngle < -1) newAngle = -1;
      player1arrow.setAngle(newAngle);
    }
    if (PLAYER_2.DPAD.up) {
      let newAngle = player2arrow.getAngle() - 0.05;
      if (newAngle < -1) newAngle = -1;
      player2arrow.setAngle(newAngle);
    }
    if (PLAYER_2.DPAD.down) {
      let newAngle = player2arrow.getAngle() + 0.05;
      if (newAngle > 1) newAngle = 1;
      player2arrow.setAngle(newAngle);
    }

    if (player1PowerBar) {
      player1PowerBar.style = `height: ${Math.min(300, player1spinner.getAngularVelocity())}px;`;
    }
    if (player2PowerBar) {
      player2PowerBar!.style = `height: ${Math.min(300, player2spinner.getAngularVelocity())}px;`;
    }
  }

  requestAnimationFrame(update);
}

update(performance.now());
