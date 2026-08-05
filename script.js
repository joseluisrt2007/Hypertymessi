// ============================================================
// Hypertymessi - version web (HTML + CSS + JS)
// Replica fiel del juego original hecho en Python + Tkinter
// ============================================================

// ---------- Elementos ----------
const menuScreen = document.getElementById("menu-screen");
const gameScreen = document.getElementById("game-screen");

const tutorialBtn = document.getElementById("tutorial-btn");
const nameInput = document.getElementById("name-input");
const startBtn = document.getElementById("start-btn");
const highscoresEl = document.getElementById("highscores");

const headerBar = document.getElementById("header-bar");
const boardEl = document.getElementById("board");
const pistaBtn = document.getElementById("pista-btn");
const checkBtn = document.getElementById("check-btn");
const pauseBtn = document.getElementById("pause-btn");
const countdownLabel = document.getElementById("countdown-label");

const pauseModal = document.getElementById("pause-modal");
const resumeBtn = document.getElementById("resume-btn");
const restartLevelBtn = document.getElementById("restart-level-btn");
const backMenuBtn = document.getElementById("back-menu-btn");

const tutorialModal = document.getElementById("tutorial-modal");
const closeTutorialBtn = document.getElementById("close-tutorial-btn");

const alertModal = document.getElementById("alert-modal");
const alertTitle = document.getElementById("alert-title");
const alertMessage = document.getElementById("alert-message");
const alertCloseBtn = document.getElementById("alert-close-btn");

const bgmusic = document.getElementById("bgmusic");
const sfxWin = document.getElementById("sfx-win");
const sfxLose = document.getElementById("sfx-lose");
const sfxPista = document.getElementById("sfx-pista");

// ---------- Estado del juego ----------
const HIGHSCORE_KEY = "hypertymessi_highscores";
let highscores = {};

let playerName = "";
let score = 0;
let level = 2;
const MAX_LEVEL = 10;

let matrix = [];       // valores correctos
let hiddenMask = [];   // true = celda oculta (input editable)
let pistaUsada = false;
let pistaCosto = 50;

let countdownTimer = null;

// ---------- Utilidades de audio ----------
function playMusic(name) {
  try {
    bgmusic.pause();
    bgmusic.src = `assets/music/${name}.mp3`;
    bgmusic.currentTime = 0;
    bgmusic.play().catch(() => {});
  } catch (e) { /* silencioso, igual que el original */ }
}

function stopMusic() {
  bgmusic.pause();
}

function playSfx(el) {
  el.currentTime = 0;
  el.play().catch(() => {});
}

// ---------- Alerta generica (reemplaza messagebox) ----------
function showAlert(title, message, onClose) {
  alertTitle.textContent = title;
  alertMessage.textContent = message;
  alertModal.classList.remove("hidden");
  alertCloseBtn.onclick = () => {
    alertModal.classList.add("hidden");
    if (onClose) onClose();
  };
}

// ---------- Guardado de puntajes (localStorage en vez de archivo) ----------
function loadHighscores() {
  try {
    const raw = localStorage.getItem(HIGHSCORE_KEY);
    highscores = raw ? JSON.parse(raw) : {};
  } catch (e) {
    highscores = {};
  }
}

function saveHighscore() {
  if (!playerName) return;
  highscores[playerName] = Math.max(score, highscores[playerName] || 0);
  localStorage.setItem(HIGHSCORE_KEY, JSON.stringify(highscores));
}

function renderHighscores() {
  const entries = Object.entries(highscores).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    highscoresEl.textContent = "Sin puntajes aún.";
    return;
  }
  const top5 = entries.slice(0, 5);
  const lines = top5.map(([n, p]) => `${n}: ${p}`).join("\n");
  highscoresEl.innerHTML = `<div class="hs-title">🏆 TOP 5 PUNTAJES 🏆</div>${lines.replace(/\n/g, "<br>")}`;
}

// ---------- Pantalla de menu ----------
function startMenu() {
  clearTimeout(countdownTimer);
  gameScreen.classList.add("hidden");
  menuScreen.classList.remove("hidden");
  playMusic("menu");
  renderHighscores();
  nameInput.value = playerName || "";
}

function onStart() {
  const name = nameInput.value.trim();
  if (!name) {
    showAlert("Nombre requerido", "Por favor ingresa tu nombre.");
    return;
  }
  playerName = name;
  score = 0;
  level = 2;
  startLevel();
}

// ---------- Mecanica del nivel ----------
function startLevel() {
  clearTimeout(countdownTimer);
  menuScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  pistaUsada = false;

  playMusic(`level${level}`);

  // Generar matriz y mascara
  matrix = Array.from({ length: level }, () =>
    Array.from({ length: level }, () => Math.floor(Math.random() * 10))
  );
  hiddenMask = Array.from({ length: level }, () => Array(level).fill(false));

  renderHeader();
  renderBoard();

  countdownLabel.textContent = "";
  let secondsLeft = 10;
  countdownLabel.textContent = `Memoriza los números... ${secondsLeft}`;
  countdownTimer = setInterval(() => {
    secondsLeft--;
    if (secondsLeft <= 0) {
      clearInterval(countdownTimer);
      countdownLabel.textContent = "";
      hideRandomCells();
    } else {
      countdownLabel.textContent = `Memoriza los números... ${secondsLeft}`;
    }
  }, 1000);
}

function renderHeader() {
  headerBar.textContent = `Jugador: ${playerName}   |   Nivel: ${level}x${level}   |   Puntos: ${score}`;
}

function cellSizeForLevel() {
  const size = Math.floor(440 / level) - 4;
  return Math.max(28, Math.min(70, size));
}

function renderBoard() {
  boardEl.innerHTML = "";
  const size = cellSizeForLevel();
  boardEl.style.gridTemplateColumns = `repeat(${level}, ${size}px)`;
  boardEl.style.gridTemplateRows = `repeat(${level}, ${size}px)`;

  const fontSize = Math.max(12, Math.min(20, size * 0.4));

  for (let r = 0; r < level; r++) {
    for (let c = 0; c < level; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.style.width = `${size}px`;
      cell.style.height = `${size}px`;
      cell.style.fontSize = `${fontSize}px`;
      cell.textContent = String(matrix[r][c]);
      cell.dataset.r = r;
      cell.dataset.c = c;
      boardEl.appendChild(cell);
    }
  }
}

function hideRandomCells() {
  const numToHide = level + Math.floor(Math.random() * 3); // level, level+1 o level+2
  const positions = [];
  for (let r = 0; r < level; r++) {
    for (let c = 0; c < level; c++) positions.push([r, c]);
  }
  // barajar y tomar las primeras numToHide
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  const chosen = positions.slice(0, Math.min(numToHide, positions.length));

  chosen.forEach(([r, c]) => {
    hiddenMask[r][c] = true;
    const cellDiv = boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    const size = cellSizeForLevel();
    const fontSize = Math.max(12, Math.min(20, size * 0.4));

    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "numeric";
    input.maxLength = 1;
    input.className = "cell-input";
    input.style.fontSize = `${fontSize}px`;
    input.dataset.r = r;
    input.dataset.c = c;
    input.addEventListener("input", () => {
      input.value = input.value.replace(/[^0-9]/g, "").slice(0, 1);
    });

    cellDiv.textContent = "";
    cellDiv.appendChild(input);
  });
}

function getDisplayedValue(r, c) {
  const cellDiv = boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
  const input = cellDiv.querySelector("input");
  if (input) return input.value;
  return cellDiv.textContent;
}

function usarPista() {
  if (pistaUsada) {
    showAlert("Pista", "Ya usaste una pista en este nivel.");
    return;
  }
  pistaUsada = true;
  score = Math.max(0, score - pistaCosto);
  playSfx(sfxPista);

  const hiddenPositions = [];
  for (let r = 0; r < level; r++) {
    for (let c = 0; c < level; c++) {
      if (hiddenMask[r][c]) hiddenPositions.push([r, c]);
    }
  }
  const revealCount = Math.max(1, Math.floor(hiddenPositions.length / 2));

  // barajar y tomar revealCount
  for (let i = hiddenPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [hiddenPositions[i], hiddenPositions[j]] = [hiddenPositions[j], hiddenPositions[i]];
  }
  const toReveal = hiddenPositions.slice(0, revealCount);

  toReveal.forEach(([r, c]) => {
    const cellDiv = boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    cellDiv.innerHTML = "";
    cellDiv.textContent = String(matrix[r][c]);
    hiddenMask[r][c] = false;
  });

  renderHeader();
  showAlert("Pista usada", `Se revelaron ${toReveal.length} números.\n(-${pistaCosto} puntos)`);
}

function checkLevel() {
  let correct = 0;
  const total = level * level;

  for (let r = 0; r < level; r++) {
    for (let c = 0; c < level; c++) {
      const expected = String(matrix[r][c]);
      const actual = getDisplayedValue(r, c);
      if (expected === actual) correct++;
    }
  }

  const puntos = correct * 10;
  score += puntos;
  saveHighscore();

  if (correct === total) {
    playSfx(sfxWin);
    score += level * 50;
    saveHighscore();
    renderHeader();
    showAlert("¡Correcto!", `Perfecto ${playerName}!\nGanaste ${puntos} puntos.`, () => {
      level += 1;
      if (level <= MAX_LEVEL) {
        startLevel();
      } else {
        endGame();
      }
    });
  } else {
    playSfx(sfxLose);
    score = Math.max(0, score - level * 15);
    saveHighscore();
    renderHeader();
    showAlert("Error", `Tuviste ${correct}/${total} correctos. Intenta otra vez.`);
  }
}

function endGame() {
  saveHighscore();
  stopMusic();
  showAlert("Juego terminado", `Gracias por jugar, ${playerName}!\nPuntaje final: ${score}`, () => {
    startMenu();
  });
}

// ---------- Menu de pausa ----------
function openPauseMenu() {
  stopMusic();
  pauseModal.classList.remove("hidden");
}

function resumeGame() {
  pauseModal.classList.add("hidden");
  playMusic(`level${level}`);
}

function restartLevel() {
  pauseModal.classList.add("hidden");
  startLevel();
}

function backToMenu() {
  pauseModal.classList.add("hidden");
  startMenu();
}

// ---------- Tutorial ----------
function openTutorial() {
  tutorialModal.classList.remove("hidden");
}

function closeTutorial() {
  tutorialModal.classList.add("hidden");
}

// ---------- Eventos ----------
startBtn.addEventListener("click", onStart);
nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") onStart();
});

tutorialBtn.addEventListener("click", openTutorial);
closeTutorialBtn.addEventListener("click", closeTutorial);

pistaBtn.addEventListener("click", usarPista);
checkBtn.addEventListener("click", checkLevel);
pauseBtn.addEventListener("click", openPauseMenu);

resumeBtn.addEventListener("click", resumeGame);
restartLevelBtn.addEventListener("click", restartLevel);
backMenuBtn.addEventListener("click", backToMenu);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !gameScreen.classList.contains("hidden") && pauseModal.classList.contains("hidden")) {
    openPauseMenu();
  }
});

// ---------- Inicio ----------
loadHighscores();
startMenu();
