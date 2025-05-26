let board = [];
let rows = 8;
let columns = 8;
let minesCount = 10;
let timerInterval;
let timeLeft = 180; // 3 דקות

const newGameBtn = document.getElementById("newGameBtn");
newGameBtn.addEventListener("click", startNewGame);

const boardElement = document.querySelector(".board");
let timerStarted = false;

// פונקציה שמשווה בין שני מיקומים (מניעת מוקשים כפולים)
function positionMatch(a, b) {
  return a.x === b.x && a.y === b.y;
}
function placeMinePositions() {
  const positions = [];

  while (positions.length < minesCount) {
    const newPosition = {
      x: Math.floor(Math.random() * rows),
      y: Math.floor(Math.random() * columns),
    };
    const alreadyExists = positions.some(function (pos) {
      return pos.x === newPosition.x && pos.y === newPosition.y;
    });
    if (!alreadyExists) {
      positions.push(newPosition);
    }
  }

  return positions;
}

//משחק חדש
function startNewGame() {
  // Get board size from input
  let size = parseInt(boardSizeInput.value, 10);
  if (isNaN(size) || size < 2) size = 2;
  if (size > 10) size = 10;
  rows = columns = size;
  boardSizeInput.value = size;

  // Limit mines to max cells
  const maxMines = rows * columns;
  minesCount = parseInt(minesInput.value, 10) || 10;
  if (minesCount > maxMines) {
    minesCount = maxMines;
    minesInput.value = maxMines;
  }

  timerStarted = false;
  clearInterval(timerInterval);
  timeLeft = 180;
  updateTimerDisplay();

  // הסר הודעת פסד אם קיימת
  boardElement.innerHTML = "";
  board = [];
  const oldMsg = document.getElementById("loseMsg");
  if (oldMsg) oldMsg.remove();

  // הסר הודעת ניצחון אם קיימת
  const oldWin = document.getElementById("winMsg");
  if (oldWin) oldWin.remove();

  // הנחת מוקשים
  const minePositions = placeMinePositions();

  // Update board grid style:
  boardElement.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  boardElement.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  boardElement.style.setProperty("--board-size", rows);

  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < columns; c++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      tile.setAttribute("data-row", r);
      tile.setAttribute("data-col", c);
      tile.setAttribute("data-status", "hidden");

      // בדיקה אם יש מוקש במיקום הזה
      const hasMine = minePositions.some(function (pos) {
        return pos.x === r && pos.y === c;
      });
      if (hasMine) {
        tile.setAttribute("data-mine", "true");
      } else {
        tile.setAttribute("data-mine", "false");
      }

      boardElement.appendChild(tile);
      row.push(tile);

      // מאזין ללחיצה על תא
      tile.addEventListener("click", function () {
        tile.classList.remove("flipped");
        void tile.offsetWidth; // לאפס את האנימציה
        tile.classList.add("flipped");

        // במובייל: אם במצב דגל, שים/הסר דגל במקום לחשוף
        if (window.innerWidth <= 600 && mobileFlagMode) {
          if (!tile.classList.contains("flagged")) {
            tile.classList.add("flagged");
          } else {
            tile.classList.remove("flagged");
          }
          checkWin();
          return; // לא לחשוף את התא!
        }

        // מצב רגיל (חפירה)
        if (!timerStarted) {
          startTimer();
          timerStarted = true;
        }
        if (tile.getAttribute("data-mine") === "true") {
          //tile.setAttribute("data-status", "mine"); // שורה לבדיקה של המוקשים אל תשכח למחוק
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
              const selector = `[data-row="${i}"][data-col="${j}"]`;
              const cell = document.querySelector(selector);
              if (cell.getAttribute("data-mine") === "true") {
                cell.setAttribute("data-status", "mine");
              }
            }
          }
          // הסר הודעה קודמת אם קיימת
          const oldMsg = document.getElementById("loseMsg");
          if (oldMsg) oldMsg.remove();

          // צור הודעת הפסד
          const msg = document.createElement("p");
          msg.id = "loseMsg";
          msg.className = "lose-message";
          msg.textContent = "הפסדת!";
          document.body.appendChild(msg);
          setTimeout(function () {
            startNewGame();
          }, 4000);
        } else {
          // חשוף את התא והצג מספר מוקשים מסביב
          const minesAround = countMinesAround(r, c);
          if (minesAround > 0) {
            tile.textContent = minesAround;
          }
          tile.setAttribute("data-status", "number");
          tile.classList.add("revealed");
          tile.classList.add("number-" + minesAround);
          if (minesAround === 0) {
            tile.textContent = "0";
          } else {
            tile.textContent = minesAround;
          }
        }
      });

      // לחיצה ימנית דגל
      tile.addEventListener("contextmenu", function (addflag) {
        addflag.preventDefault();
        if (!tile.classList.contains("flagged")) {
          tile.classList.add("flagged");
        } else {
          tile.classList.remove("flagged");
        }

        // בדוק ניצחון אחרי כל שינוי דגל
        checkWin();
      });
    }
    board.push(row);
  }

  // עדכן את מונה המוקשים
  const mineCountElement = document.querySelector("[minecount]");
  if (mineCountElement) {
    mineCountElement.textContent = minesCount;
  }
}

function checkWin() {
  // אסוף את כל התאים עם מוקש
  const allTiles = document.querySelectorAll(".tile");
  let allMinesFlagged = true;
  let minesFlaggedCount = 0;

  allTiles.forEach(function (tile) {
    if (tile.getAttribute("data-mine") === "true") {
      if (!tile.classList.contains("flagged")) {
        allMinesFlagged = false;
      } else {
        minesFlaggedCount++;
      }
    }
  });

  // אם כל המוקשים מסומנים בדגל
  if (allMinesFlagged && minesFlaggedCount === minesCount) {
    // צור הודעת ניצחון
    const winMsg = document.createElement("p");
    winMsg.id = "winMsg";
    winMsg.className = "lose-message";
    winMsg.textContent = "ניצחת!";
    document.body.appendChild(winMsg);
  }
}

function countMinesAround(row, col) {
  let count = 0;

  // למעלה
  if (row > 0 && board[row - 1][col].getAttribute("data-mine") === "true") {
    count++;
  }
  // למטה
  if (
    row < rows - 1 &&
    board[row + 1][col].getAttribute("data-mine") === "true"
  ) {
    count++;
  }
  // שמאלה
  if (col > 0 && board[row][col - 1].getAttribute("data-mine") === "true") {
    count++;
  }
  // ימינה
  if (
    col < columns - 1 &&
    board[row][col + 1].getAttribute("data-mine") === "true"
  ) {
    count++;
  }
  // אלכסון שמאל למעלה
  if (
    row > 0 &&
    col > 0 &&
    board[row - 1][col - 1].getAttribute("data-mine") === "true"
  ) {
    count++;
  }
  // אלכסון ימין למעלה
  if (
    row > 0 &&
    col < columns - 1 &&
    board[row - 1][col + 1].getAttribute("data-mine") === "true"
  ) {
    count++;
  }
  // אלכסון שמאל למטה
  if (
    row < rows - 1 &&
    col > 0 &&
    board[row + 1][col - 1].getAttribute("data-mine") === "true"
  ) {
    count++;
  }
  // אלכסון ימין למטה
  if (
    row < rows - 1 &&
    col < columns - 1 &&
    board[row + 1][col + 1].getAttribute("data-mine") === "true"
  ) {
    count++;
  }

  return count;
}

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 180;
  updateTimerDisplay();
  timerInterval = setInterval(function () {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      showLoseMsgByTimer();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const timerElement = document.getElementById("timer");
  if (timerElement) {
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    timerElement.textContent = min + ":" + (sec < 10 ? "0" : "") + sec;
  }
}

function showLoseMsgByTimer() {
  // הסר הודעה קודמת אם קיימת
  const oldMsg = document.getElementById("loseMsg");
  if (oldMsg) oldMsg.remove();

  const msg = document.createElement("p");
  msg.id = "loseMsg";
  msg.className = "lose-message";
  msg.textContent = "הזמן נגמר! הפסדת!";
  document.body.appendChild(msg);
}

const minesInput = document.getElementById("minesInput");
minesInput.addEventListener("input", function () {
  const maxMines = rows * columns;
  if (parseInt(this.value, 10) > maxMines) {
    this.value = maxMines;
  }
});

let mobileFlagMode = false;
const toggleFlagBtn = document.getElementById("toggleFlagBtn");
const toggleFlagImg = document.getElementById("toggleFlagImg");

if (toggleFlagBtn) {
  toggleFlagBtn.addEventListener("click", function () {
    mobileFlagMode = !mobileFlagMode;
    toggleFlagImg.src = mobileFlagMode
      ? "flag-removebg-preview.png"
      : "shovel-removebg-preview.png";
    toggleFlagImg.alt = mobileFlagMode ? "Flag Mode" : "Shovel Mode";
  });
}

document
  .querySelector(".difficulty-btn.easy")
  .addEventListener("click", function () {
    minesInput.value = 3;
    boardSizeInput.value = 4;
    startNewGame();
  });
document
  .querySelector(".difficulty-btn.medium")
  .addEventListener("click", function () {
    minesInput.value = 10;
    boardSizeInput.value = 7;
    startNewGame();
  });
document
  .querySelector(".difficulty-btn.hard")
  .addEventListener("click", function () {
    minesInput.value = 30;
    boardSizeInput.value = 10;
    startNewGame();
  });
