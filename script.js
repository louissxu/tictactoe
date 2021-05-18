// PubSub Module
const events = (() => {
    const events = {}

    const on = (eventName, fn) => {
        events[eventName] = events[eventName] || [];
        if (!events[eventName].includes(fn)){
            events[eventName].push(fn);
        }
    }

    const off = (eventName, fn) => {
        if (events[eventName]) {
            for (let i = 0; i < events[eventName].length; i++) {
                if (events[eventName][i] === fn) {
                    events[eventName].splice(i, 1);
                    break;
                }
            }
        }
    }

    const emit = (eventName, data) => {
        if (events[eventName]) {
            events[eventName].forEach((fn) => {
                fn(data);
            });
        }
    }

    return {on,
            off,
            emit,}
})();

// UI Module
const ui = (() => {

    // Cache DOM
    const gameBoard = document.querySelector("#game-board");
    const gameControls = document.querySelector("#game-controls");
    const alertText = document.querySelector("#alert-text");

    const startGameButton = gameControls.querySelector("#start-game");
    const playerSettingsButtons = gameControls.querySelectorAll("input[type='radio']", "input[type='radio']+label")
    const resetGameButton = gameControls.querySelector("#reset-game");

    // UI Functions
    const clearBoard = () => {
        while (gameBoard.firstChild) {
            gameBoard.removeChild(gameBoard.lastChild);
        }
    }

    const renderBoard = (board) => {
        clearBoard();

        for (let y = 0; y < board.length; y++) {
            for (let x=0; x < board[y].length; x++) {
                const cell = document.createElement("button");
                cell.textContent = board[y][x];
                cell.setAttribute("data-x-coordinate", x);
                cell.setAttribute("data-y-coordinate", y);
                cell.classList.add("cell")

                // if (board[y][x] != "") {
                //     cell.setAttribute("disabled", "")
                // }

                gameBoard.appendChild(cell);
            }
        }
    }

    const disableBoard = () => {
        gameBoard.querySelectorAll(".cell").forEach((cell) => cell.setAttribute("disabled", ""));
    }

    const clickedStart = (e) => {
        events.emit("clickedStart", {
            p1Name: "Player 1",
            p1Symbol: "X",
            p1Computer: gameControls.querySelector("input[name='p1']:checked").value,  // Ref: https://stackoverflow.com/questions/9618504/how-to-get-the-selected-radio-button-s-value
            p2Name: "Player 2",
            p2Symbol: "O",
            p2Computer: gameControls.querySelector("input[name='p2']:checked").value,
        });
    }

    const clickedReset = (e) => {
        events.emit("clickedReset", "");
    }

    const clickedCell = (e) => {
        events.emit("clickedCell", {
            x: e.target.getAttribute("data-x-coordinate"),
            y: e.target.getAttribute("data-y-coordinate")
        });
    }

    const renderGameStart = () => {
        alertText.textContent = ""
        playerSettingsButtons.forEach((element) => element.setAttribute("disabled", ""));
        startGameButton.setAttribute("disabled", "");
        resetGameButton.removeAttribute("disabled");
    }

    const renderGameWon = (player) => {
        disableBoard();
        alertText.textContent = `${player.getName()} wins!`;
    }

    const renderGameDrawn = () => {
        disableBoard();
        alertText.textContent = `Draw! Try again.`;
    }

    const renderGameReset = (board) => {
        disableBoard();
        alertText.textContent = "";

        playerSettingsButtons.forEach((element) => element.removeAttribute("disabled"));
        startGameButton.removeAttribute("disabled");
        resetGameButton.setAttribute("disabled", "");
    }

    const renderPlayerUpdated = (player) => {
        alertText.textContent = `${player.getName()}'s turn. Place your ${player.getSymbol()}.`
    }

    // Bind Events
    gameControls.querySelector("#start-game").addEventListener("click", clickedStart);

    gameControls.querySelector("#reset-game").addEventListener("click", clickedReset)

    gameBoard.addEventListener("click", (e) => {
        if (e.target.classList.contains("cell")) {
            clickedCell(e)
        }
    })

    events.on("boardUpdated", renderBoard);
    events.on("gameStart", renderGameStart);
    events.on("gameWon", renderGameWon);
    events.on("gameDrawn", renderGameDrawn);
    events.on("gameReset", renderGameReset);
    events.on("nextPlayerUpdated", renderPlayerUpdated);

    // Return Object
    return {};
})();


// Player Factory
const Player = (playerName = null, symbol = null, ai = null) => {
    playerName = playerName ?? "Player 1";
    symbol = symbol ?? "X";
    ai = ai ?? false;

    const getSymbol = () => symbol;
    const getName = () => playerName;

    return {
        getSymbol,
        getName,
    }
}

// Logic Module
const logic = (() => {
    // Utility Functions
    const clone = (items) => items.map(item => Array.isArray(item) ? clone(item) : item);

    // Tic-Tac-Toe Logic
    const player = (board, p1, p2) => {
        turnDiff = board.flat().reduce((acc, cur) => {
            if (cur === p1.getSymbol()) {
                return acc + 1;
            } else if (cur === p2.getSymbol()) {
                return acc - 1;
            } else {
                return acc;
            }
        }, 0);

        if (turnDiff <= 0) {
            return p1;
        } else {
            return p2;
        }
    }

    const actions = (board) => {
        const allActions = [];

        for (let y = 0; y < board.length; y++) {
            for (let x = 0; x < board[y].length; x++) {
                const cell = board[y][x];
                if (!cell) {
                    allActions.push([x, y])
                }                
            }
        }

        return allActions;
    }

    const result = (board, p1, p2, action) => {
        const x = action.x;
        const y = action.y;

        const newBoard = clone(board);
        newBoard[y][x] = player(board, p1, p2).getSymbol()

        return newBoard
    }

    const winner = (board, p1, p2) => {
        let winner = null;

        // Check horizontals
        for (let y=0; y<board.length; y++) {
            const val = board[y][0];
            if (board[y].every((cell) => cell === val) && val != ""){
                winner = val;
            }
        }

        // Check verticals
        for (let x=0; x<board[0].length; x++) {
            const val = board[0][x];
            const column = board.map((row) => row[x])
            if (column.every((cell) => cell === val) && val != "") {
                winner = val;
            }
        }

        // Check diagonals
        if (board[0][0] === board[1][1] && board [0][0] === board[2][2] && board[0][0] != "") {
            winner = board[0][0];
        }
        if (board[0][2] === board[1][1] && board[0][2] === board[2][0] && board [0][2] != "") {
            winner = board[0][2];
        }

        if (winner === p1.getSymbol()) {
            return p1
        } else if (winner === p2.getSymbol()) {
            return p2
        } else {
            return null
        }
    }

    const terminal = (board, p1, p2) => {
        if (winner(board, p1, p2)) {
            return true
        } else if (actions(board).length <= 0) {
            return true
        } else {
            return false;
        }
    }

    // AI Functions

    // const minimax =

    return {
        clone,
        result,
        winner,
        terminal,
        player,
    }
})();


// Game Module
const game = (() => {
    let board = null
    let p1 = null
    let p2 = null

    const emptyBoard = [[null, null, null],
                        [null, null, null],
                        [null, null, null]];

    const startGame = (data) => {
        board = logic.clone(emptyBoard);
        p1 = Player(data.p1Name, data.p1Symbol, data.p1Computer);
        p2 = Player(data.p2Name, data.p2Symbol, data.p2Computer);

        events.emit("boardUpdated", board)
        events.emit("gameStart", "");
        events.emit("nextPlayerUpdated", logic.player(board, p1, p2))
    }

    const resolveBoard = () => {
        // Check if won or drawn
        const winner = logic.winner(board, p1, p2)
        if (winner) {
            events.emit("gameWon", winner);
        } else if (logic.terminal(board, p1, p2)) {
            events.emit("gameDrawn", "");
        }

    }

    const clickedCell = (cell) => {
        if (board[cell.y][cell.x] != null) {
            // Do nothing
        } else {
            board = logic.result(board, p1, p2, cell);
        }

        events.emit("boardUpdated", board);
        events.emit("nextPlayerUpdated", logic.player(board, p1, p2));

        resolveBoard();
    }

    const resetGame = () => {
        board = logic.clone(emptyBoard);
        events.emit("boardUpdated", board);
        events.emit("nextPlayerUpdated", logic.player(board, p1, p2));
        events.emit("gameReset");
    }

    // Bind Events
    events.on("clickedStart", startGame);
    events.on("clickedCell", clickedCell);
    events.on("clickedReset", resetGame);

})();