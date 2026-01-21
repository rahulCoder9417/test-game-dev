import * as THREE from "three";

export function createArena(scene) {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({ color: 0x242937 })
  );
  ground.rotation.x = -Math.PI / 2;

  scene.add(ground);
}
