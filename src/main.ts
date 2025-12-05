import { PLAYER_1, PLAYER_2, SYSTEM, on } from "@rcade/plugin-input-classic";
import {
  PLAYER_1 as PLAYER_1_SPINNER,
  PLAYER_2 as PLAYER_2_SPINNER,
} from "@rcade/plugin-input-spinners";
import {
  Testbed,
  World,
  Chain,
  Polygon,
  Vec2,
  Body,
  PointState,
  getPointStates,
} from "planck/with-testbed";
import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <h1 id="title">Let It Rip</h1>
  <p id="status">Press 2P START</p>
`;

const status = document.querySelector<HTMLParagraphElement>("#status")!;
const title = document.querySelector<HTMLParagraphElement>("#title")!;
const topTextDisplay =
  document.querySelector<HTMLParagraphElement>("#top-text")!;
const centerTextDisplay =
  document.querySelector<HTMLParagraphElement>("#center-text")!;

function setTopText(text: string) {
  topTextDisplay.textContent = text;
}
function setCenterText(text: string) {
  centerTextDisplay.textContent = text;
}

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
  shape: new Chain(getVectorsForRegularPolygonOfSize(30, 14)),
});

let player1spinner = world.createBody({
  type: "dynamic",
  position: { x: -20, y: 10 },
  userData: "1",
  style: {
    fill: "rebeccapurple",
  },
});
player1spinner.createFixture({
  shape: new Polygon(getVectorsForRegularPolygonOfSize(4, 6)),
  density: 1.0,
  friction: 0.01,
  restitution: 1,
});

let player2spinner = world.createBody({
  type: "dynamic",
  position: { x: 20, y: 10 },
  userData: "2",
  style: {
    fill: "darkkhaki",
  },
});
player2spinner.createFixture({
  shape: new Polygon(getVectorsForRegularPolygonOfSize(4, 6)),
  density: 1.0,
  friction: 0.01,
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

let winner: null | 1 | 2 = null;

const LAUNCH_SPEED = 10000;

function launchPlayer1() {
  if (hasPlayer1Launched) return;
  hasPlayer1Launched = true;
  const direction = Math.sin(player1arrow.getAngle());
  player1spinner.applyLinearImpulse(
    Vec2(LAUNCH_SPEED, direction * LAUNCH_SPEED),
    player1spinner.getPosition(),
  );

  angularVelocity1 = player1spinner.getAngularVelocity();
  world.destroyBody(player1arrow);
}

function launchPlayer2() {
  if (hasPlayer2Launched) return;
  hasPlayer2Launched = true;
  const direction = Math.sin(player2arrow.getAngle());
  player2spinner.applyLinearImpulse(
    Vec2(-LAUNCH_SPEED, -direction * LAUNCH_SPEED),
    player2spinner.getPosition(),
  );
  angularVelocity2 = player2spinner.getAngularVelocity();
  world.destroyBody(player2arrow);
}

function bowlGravity(spinner: Body, dt: number) {
  const angle = Vec2.sub({ x: 0, y: 10 }, spinner.getPosition());
  spinner.setLinearDamping(1 - Math.min(spinner.getAngularVelocity(), 1));
  spinner.applyLinearImpulse(
    Vec2.mul(
      angle,
      (Math.max(0, angle.lengthSquared() - 10) / 4) * (dt / 100000),
    ),
    spinner.getPosition(),
  );
}

function spinDecay(vel: number, dt: number) {
  const decay = dt * 0.000005;
  return Math.max(0, vel - decay);
}

world.on("begin-contact", function (contact) {
  let bodyA = contact.getFixtureA().getBody();
  let bodyB = contact.getFixtureB().getBody();

  if (bodyA.getUserData() === "1" || bodyB.getUserData() === "1") {
    angularVelocity1 = Math.max(0, angularVelocity1 - Math.random() * 6);
  }
  if (bodyA.getUserData() === "2" || bodyB.getUserData() === "2") {
    angularVelocity2 = Math.max(0, angularVelocity2 - Math.random() * 6);
  }
});

let angularVelocity1 = 0;
let angularVelocity2 = 0;

const player1PowerBar = document.getElementById("player-1-power-bar");
const player2PowerBar = document.getElementById("player-2-power-bar");

function update(dt: number) {
  if (!gameStarted) {
    if (SYSTEM.TWO_PLAYER) {
      status.textContent = "";
      title.textContent = "";
      document.body.classList.remove("not-started");
      setTopText("");
      gameStarted = true;
      testbed.start(world);

      setCenterText("5");
      setTimeout(() => setCenterText("4"), 1000);
      setTimeout(() => setCenterText("3"), 2000);
      setTimeout(() => setCenterText("2"), 3000);
      setTimeout(() => setCenterText("1"), 4000);

      setTimeout(() => {
        launchPlayer1();
        launchPlayer2();
        setCenterText("");
        setTopText("Let It Rip!!!");
      }, 5000);
    }
  } else {
    const dt_seconds = dt / 1000;
    const SPEED = 100;

    // const testStepDelta = 20;
    // const testStepResolution = 64;

    if (!hasPlayer1Launched) {
      // const amount = (testStepDelta / testStepResolution) * SPEED;
      const amount =
        (Math.abs(PLAYER_1_SPINNER.SPINNER.step_delta) /
          PLAYER_1_SPINNER.SPINNER.step_resolution) *
        SPEED;

      player1spinner.applyAngularImpulse(amount * dt_seconds);
    } else {
      if (winner === 1) return;
      bowlGravity(player1spinner, dt);
      const decay = spinDecay(angularVelocity1, dt);
      if (decay > 0) {
        angularVelocity1 = decay;
      }
      player1spinner.setAngularVelocity(angularVelocity1);
    }

    if (!hasPlayer2Launched) {
      // const amount = (testStepDelta / testStepResolution) * SPEED;
      const amount =
        (Math.abs(PLAYER_2_SPINNER.SPINNER.step_delta) /
          PLAYER_2_SPINNER.SPINNER.step_resolution) *
        SPEED;

      player2spinner.applyAngularImpulse(amount * dt_seconds);
    } else {
      if (winner === 2) return;
      bowlGravity(player2spinner, dt);
      const decay = spinDecay(angularVelocity2, dt);
      if (decay > 0) {
        angularVelocity2 = decay;
      }
      player2spinner.setAngularVelocity(angularVelocity2);
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

    const player1power = Math.abs(player1spinner.getAngularVelocity());
    const player2power = Math.abs(player2spinner.getAngularVelocity());

    if (hasPlayer1Launched && hasPlayer2Launched) {
      if (!winner) {
        if (player1power <= 0.1) {
          winner = 2;
        } else if (player2power <= 0.1) {
          winner = 1;
        }
      }

      if (winner) {
        topTextDisplay.textContent = `PLAYER ${winner} WINS!!!`;

        if (winner === 1) {
          const amount =
            (Math.abs(PLAYER_1_SPINNER.SPINNER.step_delta) /
              PLAYER_1_SPINNER.SPINNER.step_resolution) *
            SPEED;

          player1spinner.applyAngularImpulse(amount * dt_seconds);
        } else if (winner === 2) {
          const amount =
            (Math.abs(PLAYER_2_SPINNER.SPINNER.step_delta) /
              PLAYER_2_SPINNER.SPINNER.step_resolution) *
            SPEED;

          player2spinner.applyAngularImpulse(amount * dt_seconds);
        }
      }
    }

    if (player1PowerBar) {
      player1PowerBar.style = `height: ${Math.min(150, player1power)}px;`;
    }
    if (player2PowerBar) {
      player2PowerBar!.style = `height: ${Math.min(150, player2power)}px;`;
    }
  }

  requestAnimationFrame(update);
}

update(performance.now());
