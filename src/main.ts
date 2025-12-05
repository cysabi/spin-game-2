import { World } from "planck";
import "./style.css";
import { PLAYER_1, SYSTEM } from "@rcade/plugin-input-classic";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <h1>cysabi-rcade</h1>
  <p id="status">Press 1P START</p>
  <div id="controls"></div>
`;

const status = document.querySelector<HTMLParagraphElement>("#status")!;
const controls = document.querySelector<HTMLDivElement>("#controls")!;

let gameStarted = false;

let world = new World({
    gravity: { x: 0, y: -10 },
});

let platform = world.createBody({
    type: "static",
    position: { x: 0, y: -10 },
    angle: Math.PI * 0.1,
});
platform.createFixture({
    shape: new Edge({ x: -50, y: 0 }, { x: +50, y: 0 }),
});
let body = world.createBody({
    type: "dynamic",
    position: { x: 0, y: 4 },
});
body.createFixture({
    shape: new Box(1.0, 1.0),
    density: 1.0,
    friction: 0.3,
});

let previousTimestamp: number | null = null;
function update(timestamp: number) {
    if (previousTimestamp) {
        const dt = timestamp - previousTimestamp;
        world.step(dt);
        previousTimestamp = timestamp;
    }
    if (!gameStarted) {
        if (SYSTEM.ONE_PLAYER) {
            gameStarted = true;
            status.textContent = "Game Started!";
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
