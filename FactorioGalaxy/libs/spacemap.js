import * as THREE from "three";
import gsap from "gsap";
import { MapControls } from "three/addons/controls/MapControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/addons/renderers/CSS2DRenderer.js";

var scene;
var camera;
var renderer;
var target;
var controls;
var gui;
var guiData;
var loadingInfo;

var labelRenderer;
var chartbundleOpts;

var starPositions;
var starColors;
var starSizes;

var starCount = 0;
var starPoints;

var grid;

var starSprites = new THREE.Group();

var starIdToSprite = new Map();
var hoveringSprite;
var hoveringSpriteColor;
var starTextureVariations = new Array();

const geometry = new THREE.BufferGeometry();
var pointer = new THREE.Vector2();
var pointerWorld = new THREE.Vector3();

const camMinZ = 15;
const camMaxZ = 100;
const camStartZ = 60;
const camMaxSpeed = 15;
const camMinSpeed = 3;
const starIdToIndexMap = new Map();

var starLabel;

export function totalStars() {
  return chartbundleOpts.stars.users.length;
}

export function focusOnStar(user) {
  const opts = chartbundleOpts;
  user = user.toLowerCase();
  let index = null;
  for (let i = 0; i < chartbundleOpts.stars.users.length; i++) {
    if (chartbundleOpts.stars.users[i].toLowerCase() == user) {
      index = i;
      break;
    }
  }

  if (index === null) {
    return false;
  }

  const starX = chartbundleOpts.stars.positions[index * 2];
  const starY = chartbundleOpts.stars.positions[index * 2 + 1];

  //Old Instant Teleport.
  //camera.position.set(starX, starY, 20);
  //controls.target.set(camera.position.x, camera.position.y, 0)
  //render();

  //New Fancy Panning.
  panCameraTo(starX, starY);

  return true;
}

function panCameraTo(x, y) {
  const camX = camera.position.x;
  const camY = camera.position.y;

  //Get the midway point. for zoom out/in.
  let midX = camX + (x - camX) / 2;
  let midY = camY + (y - camY) / 2;

  gsap.to(camera.position, {
    x: midX,
    y: midY,
    z: 60,
    duration: 3,
    onUpdate: function () {
      controls.target.set(camera.position.x, camera.position.y, 0);
    },
    onComplete: function () {
      gsap.to(camera.position, {
        x: x,
        y: y,
        z: 15,
        duration: 3,
        onUpdate: function () {
          controls.target.set(camera.position.x, camera.position.y, 0);
        },
        onComplete: function () {
          //Figure out maybe auto showing the star label here?
        },
      });
    },
  });
}

export async function initSpacemapViewer(opts) {
  if (opts.debug) console.log(opts);
  chartbundleOpts = opts;
  starCount = opts.stars.coordinates.length / 2;

  scene = new THREE.Scene();
  target = document.getElementById("chartbundle-map-canvas");
  loadingInfo = document.getElementById("chartbundle-loading");

  renderer = new THREE.WebGLRenderer({ antialias: true, canvas: target });
  renderer.setSize(
    target.getBoundingClientRect().width,
    target.getBoundingClientRect().height
  );

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(
    target.getBoundingClientRect().width,
    target.getBoundingClientRect().height
  );
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.top = "0";
  labelRenderer.domElement.style.left = "0";
  labelRenderer.domElement.style.pointerEvents = "none";
  target.parentElement.appendChild(labelRenderer.domElement);

  camera = new THREE.PerspectiveCamera(
    80,
    renderer.domElement.width / renderer.domElement.height,
    0.1,
    10000
  );
  camera.up.set(0, 0, 1);
  camera.position.set(
    (opts.cols * opts.gridsize) / 2,
    (opts.rows * opts.gridsize) / 2,
    camStartZ
  );
  camera.lookAt(camera.position.x, camera.position.y, 0);

  resizeRendererToDisplaySize(true);
  adaptCameraToDisplaySize();
  window.addEventListener("resize", () => {
    if (resizeRendererToDisplaySize()) {
      adaptCameraToDisplaySize();
    }
  });
  scene.add(camera);

  controls = new MapControls(camera, renderer.domElement);
  controls.target.set(camera.position.x, camera.position.y, 0);
  controls.screenSpacePanning = false;
  controls.enableRotate = false;
  controls.zoomSpeed = 2;
  controls.zoomToCursor = true;
  controls.listenToKeyEvents(window);
  if (!chartbundleOpts.debug) {
    controls.minDistance = camMinZ;
    controls.maxDistance = camMaxZ;
  }

  // pass-through mousewheel events from labelRenderer
  labelRenderer.domElement.addEventListener("wheel", controls._onMouseWheel, {
    passive: false,
  });

  target.addEventListener("pointermove", onPointerMove);
  function onPointerMove(event) {
    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components
    pointer.x =
      (event.layerX / renderer.domElement.width) * window.devicePixelRatio * 2 -
      1;
    pointer.y =
      -((event.layerY / renderer.domElement.height) * window.devicePixelRatio) *
        2 +
      1;

    pointerWorld.set(pointer.x, pointer.y, 0.5);
    pointerWorld.unproject(camera);
    pointerWorld.sub(camera.position).normalize();
    var distance = -camera.position.z / pointerWorld.z;
    pointerWorld = new THREE.Vector3()
      .copy(camera.position)
      .add(pointerWorld.multiplyScalar(distance));
  }

  gui = new GUI();
  if (!chartbundleOpts.debug) {
    gui.hide();
  }

  guiData = {
    camera_x: camera.position.x,
    camera_y: camera.position.y,
    camera_z: camera.position.z,
    pointer: JSON.stringify(pointerWorld),
    zoom: camera.zoom,
    info: "",
  };

  gui.add(guiData, "camera_x", camera.position.x).listen().disable();
  gui.add(guiData, "camera_y", camera.position.y).listen().disable();
  gui.add(guiData, "camera_z", camera.position.z).listen().disable();
  gui.add(guiData, "pointer", JSON.stringify(pointerWorld)).listen().disable();
  gui.add(guiData, "zoom", camera.zoom).listen().disable();
  gui.add(guiData, "info", "").listen();

  starPositions = new Array(starCount * 3);
  starColors = new Array(starPositions.length);
  starSizes = new Array(starCount);

  // TODO: as long as we're not using THREE.Points as a zoom fallback most of this code is redundant
  for (let index = 0; index < starCount; index++) {
    const starCoords = {
      col: opts.stars.coordinates[index * 2],
      row: opts.stars.coordinates[index * 2 + 1],
    };
    const starPosition = new THREE.Vector3(
      opts.stars.positions[index * 2],
      opts.stars.positions[index * 2 + 1],
      0
    );
    const starId = starCoordsToId(starCoords);
    //const color = (new THREE.Color()).setHex(opts.stars.colors[index]);
    let color = new THREE.Color().setHex(opts.stars.colors[index]);
    color.convertSRGBToLinear(); // Convert to linear space for manipulation
    color.multiplyScalar(1.2); // Brighten by multiplying the color
    color.convertLinearToSRGB(); // Convert back to sRGB space

    starIdToIndexMap.set(starId, index);

    starPositions[index * 3] = starPosition.x;
    starPositions[index * 3 + 1] = starPosition.y;
    starPositions[index * 3 + 2] = 0;

    starColors[index * 3] = color.r;
    starColors[index * 3 + 1] = color.g;
    starColors[index * 3 + 2] = color.b;

    starSizes[index] = (triple32inc(starId) % 3) + 3;
  }

  const assignSRGB = (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
  };
  const textureLoader = new THREE.TextureLoader();

  for (let index = 0; index < 5; index++) {
    const tex = textureLoader.load(`./libs/${index + 1}.png`, assignSRGB);
    starTextureVariations.push(tex);
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starPositions, 3)
  );
  geometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(starColors, 3)
  );
  geometry.setAttribute("size", new THREE.Float32BufferAttribute(starSizes, 1));

  // Vertex shader
  const vertexShader = `
attribute float size;

varying vec3 vColor;

void main() {
  // Pass the color to the fragment shader
  vColor = color;

  // Set the size of the point
  gl_PointSize = size;

  // Transform the position
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

  const fragmentShader = `
varying vec3 vColor;

void main() {
    vec2 pointCoord = gl_PointCoord - vec2(0.5, 0.5);
    float distanceFromCenter = length(pointCoord);

    float alpha = 1.0 - smoothstep(0.45, 0.5, distanceFromCenter);

    if (distanceFromCenter > 0.5) {
        discard;
    }

    gl_FragColor = vec4(vColor, 1.0);
}

`;

  const pointsMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    vertexColors: true, // Enable vertex colors
    transparent: false,
  });

  starPoints = new THREE.Points(geometry, pointsMaterial);
  if (!chartbundleOpts.debug) starPoints.visible = false;
  scene.add(starPoints);

  scene.add(starSprites);
  starSprites.visible = true;

  const gridGeometry = new THREE.BufferGeometry();
  grid = new THREE.LineSegments(
    gridGeometry,
    new THREE.LineBasicMaterial({ color: 0x0000ff })
  );

  scene.add(grid);

  starLabel = createLabel("");
  starLabel.visible = false;
  scene.add(starLabel);

  render();
}

// https://github.com/skeeto/hash-prospector
function triple32inc(x) {
  x++;
  x ^= x >> 17;
  x *= 0xed5ad4bb;
  x ^= x >> 11;
  x *= 0xac4c1b51;
  x ^= x >> 15;
  x *= 0x31848bab;
  x ^= x >> 14;
  return x;
}

function screenToWorld(x, y) {
  const ndc = new THREE.Vector2(x, y);

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(ndc, camera);

  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const intersection = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, intersection);

  return new THREE.Vector3(intersection.x, intersection.y, 0);
}

/* the different kinds of star ids

- starCoordinates - (col, grid)-> position of the star on a 2d grid
- starWorldPosition - (x, y, z) -> position of the star in 3d space, (starCoordinates + random offset inside the grid cell)
- starId -> (id) -> unique integer id computed out of the starCoordinates, e.g. used for lookup in maps
- starIdx -> (idx) -> index in the global arrays

*/

function worldToStarCoords(vec3) {
  const col = Math.floor(
    (vec3.x + chartbundleOpts.gridsize / 2) / chartbundleOpts.gridsize
  );
  const row = Math.floor(
    (vec3.y + chartbundleOpts.gridsize / 2) / chartbundleOpts.gridsize
  );

  return { col: col, row: row };
}

function starCoordsToId(coords) {
  return (coords.col << 16) | coords.row;
}

function idToStarCoords(id) {
  const col = id >> 16;
  const row = id & 0xffff;
  return { col, row };
}

function starIdToIndex(id) {
  if (starIdToIndexMap.has(id)) return starIdToIndexMap.get(id);
  return null;
}

function starIdToWorldPos(id) {
  const idx = starIdToIndex(id);
  if (idx != null) {
    return new THREE.Vector3(
      chartbundleOpts.stars.positions[idx * 2],
      chartbundleOpts.stars.positions[idx * 2 + 1],
      0
    );
  }
  return null;
}

function starCoordsToName(coords) {
  let name = "";
  for (let index = 0; index < chartbundleOpts.levels.length; index++) {
    const lvl = chartbundleOpts.levels[index];

    const lvlCol = Math.floor(coords.col / lvl.total_cols) % lvl.cols;
    const lvlRow = Math.floor(coords.row / lvl.total_rows) % lvl.rows;

    const slot = lvl.slots[lvlRow * lvl.cols + lvlCol];
    name = `${name}${slot}${lvl.addr_suffix}`;
  }
  return name;
}

function createLabel(message) {
  // TODO: move style to css
  const div = document.createElement("a");
  div.className = "star-label";
  div.textContent = message;
  div.style.marginTop = "-0.5em";
  div.style.fontSize = "1.5em";
  div.style.fontFamily = "'Titillium Web', sans-serif'";
  div.style.paddingTop = "8px";
  div.style.paddingBottom = "26px";
  if (chartbundleOpts.debug) div.style.border = "4px solid #ff6550";
  div.style.pointerEvents = "auto";

  div.addEventListener("scroll", (event) => {
    console.log(event);
  });
  const label = new CSS2DObject(div);
  label.visible = true;
  return label;
}

function resizeRendererToDisplaySize(force) {
  const canvas = renderer.domElement;
  const targetBounds =
    renderer.domElement.parentElement.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio;
  const width = Math.floor(targetBounds.width * pixelRatio);
  const height = Math.floor(targetBounds.height * pixelRatio);

  const needResize = canvas.width !== width || canvas.height !== height;

  if (needResize || force) {
    renderer.setSize(width, height);

    // labelRenderer.setSize(width, height) breaks for hidpi devices, retina displays...
    labelRenderer.setSize(targetBounds.width, targetBounds.height);
  }
  return needResize;
}

function adaptCameraToDisplaySize() {
  const canvas = renderer.domElement;
  const width = canvas.width;
  const height = canvas.height;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

//TODO: refactor this into separate functions
function updateGridAndSprites() {
  const topLeftWorld = screenToWorld(-1, -1);
  const bottomRightWorld = screenToWorld(1, 1);
  const sizeWorld = new THREE.Vector3()
    .copy(bottomRightWorld)
    .sub(topLeftWorld);

  const cols = Math.ceil(sizeWorld.x / chartbundleOpts.gridsize) + 2;
  const rows = Math.ceil(sizeWorld.y / chartbundleOpts.gridsize) + 2;

  if (cols > 30 || rows > 30) {
    grid.visible = false;
    starLabel.visible = false;
  } else {
    if (chartbundleOpts.debug) grid.visible = true;
  }

  const offsetX =
    Math.floor(topLeftWorld.x / chartbundleOpts.gridsize) *
      chartbundleOpts.gridsize -
    chartbundleOpts.gridsize / 2;
  const offsetY =
    Math.floor(topLeftWorld.y / chartbundleOpts.gridsize) *
      chartbundleOpts.gridsize +
    chartbundleOpts.gridsize / 2;

  guiData.info = JSON.stringify({
    cols: cols,
    rows: rows,
    x: offsetX.toFixed(2),
    y: offsetY.toFixed(2),
  });

  if (chartbundleOpts.debug) {
    const gridPoints = [];

    for (let col = 0; col < cols; col++) {
      const x = offsetX + col * chartbundleOpts.gridsize;
      gridPoints.push(new THREE.Vector3(x, offsetY, 0));
      gridPoints.push(
        new THREE.Vector3(x, offsetY + rows * chartbundleOpts.gridsize, 0)
      );
    }

    for (let row = 0; row < rows; row++) {
      const y = offsetY + row * chartbundleOpts.gridsize;
      gridPoints.push(new THREE.Vector3(offsetX, y, 0));
      gridPoints.push(
        new THREE.Vector3(offsetX + cols * chartbundleOpts.gridsize, y, 0)
      );
    }
    grid.frustumCulled = false;
    grid.geometry.setFromPoints(gridPoints);
    grid.geometry.computeBoundingBox();
  }

  const starOffsetX = Math.floor(topLeftWorld.x / chartbundleOpts.gridsize);
  const starOffsetY = Math.floor(topLeftWorld.y / chartbundleOpts.gridsize);

  const starCoords = { col: 0, row: 0 };
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      starCoords.col = starOffsetX + col;
      starCoords.row = starOffsetY + row;
      const starId = starCoordsToId(starCoords);
      if (!starIdToSprite.has(starId) && starIdToIndex(starId) != null) {
        const color = new THREE.Color().lerpColors(
          new THREE.Color("white"),
          new THREE.Color().setHex(
            chartbundleOpts.stars.colors[starIdToIndex(starId)]
          ),
          1
        );
        const tex =
          starTextureVariations[
            triple32inc(starId) % starTextureVariations.length
          ];
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: tex,
            color: color,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        );
        const baseScale = 6;
        const scaleStep = 0.1;
        const scaleVariants = 5;
        const scale =
          baseScale + (triple32inc(starId) % scaleVariants) * scaleStep;

        const pos = starIdToWorldPos(starId);
        sprite.position.copy(pos);
        sprite.position.z = 0;
        starSprites.add(sprite);
        starIdToSprite.set(starId, sprite);

        sprite.scale.set(scale, scale, 1);
      }
    }
  }
}

function clampCamera() {
  const topLeft = new THREE.Vector2(0, 0);
  const bottomRight = new THREE.Vector2(
    chartbundleOpts.cols * chartbundleOpts.gridsize,
    chartbundleOpts.rows * chartbundleOpts.gridsize
  );

  if (
    camera.position.x < topLeft.x ||
    camera.position.x > bottomRight.x ||
    camera.position.y < topLeft.y ||
    camera.position.y > bottomRight.y
  ) {
    // remove camera from controls so it doesnt mess with me
    // https://discourse.threejs.org/t/orbit-mapcontrols-mess-up-manual-camera-positioning/55335/2
    controls.object = new THREE.OrthographicCamera();
    controls.reset();
    const clampedPos = new THREE.Vector2(
      camera.position.x,
      camera.position.y
    ).clamp(topLeft, bottomRight);

    camera.position.set(clampedPos.x, clampedPos.y, camera.position.z);
    camera.lookAt(new THREE.Vector3(clampedPos.x, clampedPos.y, 0));
    camera.updateProjectionMatrix();
    controls.target.set(clampedPos.x, clampedPos.y, 0); // prepare controls for camera reintroduction
    controls.object = camera; // here you are
    controls.update();
  }
}

function getNearestStar(vec3) {
  const coords = worldToStarCoords(vec3);
  const offsets = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [0, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
  ];

  let closesStarCoord = null;
  let currentDistance = Number.MAX_SAFE_INTEGER;
  for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
    const offsetCol = offsets[offsetIdx][0];
    const offsetRow = offsets[offsetIdx][1];

    const starCoords = {
      col: coords.col + offsetCol,
      row: coords.row + offsetRow,
    };
    const starId = starCoordsToId(starCoords);
    const starPos = starIdToWorldPos(starId);

    if (starPos == null) continue;

    const distance = vec3.distanceTo(starPos);
    if (distance < currentDistance) {
      closesStarCoord = starCoords;
      currentDistance = distance;
    }
  }

  return closesStarCoord;
}

function updateZoomSpeed() {
  const alpha =
    (camera.position.z - controls.minDistance) / controls.maxDistance;
  let nextSpeed = THREE.MathUtils.lerp(camMinSpeed, camMaxSpeed, alpha);
  controls.zoomSpeed = nextSpeed;
}

function render() {
  if (resizeRendererToDisplaySize(renderer)) {
    adaptCameraToDisplaySize();
  }

  const nearestStarCoords = getNearestStar(pointerWorld);
  if (chartbundleOpts.debug)
    loadingInfo.textContent = `${worldToStarCoords(pointerWorld).col}, ${
      worldToStarCoords(pointerWorld).row
    }`;
  else loadingInfo.style.display = "none";

  starLabel.visible = false;
  if (nearestStarCoords != null) {
    const name = starCoordsToName(nearestStarCoords);
    const starId = starCoordsToId(nearestStarCoords);
    const starIndex = starIdToIndex(starId);

    starLabel.visible = true;
    starLabel.element.textContent = chartbundleOpts.stars.users[starIndex];
    starLabel.element.href = `https://factorio.com/galaxy/${name}`;

    const pos = starIdToWorldPos(starId);
    starLabel.position.copy(pos);

    if (starIdToSprite.has(starId)) {
      const nextHoveringSprite = starIdToSprite.get(starId);
      if (hoveringSprite == null || hoveringSprite != nextHoveringSprite) {
        if (hoveringSprite != null)
          hoveringSprite.material.color = hoveringSpriteColor;
        hoveringSprite = nextHoveringSprite;
        hoveringSpriteColor = hoveringSprite.material.color;

        let color = new THREE.Color().setHex(
          chartbundleOpts.stars.colors[starIdToIndex(starId)]
        );
        color.convertSRGBToLinear();
        color.multiplyScalar(1.2);
        color.convertLinearToSRGB();

        hoveringSprite.material.color = color;
      }
    }
  } else if (hoveringSprite != null) {
    hoveringSprite.material.color = hoveringSpriteColor;
    hoveringSprite = null;
  }

  updateZoomSpeed();
  updateGridAndSprites();
  clampCamera();
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);

  if (chartbundleOpts.debug) {
    guiData.camera_x = camera.position.x;
    guiData.camera_y = camera.position.y;
    guiData.camera_z = camera.position.z;
    guiData.pointer = `${pointerWorld.x.toFixed(2)}, ${pointerWorld.y.toFixed(
      2
    )}, ${pointerWorld.z.toFixed(2)}`;
    guiData.zoom = camera.zoom;
  }

  requestAnimationFrame(render);
}
