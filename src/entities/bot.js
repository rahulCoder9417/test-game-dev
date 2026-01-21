import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export function createBot(scene) {
  const group = new THREE.Group();
  scene.add(group);

  let health = 100;
  let model = null;

  const loader = new GLTFLoader();
  loader.load("/model/enemy.glb", (gltf) => {
    model = gltf.scene;
    model.scale.set(1, 1, 1);
    group.add(model);
  });

  group.position.set(5, 0, 0);

  function update(player) {
    if (health <= 0) return;

    const direction = new THREE.Vector3()
      .subVectors(player.mesh.position, group.position)
      .normalize();

    group.position.add(direction.multiplyScalar(0.03));
  }

  return { mesh: group, update };
}
