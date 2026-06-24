import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FACE_COLORS, LAYER, SPACING } from "../domain/three-by-three-constants.js";

export class ThreeByThreeCubeView {
  constructor({ viewerEl, onStickerClick }) {
    this.viewerEl = viewerEl;
    this.onStickerClick = onStickerClick;
    this.lightTime = 0;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#f2efe6");

    this.camera = new THREE.PerspectiveCamera(45, viewerEl.clientWidth / viewerEl.clientHeight, 0.1, 100);
    this.camera.position.set(7, 6, 8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(viewerEl.clientWidth, viewerEl.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    viewerEl.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 15;

    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.cubies = [];
    this.stickerMeshes = [];
    this.stickerByKey = new Map();

    this.bodyGeo = new THREE.BoxGeometry(0.95, 0.95, 0.95);
    this.bodyMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 });
    this.stickerGeo = new THREE.PlaneGeometry(0.78, 0.78);

    this.setupLights();
    this.buildSolvedCube();
    this.bindEvents();
    this.animate();
  }

  setupLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const lightB = new THREE.DirectionalLight(0xffffff, 1.0);
    lightB.position.set(5, 8, 5);
    this.scene.add(lightB);

    const tealLight = new THREE.DirectionalLight(0x0ea5e9, 1.5);
    tealLight.position.set(-6, 3, -6);
    this.scene.add(tealLight);

    const goldLight = new THREE.DirectionalLight(0xf59e0b, 1.0);
    goldLight.position.set(6, -2, 6);
    this.scene.add(goldLight);

    this.movingLight = new THREE.PointLight(0xffffff, 25, 50);
    this.movingLight.position.set(4, 4, 4);
    this.scene.add(this.movingLight);
  }

  bindEvents() {
    this.renderer.domElement.addEventListener("pointerdown", (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const hits = this.raycaster.intersectObjects(this.stickerMeshes, false);
      if (!hits.length) return;

      const sticker = hits[0].object;
      this.onStickerClick?.(sticker.userData.key);
    });

    window.addEventListener("resize", () => {
      this.camera.aspect = this.viewerEl.clientWidth / this.viewerEl.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.viewerEl.clientWidth, this.viewerEl.clientHeight);
    });
  }

  buildSolvedCube() {
    for (let x = -1; x <= 1; x += 1) {
      for (let y = -1; y <= 1; y += 1) {
        for (let z = -1; z <= 1; z += 1) {
          const group = new THREE.Group();
          group.position.set(x * SPACING, y * SPACING, z * SPACING);
          group.userData.defaultPos = group.position.clone();
          group.add(new THREE.Mesh(this.bodyGeo, this.bodyMat));

          if (z === 1) this.addSticker(group, "F", x, y, z);
          if (z === -1) this.addSticker(group, "B", x, y, z);
          if (y === 1) this.addSticker(group, "U", x, y, z);
          if (y === -1) this.addSticker(group, "D", x, y, z);
          if (x === 1) this.addSticker(group, "R", x, y, z);
          if (x === -1) this.addSticker(group, "L", x, y, z);

          this.cubies.push(group);
          this.root.add(group);
        }
      }
    }
  }

  addSticker(group, face, x, y, z) {
    const sticker = new THREE.Mesh(
      this.stickerGeo,
      new THREE.MeshStandardMaterial({ color: FACE_COLORS[face], roughness: 0.55 })
    );

    if (face === "F") sticker.position.set(0, 0, 0.49);
    else if (face === "B") {
      sticker.position.set(0, 0, -0.49);
      sticker.rotation.y = Math.PI;
    } else if (face === "U") {
      sticker.position.set(0, 0.49, 0);
      sticker.rotation.x = -Math.PI / 2;
    } else if (face === "D") {
      sticker.position.set(0, -0.49, 0);
      sticker.rotation.x = Math.PI / 2;
    } else if (face === "R") {
      sticker.position.set(0.49, 0, 0);
      sticker.rotation.y = Math.PI / 2;
    } else if (face === "L") {
      sticker.position.set(-0.49, 0, 0);
      sticker.rotation.y = -Math.PI / 2;
    }

    const key = `${x},${y},${z}_${face}`;
    sticker.userData.key = key;
    sticker.userData.face = face;
    group.add(sticker);
    this.stickerMeshes.push(sticker);
    this.stickerByKey.set(key, sticker);
  }

  setStickerFace(key, face) {
    const sticker = this.stickerByKey.get(key);
    if (!sticker) return;
    sticker.material.color.set(face ? FACE_COLORS[face] : "#2f2f2f");
  }

  setStickerState(stickerState) {
    for (const [key, sticker] of this.stickerByKey.entries()) {
      const face = stickerState.get(key);
      sticker.material.color.set(face ? FACE_COLORS[face] : "#2f2f2f");
    }
  }

  resetToSolved() {
    for (const cubie of this.cubies) {
      cubie.position.copy(cubie.userData.defaultPos);
      cubie.rotation.set(0, 0, 0);
      cubie.quaternion.set(0, 0, 0, 1);
    }
    for (const sticker of this.stickerMeshes) {
      const face = sticker.userData.face;
      sticker.material.color.set(FACE_COLORS[face]);
    }
  }

  moveSpec(move) {
    const face = move[0];
    let turns = 1;
    if (move.endsWith("2")) turns = 2;
    else if (move.endsWith("'")) turns = -1;

    const spec = {
      U: { axis: "y", layer: LAYER, angle: -Math.PI / 2 },
      D: { axis: "y", layer: -LAYER, angle: Math.PI / 2 },
      R: { axis: "x", layer: LAYER, angle: -Math.PI / 2 },
      L: { axis: "x", layer: -LAYER, angle: Math.PI / 2 },
      F: { axis: "z", layer: LAYER, angle: -Math.PI / 2 },
      B: { axis: "z", layer: -LAYER, angle: Math.PI / 2 }
    }[face];

    return { ...spec, angle: spec.angle * turns };
  }

  layerCubies(axis, layer) {
    const target = layer * SPACING;
    return this.cubies.filter((cubie) => Math.abs(cubie.position[axis] - target) < 0.1);
  }

  applyMoveImmediate(move) {
    const spec = this.moveSpec(move);
    const layer = this.layerCubies(spec.axis, spec.layer);
    const pivot = new THREE.Group();
    this.root.add(pivot);
    layer.forEach((cubie) => pivot.attach(cubie));
    pivot.rotation[spec.axis] = spec.angle;
    layer.forEach((cubie) => this.root.attach(cubie));
    this.root.remove(pivot);
    this.snapCubies(layer);
  }

  async animateMove(move, durationMs) {
    const spec = this.moveSpec(move);
    const layer = this.layerCubies(spec.axis, spec.layer);
    const pivot = new THREE.Group();
    this.root.add(pivot);
    layer.forEach((cubie) => pivot.attach(cubie));

    await new Promise((resolve) => {
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / durationMs);
        const eased = 1 - Math.pow(1 - p, 3);
        pivot.rotation[spec.axis] = spec.angle * eased;

        if (p < 1) {
          requestAnimationFrame(tick);
          return;
        }

        layer.forEach((cubie) => this.root.attach(cubie));
        this.root.remove(pivot);
        this.snapCubies(layer);
        resolve();
      };
      requestAnimationFrame(tick);
    });
  }

  snapCubies(layer) {
    for (const cubie of layer) {
      cubie.position.x = this.snap(cubie.position.x);
      cubie.position.y = this.snap(cubie.position.y);
      cubie.position.z = this.snap(cubie.position.z);
      cubie.quaternion.normalize();
    }
  }

  snap(v) {
    return Math.round(v / SPACING) * SPACING;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.lightTime += 0.015;
    this.movingLight.position.x = 4.5 * Math.sin(this.lightTime);
    this.movingLight.position.z = 4.5 * Math.cos(this.lightTime);
    this.movingLight.position.y = 3.5 + Math.sin(this.lightTime * 0.5) * 1.5;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

