import { initScene } from "./core/scene";
import { initInput } from "./core/input";
import { startLoop } from "./core/loop";
import { createPlayer } from "./entities/player";
import { createBot } from "./entities/bot";
import { createArena } from "./world/arena";

const { scene, camera, renderer } = initScene();

initInput();

createArena(scene);

const player = createPlayer(scene);
const bot = createBot(scene);

startLoop({ scene, camera, renderer, player, bot });
