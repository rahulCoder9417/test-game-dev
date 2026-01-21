import { mouseDelta } from "./input";
import * as THREE from "three";

let cameraYaw = 0;

export function startLoop({ scene, camera, renderer, player, bot }) {
  function animate() {
    requestAnimationFrame(animate);

    cameraYaw -= mouseDelta.x * 0.002;

    player.update(cameraYaw);
    bot.update(player);

    const offset = new THREE.Vector3(
      Math.sin(cameraYaw) * 8,
      4,
      Math.cos(cameraYaw) * 8
    );

    camera.position.copy(player.mesh.position).add(offset);
    camera.lookAt(player.mesh.position);

    renderer.render(scene, camera);
  }

  animate();
}
