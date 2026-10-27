// ===== Конфигурация сложностей =====
const LEVELS = {
    easy:   { rows: 9,  cols: 9,  mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard:   { rows: 16, cols: 30, mines: 99 }
};

// ===== Состояние игры =====
let rows, cols, totalMines;
let board = [];
let started = false;
let gameOver = false;
let flagsLeft = 0;
let openedCount = 0;
let timerId = null;
let seconds = 0;

// ===== DOM =====
const boardEl = document.getElementById('board');
const minesLeftEl = document.getElementById('mines-left');
const timerEl = document.getElementById('timer');
const messageEl = document.getElementById('message');
const difficultyEl = document.getElementById('difficulty');
const restartBtn = document.getElementById('restart');
const startScreenEl = document.getElementById('start-screen');
const toMenuBtn = document.getElementById('to-menu');

// ===== Функции меню =====
window.startFromMenu = function(level) {
    difficultyEl.value = level; // Устанавливаем выбранную сложность
    startScreenEl.classList.add('hidden'); // Прячем меню
    startGame(); // Запускаем игру
};

toMenuBtn.addEventListener('click', () => {
    clearInterval(timerId);
    startScreenEl.classList.remove('hidden'); // Показываем меню
});

// ===== Запуск игры =====
restartBtn.addEventListener('click', startGame);
difficultyEl.addEventListener('change', startGame);

function startGame() {
    const cfg = LEVELS[difficultyEl.value];
    rows = cfg.rows;
    cols = cfg.cols;
    totalMines = cfg.mines;

    board = [];
    started = false;
    gameOver = false;
    flagsLeft = totalMines;
    openedCount = 0;
    seconds = 0;
    clearInterval(timerId);
    timerId = null;

    minesLeftEl.textContent = '💣 ' + flagsLeft;
    timerEl.textContent = '⏱ 0';
    messageEl.textContent = '';

    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            row.push({ mine: false, open: false, flagged: false, count: 0 });
        }
        board.push(row);
    }

    render();
}

// ===== Отрисовка поля =====
function render() {
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
    if (window.innerWidth < 600) {
        boardEl.style.gridTemplateColumns = `repeat(${cols}, 26px)`;
    }

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.r = r;
            cell.dataset.c = c;

            cell.addEventListener('click', () => leftClick(r, c));
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                rightClick(r, c);
            });

            boardEl.appendChild(cell);
        }
    }
    updateCellViews();
}

// ===== Обновление визуала ячеек =====
function updateCellViews() {
    const cells = boardEl.children;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            const el = cells[idx];
            const cell = board[r][c];

            el.className = 'cell';
            el.textContent = '';

            if (cell.open) {
                el.classList.add('open');
                if (cell.mine) {
                    el.classList.add('mine');
                    el.textContent = '💣';
                } else if (cell.count > 0) {
                    el.textContent = cell.count;
                    el.classList.add('n' + cell.count);
                }
            } else if (cell.flagged) {
                el.classList.add('flagged');
                el.textContent = '🚩';
            }
        }
    }
}

// ===== Расстановка мин =====
function placeMines(safeR, safeC) {
    let placed = 0;
    while (placed < totalMines) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);

        if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
        if (board[r][c].mine) continue;

        board[r][c].mine = true;
        placed++;
    }

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c].mine) continue;
            board[r][c].count = neighbors(r, c).filter(([nr, nc]) => board[nr][nc].mine).length;
        }
    }
}

function neighbors(r, c) {
    const res = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                res.push([nr, nc]);
            }
        }
    }
    return res;
}

function startTimer() {
    timerId = setInterval(() => {
        seconds++;
        timerEl.textContent = '⏱ ' + seconds;
    }, 1000);
}

function leftClick(r, c) {
    if (gameOver) return;
    const cell = board[r][c];
    if (cell.open || cell.flagged) return;

    if (!started) {
        started = true;
        placeMines(r, c);
        startTimer();
    }

    if (cell.mine) {
        cell.open = true;
        endGame(false, r, c);
        return;
    }

    openCell(r, c);
    updateCellViews();
    checkWin();
}

function openCell(r, c) {
    const cell = board[r][c];
    if (cell.open || cell.flagged) return;

    cell.open = true;
    openedCount++;

    if (cell.count === 0) {
        neighbors(r, c).forEach(([nr, nc]) => openCell(nr, nc));
    }
}

function rightClick(r, c) {
    if (gameOver) return;
    const cell = board[r][c];
    if (cell.open) return;

    if (cell.flagged) {
        cell.flagged = false;
        flagsLeft++;
    } else {
        if (flagsLeft === 0) return;
        cell.flagged = true;
        flagsLeft--;
    }

    minesLeftEl.textContent = '💣 ' + flagsLeft;
    updateCellViews();
}

function checkWin() {
    if (openedCount === rows * cols - totalMines) {
        endGame(true);
    }
}

function endGame(win, explodedR, explodedC) {
    gameOver = true;
    clearInterval(timerId);

    if (win) {
        messageEl.textContent = '🎉 Победа!';
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (board[r][c].mine) board[r][c].flagged = true;
            }
        }
        minesLeftEl.textContent = '💣 0';
    } else {
        messageEl.textContent = '💥 Бум! Игра окончена';
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (board[r][c].mine) board[r][c].open = true;
            }
        }
        const idx = explodedR * cols + explodedC;
        updateCellViews();
        boardEl.children[idx].classList.add('exploded');
        return;
    }
    updateCellViews();
}

// ===== Управление для телефона (долгий тап) =====
let touchTimer = null;
boardEl.addEventListener('touchstart', (e) => {
    const target = e.target.closest('.cell');
    if (!target) return;
    touchTimer = setTimeout(() => {
        rightClick(+target.dataset.r, +target.dataset.c);
        touchTimer = null;
    }, 500);
}, { passive: true });

boardEl.addEventListener('touchend', (e) => {
    if (touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;
    }
});

boardEl.addEventListener('touchmove', () => {
    if (touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;
    }
}, { passive: true });
