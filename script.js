// ============================================================
// Pong Definitive Edition - version web (HTML5 Canvas)
// Replica fiel del juego original hecho en Python + Pygame
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const musicEl = document.getElementById("music");
const sfxHit = document.getElementById("sfx-hit");
const sfxPunto = document.getElementById("sfx-punto");
const sfxPausa = document.getElementById("sfx-pausa");
const sfxSelect = document.getElementById("sfx-select");

function playSfx(el) {
  el.currentTime = 0;
  el.play().catch(() => {});
}

const WIDTH = canvas.width;   // 1280
const HEIGHT = canvas.height; // 720

// ---------- Fuentes ----------
const FONT_SCORE = "bold 90px Arial, sans-serif";
const FONT_TITULO = "bold 60px Arial, sans-serif";
const FONT_INICIO = "24px Arial, sans-serif";
const FONT_MENU = "bold 70px Arial, sans-serif";

// ---------- Boton de inicio (menu) ----------
const botonJugar = { x: WIDTH / 2 - 100, y: HEIGHT / 2 - 25, w: 200, h: 50 };

// ---------- Estado del juego ----------
let mostrarInicio = true;
let paused = false;
const menuOptions = ["Continuar", "Reiniciar", "Menú principal"];
let selectedOption = 0;

// ---------- Pelota ----------
class Ball {
  constructor() {
    this.radius = 15;
    this.baseSpeed = 10;
    this.reset();
  }

  reset() {
    this.x = WIDTH / 2;
    this.y = HEIGHT / 2;
    this.speed = this.baseSpeed;
    let angle = (Math.random() * (Math.PI / 2)) - Math.PI / 4; // -45° a 45°
    if (Math.random() < 0.5) angle += Math.PI;
    this.dx = Math.cos(angle);
    this.dy = Math.sin(angle);
  }

  move() {
    if (this.y - this.radius <= 0 || this.y + this.radius >= HEIGHT) {
      this.dy *= -1;
    }
    this.x += this.dx * this.speed;
    this.y += this.dy * this.speed;
  }

  getRect() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      w: this.radius * 2,
      h: this.radius * 2
    };
  }

  bouncePadel() {
    this.dx *= -1;
    this.dy += (Math.random() * 0.5) - 0.25; // -0.25 a 0.25
    const length = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    this.dx /= length;
    this.dy /= length;
    this.speed += 0.5;
    playSfx(sfxHit);
  }

  draw() {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------- Paddle ----------
class Padel {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.speed = 12;
  }

  draw() {
    ctx.fillStyle = "white";
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }

  getRect() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  checkCollision(ball) {
    return rectsIntersect(this.getRect(), ball.getRect());
  }
}

function rectsIntersect(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

// ---------- Posicion inicial de padels y pelota ----------
const p1 = new Padel(40, HEIGHT / 2 - 75, 20, 150);
const p2 = new Padel(WIDTH - 60, HEIGHT / 2 - 75, 20, 150);
const ball = new Ball();

// ---------- Marcador ----------
let scoreP1 = 0;
let scoreP2 = 0;

// ---------- Entradas de teclado ----------
const keysPressed = {};
let backspaceLocked = false; // evita parpadeo por tecla sostenida

window.addEventListener("keydown", (e) => {
  keysPressed[e.code] = true;

  if (mostrarInicio) return;

  // Pausa con BACKSPACE
  if (e.code === "Backspace" && !backspaceLocked) {
    playSfx(sfxPausa);
    paused = !paused;
    backspaceLocked = true;
    if (paused) {
      musicEl.pause();
    } else {
      musicEl.play().catch(() => {});
    }
  }

  if (paused) {
    if (e.code === "ArrowUp") {
      playSfx(sfxSelect);
      selectedOption = (selectedOption - 1 + menuOptions.length) % menuOptions.length;
    }
    if (e.code === "ArrowDown") {
      playSfx(sfxSelect);
      selectedOption = (selectedOption + 1) % menuOptions.length;
    }
    if (e.code === "Enter") {
      const opcion = menuOptions[selectedOption];
      if (opcion === "Continuar") {
        paused = false;
        musicEl.play().catch(() => {});
      } else if (opcion === "Reiniciar") {
        scoreP1 = 0;
        scoreP2 = 0;
        ball.reset();
        paused = false;
        musicEl.currentTime = 0;
        musicEl.play().catch(() => {});
      } else if (opcion === "Menú principal") {
        volverAlInicio();
      }
    }
  }
});

window.addEventListener("keyup", (e) => {
  keysPressed[e.code] = false;
  if (e.code === "Backspace") backspaceLocked = false;
});

// ---------- Clics del mouse (pantalla de inicio) ----------
canvas.addEventListener("click", (e) => {
  if (!mostrarInicio) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = WIDTH / rect.width;
  const scaleY = HEIGHT / rect.height;
  const clickX = (e.clientX - rect.left) * scaleX;
  const clickY = (e.clientY - rect.top) * scaleY;

  if (dentroDe(clickX, clickY, botonJugar)) {
    mostrarInicio = false;
    musicEl.currentTime = 0;
    musicEl.play().catch(() => {});
  }
});

function dentroDe(x, y, boton) {
  return x >= boton.x && x <= boton.x + boton.w &&
         y >= boton.y && y <= boton.y + boton.h;
}

// Vuelve a la pantalla principal, reiniciando el estado de la partida
function volverAlInicio() {
  mostrarInicio = true;
  paused = false;
  selectedOption = 0;
  scoreP1 = 0;
  scoreP2 = 0;
  ball.reset();
  p1.y = HEIGHT / 2 - p1.h / 2;
  p2.y = HEIGHT / 2 - p2.h / 2;
  musicEl.pause();
  musicEl.currentTime = 0;
}

// ---------- Dibujar pantalla de inicio ----------
function pantallaInicio() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Titulo
  ctx.fillStyle = "white";
  ctx.font = FONT_TITULO;
  ctx.textAlign = "center";
  ctx.fillText("PONG DEFINITIVE EDITION", WIDTH / 2, HEIGHT / 2 - 160);

  // Boton
  ctx.fillStyle = "yellow";
  ctx.fillRect(botonJugar.x, botonJugar.y, botonJugar.w, botonJugar.h);

  ctx.font = FONT_INICIO;
  ctx.fillStyle = "black";
  ctx.fillText("Jugar", botonJugar.x + botonJugar.w / 2, botonJugar.y + 32);

  ctx.textAlign = "left";
}

// ---------- Bucle principal ----------
function update() {
  if (paused) return;

  // Controles
  if (keysPressed["KeyW"] && p1.y > 0) {
    p1.y -= p1.speed;
  }
  if (keysPressed["KeyS"] && p1.y + p1.h < HEIGHT) {
    p1.y += p1.speed;
  }
  if (keysPressed["ArrowUp"] && p2.y > 0) {
    p2.y -= p2.speed;
  }
  if (keysPressed["ArrowDown"] && p2.y + p2.h < HEIGHT) {
    p2.y += p2.speed;
  }

  ball.move();

  // Colisiones con padels
  if (p1.checkCollision(ball)) {
    ball.bouncePadel();
    ball.x = p1.x + p1.w + ball.radius;
  }
  if (p2.checkCollision(ball)) {
    ball.bouncePadel();
    ball.x = p2.x - ball.radius;
  }

  // Puntos
  if (ball.x < 0) {
    scoreP2 += 1;
    ball.reset();
    ball.speed += 1;
    playSfx(sfxPunto);
  }
  if (ball.x > WIDTH) {
    scoreP1 += 1;
    ball.reset();
    ball.speed += 1;
    playSfx(sfxPunto);
  }
}

function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Linea divisoria central (punteada)
  ctx.fillStyle = "white";
  for (let y = 0; y < HEIGHT; y += 40) {
    ctx.fillRect(WIDTH / 2 - 5, y, 10, 20);
  }

  // Marcador
  ctx.font = FONT_SCORE;
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText(`${scoreP1}   ${scoreP2}`, WIDTH / 2, 90);
  ctx.textAlign = "left";

  if (!paused) {
    p1.draw();
    p2.draw();
    ball.draw();
  } else {
    // Menu de pausa
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.textAlign = "center";
    ctx.fillStyle = "yellow";
    ctx.font = FONT_MENU;
    ctx.fillText("PAUSA", WIDTH / 2, 170);

    menuOptions.forEach((opcion, i) => {
      ctx.fillStyle = (i === selectedOption) ? "cyan" : "white";
      ctx.fillText(opcion, WIDTH / 2, 320 + i * 150);
    });
    ctx.textAlign = "left";
  }
}

function gameLoop() {
  if (mostrarInicio) {
    pantallaInicio();
  } else {
    update();
    draw();
  }
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
