const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestEl = document.querySelector("#best");
const overlay = document.querySelector("#overlay");
const overlayTitle = document.querySelector("#overlayTitle");
const overlayText = document.querySelector("#overlayText");
const startBtn = document.querySelector("#startBtn");
const padButtons = document.querySelectorAll(".pad-btn");

const cells = 20;
const cellSize = canvas.width / cells;
const tickMs = 105;
const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

let snake;
let food;
let dir;
let nextDir;
let score;
let best = Number(localStorage.getItem("snakeBest") || 0);
let timer = null;
let running = false;
let paused = false;

bestEl.textContent = best;

function reset() {
  snake = [
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 },
  ];
  dir = directions.right;
  nextDir = directions.right;
  score = 0;
  scoreEl.textContent = score;
  food = spawnFood();
  paused = false;
  draw();
}

function spawnFood() {
  const free = [];
  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      if (!snake.some((part) => part.x === x && part.y === y)) {
        free.push({ x, y });
      }
    }
  }
  return free[Math.floor(Math.random() * free.length)];
}

function startGame() {
  reset();
  running = true;
  overlay.classList.add("hidden");
  clearInterval(timer);
  timer = setInterval(step, tickMs);
}

function setDirection(name) {
  const chosen = directions[name];
  if (!chosen || (chosen.x + dir.x === 0 && chosen.y + dir.y === 0)) {
    return;
  }
  nextDir = chosen;
}

function step() {
  if (paused) return;

  dir = nextDir;
  const head = snake[0];
  const next = { x: head.x + dir.x, y: head.y + dir.y };
  const hitWall = next.x < 0 || next.x >= cells || next.y < 0 || next.y >= cells;
  const hitSelf = snake.some((part) => part.x === next.x && part.y === next.y);

  if (hitWall || hitSelf) {
    endGame();
    return;
  }

  snake.unshift(next);
  const ateFood = next.x === food.x && next.y === food.y;

  if (ateFood) {
    score += 10;
    scoreEl.textContent = score;
    best = Math.max(best, score);
    bestEl.textContent = best;
    localStorage.setItem("snakeBest", String(best));
    food = spawnFood();
  } else {
    snake.pop();
  }

  draw();
}

function endGame() {
  running = false;
  clearInterval(timer);
  overlayTitle.textContent = "游戏结束";
  overlayText.textContent = `本局得分 ${score}`;
  startBtn.textContent = "再来一局";
  overlay.classList.remove("hidden");
}

function togglePause() {
  if (!running) {
    startGame();
    return;
  }
  paused = !paused;
  if (paused) {
    overlayTitle.textContent = "已暂停";
    overlayText.textContent = "按空格继续";
    startBtn.textContent = "继续游戏";
    overlay.classList.remove("hidden");
  } else {
    overlay.classList.add("hidden");
  }
}

function drawRoundedCell(x, y, color, glow = false) {
  const gap = 3;
  const size = cellSize - gap * 2;
  const radius = 7;
  const px = x * cellSize + gap;
  const py = y * cellSize + gap;

  ctx.save();
  ctx.fillStyle = color;
  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
  }
  ctx.beginPath();
  ctx.roundRect(px, py, size, size, radius);
  ctx.fill();
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawFood();
  snake.forEach((part, index) => {
    const shade = index === 0 ? "#4ade80" : index % 2 ? "#22d3ee" : "#14b8a6";
    drawRoundedCell(part.x, part.y, shade, index === 0);
  });

  const head = snake[0];
  ctx.fillStyle = "#061016";
  const eyeOffset = cellSize * 0.22;
  const eyeSize = 3.4;
  ctx.beginPath();
  ctx.arc(head.x * cellSize + cellSize * 0.4, head.y * cellSize + eyeOffset, eyeSize, 0, Math.PI * 2);
  ctx.arc(head.x * cellSize + cellSize * 0.6, head.y * cellSize + eyeOffset, eyeSize, 0, Math.PI * 2);
  ctx.fill();
}

function drawFood() {
  const centerX = food.x * cellSize + cellSize / 2;
  const centerY = food.y * cellSize + cellSize / 2;

  ctx.save();
  ctx.fillStyle = "#fb7185";
  ctx.shadowColor = "#fb7185";
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(centerX, centerY, cellSize * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.arc(centerX - 3, centerY - 4, cellSize * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

document.addEventListener("keydown", (event) => {
  const keyMap = {
    ArrowUp: "up",
    w: "up",
    W: "up",
    ArrowDown: "down",
    s: "down",
    S: "down",
    ArrowLeft: "left",
    a: "left",
    A: "left",
    ArrowRight: "right",
    d: "right",
    D: "right",
  };

  if (keyMap[event.key]) {
    event.preventDefault();
    setDirection(keyMap[event.key]);
  }

  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    togglePause();
  }
});

padButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setDirection(button.dataset.dir);
    if (!running) startGame();
  });
});

startBtn.addEventListener("click", () => {
  if (running && paused) {
    togglePause();
  } else {
    startGame();
  }
});

reset();
