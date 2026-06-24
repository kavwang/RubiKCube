import * as THREE from "three";

const FACE_COLORS = {
  U: "#ffffff",
  D: "#ffea00",
  F: "#00e676",
  B: "#2979ff",
  R: "#e63946",
  L: "#ff6d00"
};

function makePreview(el, n) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1220);

  const camera = new THREE.PerspectiveCamera(44, el.clientWidth / el.clientHeight, 0.1, 100);
  const camDist = n === 3 ? 8.4 : 6.2;
  camera.position.set(camDist * 0.8, camDist * 0.68, camDist);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(el.clientWidth, el.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  el.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(4, 6, 5);
  scene.add(dir);

  const root = new THREE.Group();
  scene.add(root);

  const boxSize = 0.95;
  const gap = 0.03;
  const spacing = boxSize + gap;
  const half = (n - 1) / 2;

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x131313, roughness: 0.7 });
  const boxGeo = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
  const stickerGeo = new THREE.PlaneGeometry(0.78, 0.78);

  for (let x = 0; x < n; x += 1) {
    for (let y = 0; y < n; y += 1) {
      for (let z = 0; z < n; z += 1) {
        const g = new THREE.Group();
        g.position.set((x - half) * spacing, (y - half) * spacing, (z - half) * spacing);
        g.add(new THREE.Mesh(boxGeo, bodyMat));

        if (z === n - 1) addSticker(g, "F");
        if (z === 0) addSticker(g, "B");
        if (y === n - 1) addSticker(g, "U");
        if (y === 0) addSticker(g, "D");
        if (x === n - 1) addSticker(g, "R");
        if (x === 0) addSticker(g, "L");

        root.add(g);
      }
    }
  }

  function addSticker(group, face) {
    const mat = new THREE.MeshStandardMaterial({ color: FACE_COLORS[face], roughness: 0.55 });
    const s = new THREE.Mesh(stickerGeo, mat);
    if (face === "F") s.position.set(0, 0, 0.49);
    else if (face === "B") { s.position.set(0, 0, -0.49); s.rotation.y = Math.PI; }
    else if (face === "U") { s.position.set(0, 0.49, 0); s.rotation.x = -Math.PI / 2; }
    else if (face === "D") { s.position.set(0, -0.49, 0); s.rotation.x = Math.PI / 2; }
    else if (face === "R") { s.position.set(0.49, 0, 0); s.rotation.y = Math.PI / 2; }
    else if (face === "L") { s.position.set(-0.49, 0, 0); s.rotation.y = -Math.PI / 2; }
    group.add(s);
  }

  let t = 0;
  function render() {
    requestAnimationFrame(render);
    t += 0.01;
    root.rotation.y += 0.007;
    root.rotation.x = 0.27 + Math.sin(t * 0.9) * 0.09;
    renderer.render(scene, camera);
  }
  render();

  window.addEventListener("resize", () => {
    const w = el.clientWidth;
    const h = el.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    camera.lookAt(0, 0, 0);
    renderer.setSize(w, h);
  });
}

makePreview(document.getElementById("preview2"), 2);
makePreview(document.getElementById("preview3"), 3);
