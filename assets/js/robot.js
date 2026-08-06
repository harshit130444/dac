/* ==========================================================================
   DAC — hero robot (3D)

   Loads assets/robot/dac-robot.glb and renders it in the hero canvas.
   The old bundle embedded this same model inside its JavaScript as a blob,
   which is most of why index.html used to be 1.8 MB. Here it is just a file.

   Model: "AI Robot" by Noores — https://sketchfab.com/nuks
   Licence: Sketchfab Standard. Keep this credit if you keep the model.

   three.js is loaded from a CDN via the import map in index.html. To pin a
   different version, change it there — not here.

   Tuning knobs are all in SETTINGS below.
   ========================================================================== */
import * as THREE            from 'three';
import { GLTFLoader }        from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment }   from 'three/addons/environments/RoomEnvironment.js';

const SETTINGS = {
  modelUrl:    './assets/robot/dac-robot.glb',
  cameraZ:     3.4,     // how far back the camera sits
  modelHeight: 0.94,    // robot height in world units (bigger = larger on screen)
  modelY:     -0.01,    // vertical nudge (positive = higher)
  exposure:    0.92,     // overall brightness (tone mapping)

  // Where the speech bubble sits relative to the robot's head, in pixels.
  // The bubble's bottom-right corner is pinned to this point.
  bubbleX:  -150,
  bubbleY:    34,
  shadowSize: 1.00,     // width of the soft shadow under the robot
  shadowY:   -0.375,     // how far below the robot the shadow sits
  floatHeight: 0.06,    // how far it bobs up and down
  floatSpeed:  1.2,     // bob speed
  tiltAmount:  0.18,    // how much it turns towards the pointer
  spinIdle:    0.08     // slow turn when the pointer is elsewhere
};

// Optional per-page overrides: set window.DAC_ROBOT_SETTINGS before this
// script runs to nudge any value above without editing this file.
Object.assign(SETTINGS, window.DAC_ROBOT_SETTINGS || {});

const canvas = document.querySelector('[data-robot]');

if (canvas) init(canvas);

function init(canvas) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- renderer, scene, camera ---------------------------------------- */
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // The model's eyes and antenna use KHR_materials_emissive_strength with a
  // strength of 10 — they are deliberately brighter than white. Without tone
  // mapping those values clip and the eyes come out the wrong colour, so this
  // line is doing real work, not just taste.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = SETTINGS.exposure;

  const scene  = new THREE.Scene();

  // The robot's shell is glossy PBR plastic, which needs something to reflect.
  // With only directional lights it renders flat and grey. RoomEnvironment is a
  // small studio built in code (no HDRI file to download) and PMREMGenerator
  // turns it into the reflection map. This is what makes the white read as
  // shiny rather than matte — removing it is the single biggest visual downgrade.
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, SETTINGS.cameraZ);

  /* ---- lighting -------------------------------------------------------
     A soft key light from the front-right, a dim fill from the left, and
     a purple rim light behind to pick out the edges in DAC's brand colour.
     --------------------------------------------------------------------- */
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d8e4, 0.6));

  const key = new THREE.DirectionalLight(0xffffff, 1.8);
  key.position.set(2.5, 3, 4);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.35);
  fill.position.set(-3, 1, 2);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xB026FF, 0.9);
  rim.position.set(-1.5, 1.5, -3);
  scene.add(rim);

  /* ---- soft contact shadow --------------------------------------------
     Not a real cast shadow (that needs shadow maps and a floor). This is a
     flat plane with a radial-gradient texture painted on a 2D canvas, which
     is far cheaper and reads the same at this size.
     --------------------------------------------------------------------- */
  function makeShadow() {
    const size = 128;
    const c2d = document.createElement('canvas');
    c2d.width = c2d.height = size;
    const ctx = c2d.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0,   'rgba(0,0,0,0.30)');
    g.addColorStop(0.45,'rgba(0,0,0,0.13)');
    g.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(SETTINGS.shadowSize, SETTINGS.shadowSize * 0.55),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(c2d),
        transparent: true,
        depthWrite: false
      })
    );
    plane.rotation.x = -Math.PI / 2;      // lay it flat
    plane.position.set(-0.06, SETTINGS.shadowY, 0.02);   // nudged left, as in the original
    return plane;
  }

  const shadow = SETTINGS.shadowSize > 0 ? makeShadow() : null;
  if (shadow) scene.add(shadow);

  /* ---- load the model -------------------------------------------------- */
  const pivot = new THREE.Group();          // model hangs off this so we can spin it
  scene.add(pivot);

  // The hero speech bubble is a normal HTML element. Each frame we work out
  // where the robot's head is on screen and move the bubble's anchor there,
  // so the bubble stays pinned to the head while the robot floats and turns.
  const bubbleAnchor = document.querySelector('[data-bubble-anchor]');
  let head = null;

  new GLTFLoader().load(
    SETTINGS.modelUrl,
    (gltf) => {
      const model = gltf.scene;

      // Centre the model on its own bounding box, then scale it to a known
      // height so swapping in a different .glb doesn't need new numbers.
      const box    = new THREE.Box3().setFromObject(model);
      const size   = box.getSize(new THREE.Vector3());
      const centre = box.getCenter(new THREE.Vector3());
      const scale  = SETTINGS.modelHeight / size.y;

      model.position.sub(centre);
      model.scale.setScalar(scale);
      model.position.multiplyScalar(scale);
      model.position.y += SETTINGS.modelY;

      // The GLB names its parts, so we can find the head by name.
      head = model.getObjectByName('Head') || model;

      pivot.add(model);
    },
    undefined,
    (err) => {
      // If the model can't load the hero still works — it just has no robot.
      console.warn('[DAC] robot model failed to load:', err);
    }
  );

  /* ---- follow the pointer --------------------------------------------- */
  const pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;   // -1 .. 1
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  /* ---- keep the canvas matched to its box ------------------------------ */
  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  /* ---- animation loop -------------------------------------------------- */
  const clock = new THREE.Clock();

  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();

    if (!reduceMotion) {
      const bob = Math.sin(t * SETTINGS.floatSpeed) * SETTINGS.floatHeight;
      pivot.position.y = bob;
      // shadow tightens as the robot rises, which sells the float
      if (shadow) {
        const k = 1 - (bob / SETTINGS.floatHeight) * 0.12;
        shadow.scale.set(k, k, k);
      }
      // ease towards where the pointer is, with a slow idle drift
      const targetY = pointer.x * SETTINGS.tiltAmount + Math.sin(t * SETTINGS.spinIdle) * 0.06;
      const targetX = pointer.y * SETTINGS.tiltAmount * 0.4;
      pivot.rotation.y += (targetY - pivot.rotation.y) * 0.05;
      pivot.rotation.x += (targetX - pivot.rotation.x) * 0.05;
    }

    // keep the speech bubble pinned to the robot's head
    if (head && bubbleAnchor) {
      const p = head.getWorldPosition(new THREE.Vector3()).project(camera);
      var bx = (p.x * 0.5 + 0.5) * canvas.clientWidth  + SETTINGS.bubbleX;
      var by = (-p.y * 0.5 + 0.5) * canvas.clientHeight + SETTINGS.bubbleY;
      bubbleAnchor.style.transform =
        'translate3d(' + bx.toFixed(1) + 'px,' + by.toFixed(1) + 'px, 0)';
    }

    renderer.render(scene, camera);
  });
}
