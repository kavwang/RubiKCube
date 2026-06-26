import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FACE_STYLE, LAYER_COORD, MOVE_FACE } from "../config/two-by-two-constants.js";

const CUBE_COORDS = {
  URF: [1, 1, 1],
  UFL: [-1, 1, 1],
  ULB: [-1, 1, -1],
  UBR: [1, 1, -1],
  DFR: [1, -1, 1],
  DLF: [-1, -1, 1],
  DBL: [-1, -1, -1],
  DRB: [1, -1, -1]
};

export class CubeView {
  constructor({ viewerEl, corners, posFaces, onStickerClick }) {
    this.viewerEl = viewerEl;
    this.corners = corners;
    this.posFaces = posFaces;
    this.onStickerClick = onStickerClick;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#f2efe6");

    this.camera = new THREE.PerspectiveCamera(45, viewerEl.clientWidth / viewerEl.clientHeight, 0.1, 100);
    this.camera.position.set(3.8, 3.2, 4.3);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(viewerEl.clientWidth, viewerEl.clientHeight);
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.viewerEl.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.minDistance = 2.8;
    this.controls.maxDistance = 9;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.lightTime = 0;
    this.autoRotateEnabled = false;
    this.isUserInteracting = false;

    this.cubeRoot = new THREE.Group();
    this.scene.add(this.cubeRoot);
    this.cubies = [];
    this.stickerMeshes = [];
    this.stickerMeshByKey = new Map();

    this.cubieBox = new THREE.BoxGeometry(0.98, 0.98, 0.98);
    this.bodyMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8, metalness: 0.0 });
    this.stickerGeo = new THREE.PlaneGeometry(0.8, 0.8);
    this.stickerMaterials = this.createStickerMaterials();

    this.setupLights();
    this.bindEvents();
    this.renderLoop();
  }

  createStickerMaterials() {
    return {
      null: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7, metalness: 0.0 }),
      U: new THREE.MeshStandardMaterial({ color: FACE_STYLE.U.color, roughness: 0.65, metalness: 0.0 }),
      R: new THREE.MeshStandardMaterial({ color: FACE_STYLE.R.color, roughness: 0.65, metalness: 0.0 }),
      F: new THREE.MeshStandardMaterial({ color: FACE_STYLE.F.color, roughness: 0.65, metalness: 0.0 }),
      D: new THREE.MeshStandardMaterial({ color: FACE_STYLE.D.color, roughness: 0.65, metalness: 0.0 }),
      L: new THREE.MeshStandardMaterial({ color: FACE_STYLE.L.color, roughness: 0.65, metalness: 0.0 }),
      B: new THREE.MeshStandardMaterial({ color: FACE_STYLE.B.color, roughness: 0.65, metalness: 0.0 })
    };
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

    this.controls.addEventListener("start", () => {
      this.isUserInteracting = true;
    });
    this.controls.addEventListener("end", () => {
      this.isUserInteracting = false;
    });

    window.addEventListener("resize", () => {
      this.camera.aspect = this.viewerEl.clientWidth / this.viewerEl.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.viewerEl.clientWidth, this.viewerEl.clientHeight);
    });
  }

  buildCubeFromState(stickerState) {
    if (this.cubies.length === 8) {
      this.setStickerState(stickerState);
      this.resetCubieTransforms();
      return;
    }

    this.cubies.forEach((c) => this.cubeRoot.remove(c.mesh));
    this.cubies = [];
    this.stickerMeshes = [];
    this.stickerMeshByKey.clear();

    for (const corner of this.corners) {
      const [rx, ry, rz] = CUBE_COORDS[corner];
      const x = rx * LAYER_COORD;
      const y = ry * LAYER_COORD;
      const z = rz * LAYER_COORD;

      const group = new THREE.Group();
      group.position.set(x, y, z);
      group.userData.defaultPosition = new THREE.Vector3(x, y, z);

      group.add(new THREE.Mesh(this.cubieBox, this.bodyMat));

      const faces = [];
      if (ry === 1) faces.push("U");
      if (ry === -1) faces.push("D");
      if (rx === 1) faces.push("R");
      if (rx === -1) faces.push("L");
      if (rz === 1) faces.push("F");
      if (rz === -1) faces.push("B");

      for (const face of faces) {
        const key = `${corner}_${face}`;
        const faceLetter = stickerState.get(key) ?? null;
        const sticker = new THREE.Mesh(this.stickerGeo, this.stickerMaterials[faceLetter]);
        this.orientSticker(sticker, face);
        sticker.userData.key = key;
        group.add(sticker);
        this.stickerMeshes.push(sticker);
        this.stickerMeshByKey.set(key, sticker);
      }

      this.cubies.push({ mesh: group });
      this.cubeRoot.add(group);
    }
  }

  setStickerState(state) {
    for (const [key, sticker] of this.stickerMeshByKey.entries()) {
      const faceLetter = state.get(key) ?? null;
      sticker.material = this.stickerMaterials[faceLetter];
    }
  }

  setSingleSticker(key, faceLetter) {
    const sticker = this.stickerMeshByKey.get(key);
    if (sticker) sticker.material = this.stickerMaterials[faceLetter ?? null];
  }

  resetCubieTransforms() {
    for (const c of this.cubies) {
      c.mesh.position.copy(c.mesh.userData.defaultPosition);
      c.mesh.rotation.set(0, 0, 0);
      c.mesh.quaternion.set(0, 0, 0, 1);
    }
  }

  resetRootRotation() {
    this.cubeRoot.rotation.set(0, 0, 0);
  }

  setAutoRotateEnabled(enabled) {
    this.autoRotateEnabled = enabled;
  }

  orientSticker(mesh, face) {
    if (face === "F") mesh.position.set(0, 0, 0.495);
    else if (face === "B") {
      mesh.position.set(0, 0, -0.495);
      mesh.rotation.y = Math.PI;
    } else if (face === "U") {
      mesh.position.set(0, 0.495, 0);
      mesh.rotation.x = -Math.PI / 2;
    } else if (face === "D") {
      mesh.position.set(0, -0.495, 0);
      mesh.rotation.x = Math.PI / 2;
    } else if (face === "R") {
      mesh.position.set(0.495, 0, 0);
      mesh.rotation.y = Math.PI / 2;
    } else if (face === "L") {
      mesh.position.set(-0.495, 0, 0);
      mesh.rotation.y = -Math.PI / 2;
    }
  }

  async animateMove(moveId, durationMs) {
    const face = MOVE_FACE[Math.floor(moveId / 3)];
    const turns = moveId % 3 === 0 ? 1 : moveId % 3 === 1 ? 2 : -1;

    const spec = {
      U: { axis: "y", layer: LAYER_COORD, angle: -Math.PI / 2 },
      D: { axis: "y", layer: -LAYER_COORD, angle: Math.PI / 2 },
      R: { axis: "x", layer: LAYER_COORD, angle: -Math.PI / 2 },
      L: { axis: "x", layer: -LAYER_COORD, angle: Math.PI / 2 },
      F: { axis: "z", layer: LAYER_COORD, angle: -Math.PI / 2 },
      B: { axis: "z", layer: -LAYER_COORD, angle: Math.PI / 2 }
    }[face];

    const targetAngle = spec.angle * turns;
    const layer = this.cubies
      .map((c) => c.mesh)
      .filter((m) => Math.abs(m.position[spec.axis] - spec.layer) < 0.1);

    const pivot = new THREE.Group();
    this.cubeRoot.add(pivot);
    layer.forEach((m) => pivot.attach(m));

    await new Promise((resolve) => {
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / durationMs);
        const eased = 1 - Math.pow(1 - p, 3);
        pivot.rotation[spec.axis] = targetAngle * eased;
        if (p < 1) {
          requestAnimationFrame(tick);
          return;
        }

        layer.forEach((m) => this.cubeRoot.attach(m));
        this.cubeRoot.remove(pivot);
        for (const m of layer) {
          m.position.x = this.snapLayerCoord(m.position.x);
          m.position.y = this.snapLayerCoord(m.position.y);
          m.position.z = this.snapLayerCoord(m.position.z);
          m.quaternion.normalize();
        }
        resolve();
      };
      requestAnimationFrame(tick);
    });
  }

  snapLayerCoord(v) {
    return Math.round(v / LAYER_COORD) * LAYER_COORD;
  }

  renderLoop() {
    requestAnimationFrame(() => this.renderLoop());

    this.lightTime += 0.015;
    this.movingLight.position.x = 4.5 * Math.sin(this.lightTime);
    this.movingLight.position.z = 4.5 * Math.cos(this.lightTime);
    this.movingLight.position.y = 3.5 + Math.sin(this.lightTime * 0.5) * 1.5;

    if (this.autoRotateEnabled && !this.isUserInteracting) {
      this.cubeRoot.rotation.y += 0.003;
      this.cubeRoot.rotation.x += 0.0015;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
