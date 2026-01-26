import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

class Weapon {
  constructor(name, damage, cooldown, range) {
    this.name = name;
    this.damage = damage;
    this.cooldown = cooldown;
    this.range = range;
    this.lastAttackTime = 0;
  }

  canAttack(currentTime) {
    return currentTime - this.lastAttackTime >= this.cooldown;
  }

  attack(attacker, target, currentTime) {
    if (!this.canAttack(currentTime)) {
      return { hit: false, reason: 'cooldown' };
    }

    const distance = attacker.position.distanceTo(target.position);
    
    if (distance > this.range) {
      return { hit: false, reason: 'out_of_range', distance };
    }

    this.lastAttackTime = currentTime;
    const actualDamage = target.takeDamage(this.damage);
    
    console.log(`[${attacker.name}] attacked [${target.name}] with ${this.name} for ${actualDamage} damage!`);
    
    return { hit: true, damage: actualDamage };
  }
}

class FistWeapon extends Weapon {
  constructor() {
    super('Fist', 5, 500, 2.5);
  }
}

class SwordWeapon extends Weapon {
  constructor() {
    super('Sword', 15, 1200, 3.5);
  }
}

class Entity {
  constructor(name, maxHealth, scene) {
    this.name = name;
    this.maxHealth = maxHealth;
    this.health = maxHealth;
    this.scene = scene;
    this.isAlive = true;
    this.position = new THREE.Vector3();
    this.mesh = null;
  }

  takeDamage(amount) {
    if (!this.isAlive) return 0;
    
    const actualDamage = Math.min(amount, this.health);
    this.health -= actualDamage;
    
    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
    
    this.updateHealthBar();
    return actualDamage;
  }

  die() {
    this.isAlive = false;
    console.log(`💀 [${this.name}] has been defeated!`);
  }

  updateHealthBar() {
    if (this.healthBarFill) {
      const healthPercent = this.health / this.maxHealth;
      this.healthBarFill.scale.x = healthPercent;
      
      if (healthPercent > 0.5) {
        this.healthBarFill.material.color.setHex(0x00ff00);
      } else if (healthPercent > 0.25) {
        this.healthBarFill.material.color.setHex(0xffff00);
      } else {
        this.healthBarFill.material.color.setHex(0xff0000);
      }
    }
  }

  createHealthBar() {
    const bgGeo = new THREE.PlaneGeometry(2, 0.2);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const bg = new THREE.Mesh(bgGeo, bgMat);
    
    const fillGeo = new THREE.PlaneGeometry(2, 0.15);
    const fillMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.healthBarFill = new THREE.Mesh(fillGeo, fillMat);
    this.healthBarFill.position.z = 0.01;
    
    const healthBar = new THREE.Group();
    healthBar.add(bg);
    healthBar.add(this.healthBarFill);
    healthBar.position.y = 3;
    healthBar.lookAt(0, 3, 100);
    
    this.mesh.add(healthBar);
  }
}

class Player extends Entity {
  constructor(scene) {
    super('Player', 100, scene);
    
    this.weapons = {
      fist: new FistWeapon(),
      sword: new SwordWeapon()
    };
    this.currentWeapon = this.weapons.fist;
    this.weaponMesh = null;
    
    this.rightHand = null;
    this.rightArmGroup = null;
    this.rightForearmGroup = null;
    this.leftArmGroup = null;
    this.leftForearmGroup = null;
    this.leftLegGroup = null;
    this.leftShinGroup = null;
    this.rightLegGroup = null;
    this.rightShinGroup = null;
    this.headGroup = null;
    this.torso = null;
    
    this.moveSpeed = 8;
    this.rotationSpeed = 8;
    this.targetRotation = 0;
    this.isMovingForward = true;
    this.walkCycle = 0;
    
    this.isAttacking = false;
    this.attackTime = 0;
    this.attackDuration = 300;
    
    this.createMesh();
    this.createHealthBar();
  }

  createMesh() {
    this.mesh = new THREE.Group();
    const s = 1.5;
    
    const torsoGeo = new THREE.BoxGeometry(0.9 * s, 1.0 * s, 0.5 * s);
    const torsoMat = new THREE.MeshPhongMaterial({ color: 0x3366ff });
    this.torso = new THREE.Mesh(torsoGeo, torsoMat);
    this.torso.position.y = 0.5 * s;
    this.torso.castShadow = true;
    this.mesh.add(this.torso);
    
    const chestGeo = new THREE.BoxGeometry(0.85 * s, 0.6 * s, 0.52 * s);
    const chest = new THREE.Mesh(chestGeo, new THREE.MeshPhongMaterial({ color: 0x4477ff }));
    chest.position.set(0, 0.7 * s, 0);
    this.mesh.add(chest);
    
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 1.3 * s;
    this.mesh.add(this.headGroup);
    
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15 * s, 0.18 * s, 0.3 * s, 8),
      new THREE.MeshPhongMaterial({ color: 0xffcc99 })
    );
    neck.position.y = 0.15 * s;
    this.headGroup.add(neck);
    
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.35 * s, 16, 16),
      new THREE.MeshPhongMaterial({ color: 0xffcc99 })
    );
    head.position.y = 0.5 * s;
    head.castShadow = true;
    this.headGroup.add(head);
    
    const eyeGeo = new THREE.SphereGeometry(0.06 * s, 8, 8);
    const eyeWhiteGeo = new THREE.SphereGeometry(0.08 * s, 8, 8);
    const eyeWhiteMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const eyeMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
    
    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    leftEyeWhite.position.set(-0.12 * s, 0.55 * s, 0.28 * s);
    this.headGroup.add(leftEyeWhite);
    
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.12 * s, 0.55 * s, 0.32 * s);
    this.headGroup.add(leftEye);
    
    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    rightEyeWhite.position.set(0.12 * s, 0.55 * s, 0.28 * s);
    this.headGroup.add(rightEyeWhite);
    
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.12 * s, 0.55 * s, 0.32 * s);
    this.headGroup.add(rightEye);
    
    const shoulderGeo = new THREE.SphereGeometry(0.22 * s, 8, 8);
    const shoulderMat = new THREE.MeshPhongMaterial({ color: 0x2255cc });
    
    const leftShoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
    leftShoulder.position.set(-0.55 * s, 0.9 * s, 0);
    this.mesh.add(leftShoulder);
    
    const rightShoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
    rightShoulder.position.set(0.55 * s, 0.9 * s, 0);
    this.mesh.add(rightShoulder);
    
    const armMat = new THREE.MeshPhongMaterial({ color: 0xffcc99 });
    const handGeo = new THREE.BoxGeometry(0.15 * s, 0.22 * s, 0.12 * s);
    
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.55 * s, 0.9 * s, 0);
    this.mesh.add(this.leftArmGroup);
    
    const leftUpperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12 * s, 0.1 * s, 0.6 * s, 8),
      armMat
    );
    leftUpperArm.position.y = -0.3 * s;
    this.leftArmGroup.add(leftUpperArm);
    
    this.leftForearmGroup = new THREE.Group();
    this.leftForearmGroup.position.y = -0.6 * s;
    this.leftArmGroup.add(this.leftForearmGroup);
    
    const leftForearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1 * s, 0.09 * s, 0.5 * s, 8),
      armMat
    );
    leftForearm.position.y = -0.25 * s;
    this.leftForearmGroup.add(leftForearm);
    
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.55 * s, 0.9 * s, 0);
    this.mesh.add(this.rightArmGroup);
    
    const rightUpperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12 * s, 0.1 * s, 0.6 * s, 8),
      armMat
    );
    rightUpperArm.position.y = -0.3 * s;
    this.rightArmGroup.add(rightUpperArm);
    
    this.rightForearmGroup = new THREE.Group();
    this.rightForearmGroup.position.y = -0.6 * s;
    this.rightArmGroup.add(this.rightForearmGroup);
    
    const rightForearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1 * s, 0.09 * s, 0.5 * s, 8),
      armMat
    );
    rightForearm.position.y = -0.25 * s;
    this.rightForearmGroup.add(rightForearm);
    
    this.rightHand = new THREE.Mesh(handGeo, armMat);
    this.rightHand.position.y = -0.55 * s;
    this.rightForearmGroup.add(this.rightHand);
    
    const hip = new THREE.Mesh(
      new THREE.BoxGeometry(0.85 * s, 0.3 * s, 0.45 * s),
      new THREE.MeshPhongMaterial({ color: 0x2244aa })
    );
    hip.position.y = -0.15 * s;
    this.mesh.add(hip);
    
    const legMat = new THREE.MeshPhongMaterial({ color: 0x2244aa });
    const footMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.25 * s, -0.3 * s, 0);
    this.mesh.add(this.leftLegGroup);
    
    const leftThigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15 * s, 0.13 * s, 0.7 * s, 8),
      legMat
    );
    leftThigh.position.y = -0.35 * s;
    this.leftLegGroup.add(leftThigh);
    
    this.leftShinGroup = new THREE.Group();
    this.leftShinGroup.position.y = -0.7 * s;
    this.leftLegGroup.add(this.leftShinGroup);
    
    const leftShin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12 * s, 0.11 * s, 0.7 * s, 8),
      legMat
    );
    leftShin.position.y = -0.35 * s;
    this.leftShinGroup.add(leftShin);
    
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.25 * s, -0.3 * s, 0);
    this.mesh.add(this.rightLegGroup);
    
    const rightThigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15 * s, 0.13 * s, 0.7 * s, 8),
      legMat
    );
    rightThigh.position.y = -0.35 * s;
    rightThigh.castShadow = true;
    this.rightLegGroup.add(rightThigh);
    
    this.rightShinGroup = new THREE.Group();
    this.rightShinGroup.position.y = -0.7 * s;
    this.rightLegGroup.add(this.rightShinGroup);
    
    const rightShin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12 * s, 0.11 * s, 0.7 * s, 8),
      legMat
    );
    rightShin.position.y = -0.35 * s;
    rightShin.castShadow = true;
    this.rightShinGroup.add(rightShin);
    
    const rightFoot = new THREE.Mesh(
      new THREE.BoxGeometry(0.22 * s, 0.12 * s, 0.4 * s),
      footMat
    );
    rightFoot.position.set(0, -0.8 * s, 0.1 * s);
    rightFoot.castShadow = true;
    this.rightShinGroup.add(rightFoot);
    
    this.mesh.position.set(3, 1.7 * s, 0);
    this.scene.add(this.mesh);
    this.position.copy(this.mesh.position);
    this.updateWeaponVisual();
  }

  switchWeapon(weaponName) {
    if (this.weapons[weaponName]) {
      this.currentWeapon = this.weapons[weaponName];
      console.log(`⚔️ Switched to ${this.currentWeapon.name}`);
      this.updateWeaponVisual();
    }
  }

  updateWeaponVisual() {
    if (this.weaponMesh) {
      this.rightHand.remove(this.weaponMesh);
    }

    if (this.currentWeapon.name === 'Sword') {
      const swordGroup = new THREE.Group();
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 1.5, 0.05),
        new THREE.MeshPhongMaterial({ color: 0xc0c0c0, shininess: 100 })
      );
      blade.position.y = -0.85;
      swordGroup.add(blade);
      
      this.weaponMesh = swordGroup;
    } else {
      this.weaponMesh = new THREE.Group();
    }

    this.rightHand.add(this.weaponMesh);
  }

  attack(target, currentTime) {
    const result = this.currentWeapon.attack(this, target, currentTime);
    
    if (result.hit && this.currentWeapon.name === 'Fist') {
      this.isAttacking = true;
      this.attackTime = currentTime;
    }
    
    return result;
  }

  updateAttackAnimation(currentTime) {
    if (!this.isAttacking) return;
    
    const progress = (currentTime - this.attackTime) / this.attackDuration;
    
    if (progress >= 1.0) {
      this.isAttacking = false;
      this.rightArmGroup.rotation.x = 0;
      this.rightArmGroup.rotation.z = 0;
      this.torso.rotation.z = 0;
      return;
    }
    
    if (progress < 0.2) {
      const p = progress / 0.2;
      this.rightArmGroup.rotation.x = -0.3 * p;
      this.rightArmGroup.rotation.z = -0.4 * p;
      this.torso.rotation.z = -0.1 * p;
    } else if (progress < 0.5) {
      const p = (progress - 0.2) / 0.3;
      const e = 1 - Math.pow(1 - p, 3);
      this.rightArmGroup.rotation.x = -0.3 + (1.2 * e);
      this.rightArmGroup.rotation.z = -0.4 + (0.6 * e);
      this.torso.rotation.z = -0.1 + (0.2 * e);
    } else {
      const p = (progress - 0.5) / 0.5;
      const e = Math.pow(p, 2);
      this.rightArmGroup.rotation.x = 0.9 * (1 - e);
      this.rightArmGroup.rotation.z = 0.2 * (1 - e);
      this.torso.rotation.z = 0.1 * (1 - e);
    }
  }

  move(direction, deltaTime) {
    const movement = direction.clone().multiplyScalar(this.moveSpeed * deltaTime);
    this.mesh.position.add(movement);
    
    if (this.isMovingForward && movement.length() > 0) {
      this.targetRotation = Math.atan2(movement.x, movement.z);
      let diff = this.targetRotation - this.mesh.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.mesh.rotation.y += diff * this.rotationSpeed * deltaTime;
    }
    
    this.animateWalk(deltaTime);
  }

  animateWalk(deltaTime) {
    if (this.isAttacking) return;
    
    this.walkCycle += deltaTime * 12;
    const swing = Math.sin(this.walkCycle) * 0.5;
    const swingAlt = -swing;
    
    this.leftArmGroup.rotation.x = swingAlt * 0.8;
    this.rightArmGroup.rotation.x = swing * 0.8;
    this.leftForearmGroup.rotation.x = Math.max(0, -swingAlt * 0.6);
    this.rightForearmGroup.rotation.x = Math.max(0, -swing * 0.6);
    
    this.leftLegGroup.rotation.x = swing * 0.7;
    this.rightLegGroup.rotation.x = swingAlt * 0.7;
    this.leftShinGroup.rotation.x = Math.max(0, -swing * 0.9);
    this.rightShinGroup.rotation.x = Math.max(0, -swingAlt * 0.9);
    
    this.torso.position.y = 0.75 + Math.abs(Math.sin(this.walkCycle * 2)) * 0.08;
  }

  stopWalkAnimation() {
    if (this.isAttacking) return;
    this.leftArmGroup.rotation.x *= 0.85;
    this.rightArmGroup.rotation.x *= 0.85;
    this.leftLegGroup.rotation.x *= 0.85;
    this.rightLegGroup.rotation.x *= 0.85;
    this.torso.position.y = 0.75;
  }

  update(deltaTime, currentTime) {
    this.position.copy(this.mesh.position);
    if (this.isAttacking) this.updateAttackAnimation(currentTime);
  }
}

class Bot extends Entity {
  constructor(scene) {
    super('Bot', 100, scene);
    this.weapon = new FistWeapon();
    this.moveSpeed = 2;
    this.walkCycle = 0;
    this.lastDecisionTime = 0;
    this.attackCooldown = 1500;
    this.createMesh();
    this.createHealthBar();
  }

  createMesh() {
    this.mesh = new THREE.Group();
    const s = 1.5;
    
    this.torsoMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.9 * s, 1.0 * s, 0.5 * s),
      new THREE.MeshPhongMaterial({ color: 0xff3333 })
    );
    this.torsoMesh.position.y = 0.5 * s;
    this.torsoMesh.castShadow = true;
    this.mesh.add(this.torsoMesh);
    
    const chestGeo = new THREE.BoxGeometry(0.85 * s, 0.6 * s, 0.52 * s);
    const chest = new THREE.Mesh(chestGeo, new THREE.MeshPhongMaterial({ color: 0xff4444 }));
    chest.position.set(0, 0.7 * s, 0);
    this.mesh.add(chest);
    
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.3 * s;
    this.mesh.add(headGroup);
    
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15 * s, 0.18 * s, 0.3 * s, 8),
      new THREE.MeshPhongMaterial({ color: 0xffcc99 })
    );
    neck.position.y = 0.15 * s;
    headGroup.add(neck);
    
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.35 * s, 16, 16),
      new THREE.MeshPhongMaterial({ color: 0xffcc99 })
    );
    head.position.y = 0.5 * s;
    head.castShadow = true;
    headGroup.add(head);
    
    const eyeGeo = new THREE.SphereGeometry(0.08 * s, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000, emissive: 0xff0000 });
    
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.12 * s, 0.55 * s, 0.32 * s);
    headGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.12 * s, 0.55 * s, 0.32 * s);
    headGroup.add(rightEye);
    
    const shoulderMat = new THREE.MeshPhongMaterial({ color: 0xcc2222 });
    const leftShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.22 * s, 8, 8), shoulderMat);
    leftShoulder.position.set(-0.55 * s, 0.9 * s, 0);
    leftShoulder.castShadow = true;
    this.mesh.add(leftShoulder);
    
    const rightShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.22 * s, 8, 8), shoulderMat);
    rightShoulder.position.set(0.55 * s, 0.9 * s, 0);
    rightShoulder.castShadow = true;
    this.mesh.add(rightShoulder);
    
    const armMat = new THREE.MeshPhongMaterial({ color: 0xffcc99 });
    
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.55 * s, 0.9 * s, 0);
    this.mesh.add(this.leftArmGroup);
    
    const leftUpperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12 * s, 0.1 * s, 0.6 * s, 8),
      armMat
    );
    leftUpperArm.position.y = -0.3 * s;
    leftUpperArm.castShadow = true;
    this.leftArmGroup.add(leftUpperArm);
    
    this.leftForearmGroup = new THREE.Group();
    this.leftForearmGroup.position.y = -0.6 * s;
    this.leftArmGroup.add(this.leftForearmGroup);
    
    const leftForearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1 * s, 0.09 * s, 0.5 * s, 8),
      armMat
    );
    leftForearm.position.y = -0.25 * s;
    leftForearm.castShadow = true;
    this.leftForearmGroup.add(leftForearm);
    
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.55 * s, 0.9 * s, 0);
    this.mesh.add(this.rightArmGroup);
    
    const rightUpperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12 * s, 0.1 * s, 0.6 * s, 8),
      armMat
    );
    rightUpperArm.position.y = -0.3 * s;
    rightUpperArm.castShadow = true;
    this.rightArmGroup.add(rightUpperArm);
    
    this.rightForearmGroup = new THREE.Group();
    this.rightForearmGroup.position.y = -0.6 * s;
    this.rightArmGroup.add(this.rightForearmGroup);
    
    const rightForearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1 * s, 0.09 * s, 0.5 * s, 8),
      armMat
    );
    rightForearm.position.y = -0.25 * s;
    rightForearm.castShadow = true;
    this.rightForearmGroup.add(rightForearm);
    
    const hip = new THREE.Mesh(
      new THREE.BoxGeometry(0.85 * s, 0.3 * s, 0.45 * s),
      new THREE.MeshPhongMaterial({ color: 0xaa2222 })
    );
    hip.position.y = -0.15 * s;
    hip.castShadow = true;
    this.mesh.add(hip);
    
    const legMat = new THREE.MeshPhongMaterial({ color: 0xaa2222 });
    
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.25 * s, -0.3 * s, 0);
    this.mesh.add(this.leftLegGroup);
    
    const leftThigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15 * s, 0.13 * s, 0.7 * s, 8),
      legMat
    );
    leftThigh.position.y = -0.35 * s;
    leftThigh.castShadow = true;
    this.leftLegGroup.add(leftThigh);
    
    this.leftShinGroup = new THREE.Group();
    this.leftShinGroup.position.y = -0.7 * s;
    this.leftLegGroup.add(this.leftShinGroup);
    
    const leftShin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12 * s, 0.11 * s, 0.7 * s, 8),
      legMat
    );
    leftShin.position.y = -0.35 * s;
    leftShin.castShadow = true;
    this.leftShinGroup.add(leftShin);
    
    const footMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    const leftFoot = new THREE.Mesh(
      new THREE.BoxGeometry(0.22 * s, 0.12 * s, 0.4 * s),
      footMat
    );
    leftFoot.position.set(0, -0.8 * s, 0.1 * s);
    leftFoot.castShadow = true;
    this.leftShinGroup.add(leftFoot);
    
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.25 * s, -0.3 * s, 0);
    this.mesh.add(this.rightLegGroup);
    
    const rightThigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15 * s, 0.13 * s, 0.7 * s, 8),
      legMat
    );
    rightThigh.position.y = -0.35 * s;
    this.rightLegGroup.add(rightThigh);
    
    this.rightShinGroup = new THREE.Group();
    this.rightShinGroup.position.y = -0.7 * s;
    this.rightLegGroup.add(this.rightShinGroup);
    
    const rightShin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12 * s, 0.11 * s, 0.7 * s, 8),
      legMat
    );
    rightShin.position.y = -0.35 * s;
    this.rightShinGroup.add(rightShin);
    
    const rightFoot = new THREE.Mesh(
      new THREE.BoxGeometry(0.22 * s, 0.12 * s, 0.4 * s),
      footMat
    );
    rightFoot.position.set(0, -0.8 * s, 0.1 * s);
    this.rightShinGroup.add(rightFoot);
    
    this.mesh.position.set(-5, 1.7 * s, 0);
    this.scene.add(this.mesh);
    this.position.copy(this.mesh.position);
  }

  makeDecision(target, currentTime, deltaTime) {
    if (!this.isAlive || !target.isAlive) return;

    const distance = this.position.distanceTo(target.position);
    const dir = new THREE.Vector3().subVectors(target.position, this.position).normalize();
    
    this.mesh.rotation.y = Math.atan2(dir.x, dir.z);

    if (distance > 2) {
      this.mesh.position.addScaledVector(dir, this.moveSpeed * deltaTime);
      this.position.copy(this.mesh.position);
      this.animateWalk(deltaTime);
    } else {
      this.stopWalkAnimation();
    }

    if (currentTime - this.lastDecisionTime >= this.attackCooldown && distance <= this.weapon.range) {
      this.lastDecisionTime = currentTime;
      this.weapon.attack(this, target, currentTime);
    }
  }

  animateWalk(deltaTime) {
    this.walkCycle += deltaTime * 12;
    const swing = Math.sin(this.walkCycle) * 0.5;
    this.leftArmGroup.rotation.x = swing;
    this.rightArmGroup.rotation.x = -swing;
    this.leftLegGroup.rotation.x = -swing * 0.7;
    this.rightLegGroup.rotation.x = swing * 0.7;
    this.torsoMesh.position.y = 0.75 + Math.abs(Math.sin(this.walkCycle * 2)) * 0.08;
  }

  stopWalkAnimation() {
    this.leftArmGroup.rotation.x *= 0.85;
    this.rightArmGroup.rotation.x *= 0.85;
    this.leftLegGroup.rotation.x *= 0.85;
    this.rightLegGroup.rotation.x *= 0.85;
    this.torsoMesh.position.y = 0.75;
  }

  update(deltaTime, target, currentTime) {
    this.makeDecision(target, currentTime, deltaTime);
  }
}

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    
    this.player = null;
    this.bot = null;
    this.clock = new THREE.Clock();
    this.gameOver = false;
    this.keys = { w: false, a: false, s: false, d: false };
    
    this.cameraDistance = 6;
    this.cameraHeight = 4;
    this.currentCameraPosition = new THREE.Vector3();
    this.currentLookAtPosition = new THREE.Vector3();
    
    this.cameraRotationY = 0;
    this.cameraRotationX = 0.3;
    this.mouseSensitivityX = 0.002;
    this.mouseSensitivityY = 0.002;
    this.isPointerLocked = false;
    
    this.minCameraAngleX = -0.3;
    this.maxCameraAngleX = 1.2;
    
    this.setupScene();
    this.setupEntities();
    this.setupInput();
    this.animate();
  }

  setSensitivity(valueX, valueY) {
    this.mouseSensitivityX = valueX;
    this.mouseSensitivityY = valueY;
  }

  setupScene() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    this.scene.add(dirLight);
    
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshPhongMaterial({ color: 0x7d5a3a })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.add(new THREE.GridHelper(50, 50));
  }

  setupEntities() {
    this.player = new Player(this.scene);
    this.bot = new Bot(this.scene);
    console.log('⚔️ MEDIEVAL COMBAT INITIALIZED');
  }

  setupInput() {
    this.canvas.addEventListener('click', () => {
      this.canvas.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.canvas;
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked) return;
      this.cameraRotationY -= e.movementX * this.mouseSensitivityX;
      this.cameraRotationX -= e.movementY * this.mouseSensitivityY;
      this.cameraRotationX = Math.max(this.minCameraAngleX, Math.min(this.maxCameraAngleX, this.cameraRotationX));
    });

    window.addEventListener('keydown', (e) => {
      if (this.gameOver) return;
      const k = e.key.toLowerCase();
      if (k === 'w') this.keys.w = true;
      if (k === 'a') this.keys.a = true;
      if (k === 's') this.keys.s = true;
      if (k === 'd') this.keys.d = true;
      if (k === ' ') {
        e.preventDefault();
        const result = this.player.attack(this.bot, performance.now());
        if (result.hit) this.checkGameOver();
      }
      if (k === '1') this.player.switchWeapon('fist');
      if (k === '2') this.player.switchWeapon('sword');
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w') this.keys.w = false;
      if (k === 'a') this.keys.a = false;
      if (k === 's') this.keys.s = false;
      if (k === 'd') this.keys.d = false;
    });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  checkGameOver() {
    if (!this.player.isAlive) {
      this.gameOver = true;
      console.log('🏴 DEFEAT');
    } else if (!this.bot.isAlive) {
      this.gameOver = true;
      console.log('👑 VICTORY');
    }
  }

  updateCamera() {
    const playerPos = this.player.mesh.position;
    const theta = this.cameraRotationY;
    const phi = this.cameraRotationX;
    
    const camX = playerPos.x + this.cameraDistance * Math.sin(theta) * Math.cos(phi);
    const camY = playerPos.y + this.cameraDistance * Math.sin(phi) + 1.5;
    const camZ = playerPos.z + this.cameraDistance * Math.cos(theta) * Math.cos(phi);
    
    const targetCameraPos = new THREE.Vector3(camX, camY, camZ);
    
    this.currentCameraPosition.lerp(targetCameraPos, 0.2);
    this.camera.position.copy(this.currentCameraPosition);
    
    const targetLookAt = new THREE.Vector3(
      playerPos.x,
      playerPos.y + 1.5,
      playerPos.z
    );
    
    this.currentLookAtPosition.lerp(targetLookAt, 0.3);
    this.camera.lookAt(this.currentLookAtPosition);
  }

  handlePlayerMovement(deltaTime) {
    const moveDirection = new THREE.Vector3();
    const cameraYaw = this.cameraRotationY;
    
    const forward = new THREE.Vector3(
      -Math.sin(cameraYaw),
      0,
      -Math.cos(cameraYaw)
    );
    
    const right = new THREE.Vector3(
      Math.cos(cameraYaw),
      0,
      -Math.sin(cameraYaw)
    );
    
    if (this.keys.w) moveDirection.add(forward);
    if (this.keys.s) moveDirection.sub(forward);
    if (this.keys.d) moveDirection.add(right);
    if (this.keys.a) moveDirection.sub(right);
    
    if (moveDirection.length() > 0) {
      moveDirection.normalize();
      this.player.isMovingForward = true;
      this.player.move(moveDirection, deltaTime);
    } else {
      this.player.stopWalkAnimation();
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();
    const currentTime = performance.now();

    if (!this.gameOver) {
      this.handlePlayerMovement(deltaTime);
      this.player.update(deltaTime, currentTime);
      this.bot.update(deltaTime, this.player, currentTime);
      this.updateCamera();
      this.checkGameOver();
    }

    this.renderer.render(this.scene, this.camera);
  }
}

export default function MedievalCombatGame() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [sensitivityX, setSensitivityX] = useState(0.002);
  const [sensitivityY, setSensitivityY] = useState(0.002);

  useEffect(() => {
    if (canvasRef.current && !gameRef.current) {
      gameRef.current = new Game(canvasRef.current);
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.renderer.dispose();
      }
    };
  }, []);

  const handleSensitivityXChange = (e) => {
    const newValue = parseFloat(e.target.value);
    setSensitivityX(newValue);
    if (gameRef.current) {
      gameRef.current.setSensitivity(newValue, sensitivityY);
    }
  };

  const handleSensitivityYChange = (e) => {
    const newValue = parseFloat(e.target.value);
    setSensitivityY(newValue);
    if (gameRef.current) {
      gameRef.current.setSensitivity(sensitivityX, newValue);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, overflow: 'hidden' }}>
      <canvas ref={canvasRef} />
      
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '16px',
        background: 'rgba(0,0,0,0.7)',
        padding: '15px',
        borderRadius: '8px',
        userSelect: 'none'
      }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>
          ⚔️ MEDIEVAL COMBAT
        </div>
        <div style={{ marginBottom: '5px' }}>
          <strong>Controls:</strong>
        </div>
        <div>Click to lock mouse</div>
        <div>Mouse - Look around</div>
        <div>WASD - Move</div>
        <div>SPACE - Attack</div>
        <div>1 - Fist | 2 - Sword</div>
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#aaa' }}>
          Check console for combat log
        </div>
      </div>

      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '14px',
        background: 'rgba(0,0,0,0.7)',
        padding: '15px',
        borderRadius: '8px',
        minWidth: '250px'
      }}>
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            🎮 Camera Settings
          </div>
          <div style={{ marginBottom: '5px', fontSize: '12px', color: '#aaa' }}>
            Horizontal Sensitivity
          </div>
          <input
            type="range"
            min="0.0005"
            max="0.005"
            step="0.0001"
            value={sensitivityX}
            onChange={handleSensitivityXChange}
            style={{
              width: '100%',
              cursor: 'pointer'
            }}
          />
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '3px' }}>
            {sensitivityX.toFixed(4)}
          </div>
          
          <div style={{ marginTop: '12px', marginBottom: '5px', fontSize: '12px', color: '#aaa' }}>
            Vertical Sensitivity
          </div>
          <input
            type="range"
            min="0.0005"
            max="0.005"
            step="0.0001"
            value={sensitivityY}
            onChange={handleSensitivityYChange}
            style={{
              width: '100%',
              cursor: 'pointer'
            }}
          />
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '3px' }}>
            {sensitivityY.toFixed(4)}
          </div>
        </div>
        
        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #444' }}>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ color: '#3366ff', fontWeight: 'bold' }}>PLAYER</div>
            <div style={{ fontSize: '12px', color: '#aaa' }}>
              Health bars visible above
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ color: '#ff3333', fontWeight: 'bold' }}>BOT</div>
            <div style={{ fontSize: '12px', color: '#aaa' }}>
              Auto-attacks when in range
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}