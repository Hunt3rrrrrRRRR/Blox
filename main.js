const STORAGE_KEY = "blox_player_games_v2";

const views = {
  home: document.getElementById("homeView"),
  studio: document.getElementById("studioView"),
  play: document.getElementById("playView"),
};

const navButtons = [...document.querySelectorAll("[data-route]")];
const aiList = document.getElementById("aiGamesList");
const userList = document.getElementById("userGamesList");
const generateAiGameBtn = document.getElementById("generateAiGame");
const studioForm = document.getElementById("studioForm");
const clearStudioBtn = document.getElementById("clearStudio");
const exportCode = document.getElementById("exportCode");
const playTitle = document.getElementById("playTitle");
const playMeta = document.getElementById("playMeta");
const backHomeBtn = document.getElementById("backHome");
const statusLabel = document.getElementById("status");
const canvas = document.getElementById("gameCanvas");

const aiThemes = ["city", "island", "space", "dungeon"];

let aiGames = [
  {
    id: crypto.randomUUID(),
    type: "ai",
    name: "AI Obby Rush",
    description: "Auto-generated obstacle world with floating platforms.",
    theme: "space",
    size: "medium",
    blockType: "stone",
    aiEnemies: 10,
    javaClass: "com.blox.server.ObbyRoom",
  },
];

function loadPlayerGames() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

let playerGames = loadPlayerGames();

function savePlayerGames() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(playerGames));
}

function routeTo(route) {
  Object.entries(views).forEach(([key, element]) => {
    element.classList.toggle("active", key === route);
  });

  navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.route === route);
  });
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => routeTo(button.dataset.route));
});

function gameCard(game) {
  const wrapper = document.createElement("div");
  wrapper.className = "game-card";

  const meta = `${game.theme} · ${game.size} · AI enemies: ${game.aiEnemies}`;
  wrapper.innerHTML = `
    <h3>${game.name}</h3>
    <p>${game.description || "No description."}</p>
    <p class="muted">${meta}</p>
    <div>
      <button class="primary" data-play="${game.id}">Play</button>
    </div>
  `;

  return wrapper;
}

function renderLists() {
  aiList.innerHTML = "";
  userList.innerHTML = "";

  if (!aiGames.length) {
    aiList.innerHTML = `<p class="muted">No AI games yet.</p>`;
  }

  if (!playerGames.length) {
    userList.innerHTML = `<p class="muted">No player-made games yet. Create one in Studio.</p>`;
  }

  [...aiGames, ...playerGames].forEach((game) => {
    const targetList = game.type === "ai" ? aiList : userList;
    const card = gameCard(game);
    targetList.appendChild(card);
  });

  document.querySelectorAll("[data-play]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const gameId = btn.getAttribute("data-play");
      const selected = [...aiGames, ...playerGames].find((g) => g.id === gameId);
      if (selected) {
        startGame(selected);
      }
    });
  });
}

function generateAiGame() {
  const theme = aiThemes[Math.floor(Math.random() * aiThemes.length)];
  const sizeOptions = ["small", "medium", "large"];
  const size = sizeOptions[Math.floor(Math.random() * sizeOptions.length)];
  const newGame = {
    id: crypto.randomUUID(),
    type: "ai",
    name: `AI ${theme[0].toUpperCase()}${theme.slice(1)} Adventure ${Math.floor(Math.random() * 999)}`,
    description: "Procedurally assembled by the built-in game generator.",
    theme,
    size,
    blockType: theme === "dungeon" ? "stone" : theme === "space" ? "dirt" : "grass",
    aiEnemies: Math.floor(Math.random() * 18) + 2,
    javaClass: "com.blox.server.AutoRoom",
  };

  aiGames = [newGame, ...aiGames].slice(0, 8);
  renderLists();
}

generateAiGameBtn.addEventListener("click", generateAiGame);

document.querySelectorAll("button.secondary[data-route='studio']").forEach((button) => {
  button.addEventListener("click", () => routeTo("studio"));
});

studioForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(studioForm);

  const game = {
    id: crypto.randomUUID(),
    type: "player",
    name: String(formData.get("name")),
    theme: String(formData.get("theme")),
    size: String(formData.get("size")),
    blockType: String(formData.get("blockType")),
    aiEnemies: Number(formData.get("aiEnemies")),
    javaClass: String(formData.get("javaClass") || "com.blox.server.GameRoom"),
    description: String(formData.get("description")),
  };

  playerGames = [game, ...playerGames].slice(0, 20);
  savePlayerGames();
  renderLists();
  studioForm.reset();
  routeTo("home");
});

clearStudioBtn.addEventListener("click", () => {
  playerGames = [];
  savePlayerGames();
  renderLists();
});

function updateExportSnippet() {
  exportCode.textContent = `// HTML + Java + JavaScript contract generated by Studio
// Java (Spring Boot) endpoint example:
// @PostMapping("/api/rooms/join")
// public RoomState join(@RequestBody JoinRequest req) { return roomService.join(req); }

// JavaScript client example:
const apiBase = "http://localhost:8080";
async function joinRoom(gameId, playerName) {
  const response = await fetch(apiBase + "/api/rooms/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameId, playerName })
  });
  return response.json();
}`;
}

let engine;
let scene;
let camera;
let shadowGenerator;
let blocks = new Map();
let selectedBlockType = "grass";
let jumpState = { velocity: 0, grounded: false };

const materialsByName = {};

function keyFromPos(x, y, z) {
  return `${x},${y},${z}`;
}

function blockSizeFromGameSize(size) {
  if (size === "small") return 12;
  if (size === "large") return 26;
  return 18;
}

function ensureEngine() {
  if (!engine) {
    engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    window.addEventListener("resize", () => engine.resize());
  }
}

function buildMaterials() {
  materialsByName.grass = new BABYLON.StandardMaterial("grassMat", scene);
  materialsByName.grass.diffuseColor = new BABYLON.Color3(0.27, 0.72, 0.35);

  materialsByName.dirt = new BABYLON.StandardMaterial("dirtMat", scene);
  materialsByName.dirt.diffuseColor = new BABYLON.Color3(0.42, 0.27, 0.14);

  materialsByName.stone = new BABYLON.StandardMaterial("stoneMat", scene);
  materialsByName.stone.diffuseColor = new BABYLON.Color3(0.55, 0.58, 0.61);
}

function createBlock(x, y, z, type = "grass") {
  const key = keyFromPos(x, y, z);
  if (blocks.has(key)) return;

  const block = BABYLON.MeshBuilder.CreateBox(`block_${key}`, { size: 1 }, scene);
  block.position = new BABYLON.Vector3(x, y, z);
  block.material = materialsByName[type] || materialsByName.grass;
  block.checkCollisions = true;
  block.receiveShadows = true;
  block.metadata = { grid: { x, y, z }, isBlock: true };
  shadowGenerator.addShadowCaster(block, false);
  blocks.set(key, block);
}

function removeBlock(x, y, z) {
  const key = keyFromPos(x, y, z);
  const block = blocks.get(key);
  if (!block) return;
  block.dispose();
  blocks.delete(key);
}

function buildTerrain(gameConfig) {
  const radius = blockSizeFromGameSize(gameConfig.size);
  for (let x = -radius; x <= radius; x += 1) {
    for (let z = -radius; z <= radius; z += 1) {
      const dist = Math.sqrt(x * x + z * z);
      const hillFactor = gameConfig.theme === "dungeon" ? 1.4 : gameConfig.theme === "space" ? 0.7 : 1;
      const height = Math.max(0, Math.floor(3 - dist * 0.1 * hillFactor));
      for (let y = -1; y <= height; y += 1) {
        const type = y === height ? gameConfig.blockType : y < 0 ? "stone" : "dirt";
        createBlock(x, y, z, type);
      }
    }
  }
}

function bindInput() {
  window.onkeydown = (event) => {
    if (event.code === "Digit1") selectedBlockType = "grass";
    if (event.code === "Digit2") selectedBlockType = "dirt";
    if (event.code === "Digit3") selectedBlockType = "stone";
    if (event.code === "Space" && jumpState.grounded) {
      jumpState.velocity = 0.27;
      jumpState.grounded = false;
    }
  };

  window.oncontextmenu = (event) => event.preventDefault();

  window.onmousedown = (event) => {
    if (!scene || views.play.classList.contains("active") === false) return;

    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock();
      return;
    }

    const pick = scene.pick(
      scene.getEngine().getRenderWidth() / 2,
      scene.getEngine().getRenderHeight() / 2,
      (mesh) => mesh.metadata?.isBlock,
    );

    if (!pick?.hit || !pick.pickedMesh?.metadata?.grid) return;

    const { x, y, z } = pick.pickedMesh.metadata.grid;

    if (event.button === 0) {
      removeBlock(x, y, z);
    } else if (event.button === 2) {
      const normal = pick.getNormal(true);
      if (!normal) return;
      const target = {
        x: Math.round(x + normal.x),
        y: Math.round(y + normal.y),
        z: Math.round(z + normal.z),
      };
      const playerDistance = BABYLON.Vector3.Distance(camera.position, new BABYLON.Vector3(target.x, target.y, target.z));
      if (playerDistance > 1.2) createBlock(target.x, target.y, target.z, selectedBlockType);
    }

    statusLabel.textContent = `Blocks: ${blocks.size} | Selected: ${selectedBlockType}`;
  };
}

function startGame(gameConfig) {
  ensureEngine();

  if (scene) {
    scene.dispose();
  }

  blocks = new Map();
  selectedBlockType = gameConfig.blockType || "grass";
  jumpState = { velocity: 0, grounded: false };

  scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.5, 0.76, 0.93, 1);
  scene.gravity = new BABYLON.Vector3(0, -0.75, 0);
  scene.collisionsEnabled = true;

  new BABYLON.HemisphericLight("sun", new BABYLON.Vector3(0.2, 1, -0.2), scene).intensity = 0.9;

  const dir = new BABYLON.DirectionalLight("dir", new BABYLON.Vector3(-0.45, -1, 0.35), scene);
  dir.position = new BABYLON.Vector3(20, 40, -20);
  shadowGenerator = new BABYLON.ShadowGenerator(1024, dir);
  shadowGenerator.usePercentageCloserFiltering = true;

  const skyMaterial = new BABYLON.SkyMaterial("sky", scene);
  skyMaterial.backFaceCulling = false;
  skyMaterial.luminance = 0.65;
  skyMaterial.inclination = 0.52;
  skyMaterial.azimuth = 0.21;
  const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 800 }, scene);
  skybox.material = skyMaterial;
  skybox.isPickable = false;

  camera = new BABYLON.UniversalCamera("playerCamera", new BABYLON.Vector3(0, 8, -16), scene);
  camera.speed = 0.4;
  camera.angularSensibility = 4000;
  camera.minZ = 0.1;
  camera.applyGravity = true;
  camera.checkCollisions = true;
  camera.ellipsoid = new BABYLON.Vector3(0.45, 0.9, 0.45);
  camera.keysUp.push(87);
  camera.keysDown.push(83);
  camera.keysLeft.push(65);
  camera.keysRight.push(68);
  camera.attachControl(canvas, true);

  buildMaterials();
  buildTerrain(gameConfig);

  scene.onBeforeRenderObservable.add(() => {
    jumpState.velocity += scene.gravity.y * 0.016;
    camera.cameraDirection.y += jumpState.velocity;

    const feetRay = new BABYLON.Ray(camera.position.clone(), BABYLON.Vector3.Down(), 1.4);
    const hit = scene.pickWithRay(feetRay, (mesh) => mesh.metadata?.isBlock);
    if (hit?.hit && jumpState.velocity < 0) {
      jumpState.grounded = true;
      jumpState.velocity = 0;
    }

    if (Math.floor(performance.now() / 500) % 2 === 0) {
      statusLabel.textContent = `Blocks: ${blocks.size} | Selected: ${selectedBlockType}`;
    }
  });

  playTitle.textContent = gameConfig.name;
  playMeta.textContent = `${gameConfig.type.toUpperCase()} · ${gameConfig.theme} · ${gameConfig.size} · Java: ${gameConfig.javaClass || "n/a"}`;
  routeTo("play");

  if (!engine._activeRenderLoops.length) {
    engine.runRenderLoop(() => {
      if (scene) scene.render();
    });
  }
}

backHomeBtn.addEventListener("click", () => routeTo("home"));

bindInput();
updateExportSnippet();
renderLists();
routeTo("home");
