import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { input } from "../core/input";

export function createPlayer(scene) {
  const group = new THREE.Group();
  scene.add(group);

  let model = null;

  /* -------- Load Character Model -------- */
  const loader = new GLTFLoader();
  loader.load("/model/player.glb", (gltf) => {
    model = gltf.scene;

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.material.side = THREE.DoubleSide;
      }
    });

    model.scale.set(2, 2, 2);
    model.position.y = 0;
    model.rotation.y = Math.PI; // face forward if model is reversed

    group.add(model);
    console.log("Player model loaded");
  });

  /* -------- Update Loop -------- */
  function update(cameraYaw) {
    const speed = 0.1;

    // Rotate player to match camera direction
    group.rotation.y = cameraYaw;

    // Forward direction (camera-relative)
    const forward = new THREE.Vector3(
      Math.sin(cameraYaw),
      0,
      Math.cos(cameraYaw)
    );

    // Right direction (camera-relative)
    const right = new THREE.Vector3(
      Math.cos(cameraYaw),
      0,
      -Math.sin(cameraYaw)
    );

    if (input.keys["KeyW"])
      group.position.add(forward.clone().multiplyScalar(-speed));
    if (input.keys["KeyS"])
      group.position.add(forward.clone().multiplyScalar(speed));
    if (input.keys["KeyA"])
      group.position.add(right.clone().multiplyScalar(-speed));
    if (input.keys["KeyD"])
      group.position.add(right.clone().multiplyScalar(speed));

    if (input.mouseClicked) {
      input.mouseClicked = false;
      // attack logic next
    }
  }

  return { mesh: group, update };
}
