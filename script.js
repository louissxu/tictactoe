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

    const emit = (eventName, ...dataArgs) => {
        if (events[eventName]) {
            events[eventName].forEach((fn) => {
                fn(...dataArgs);
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
    const playerSettingsButtons = gameControls.querySelectorAll("input, select, input[type='radio']+label")
    const resetGameButton = gameControls.querySelector("#reset-game");

    const canvas = document.querySelector("#canvas");

    // UI Functions
    const clearBoard = () => {
        while (gameBoard.firstChild) {
            gameBoard.removeChild(gameBoard.lastChild);
        }
    }

    const renderBoard = (state) => {
        clearBoard();
        const board = state.board.getBoard();

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
        // Cache DOM
        p1Name = gameControls.querySelector("#p1-name")
        p1Symbol = gameControls.querySelector("#p1-symbol")
        p1Computer= gameControls.querySelector("input[name='p1']:checked")  // Ref: https://stackoverflow.com/questions/9618504/how-to-get-the-selected-radio-button-s-value
        p2Name= gameControls.querySelector("#p2-name")
        p2Symbol= gameControls.querySelector("#p2-symbol")
        p2Computer= gameControls.querySelector("input[name='p2']:checked")

        // Fill default values if nothing entered
        p1NameVal = String(p1Name.value) || "Player 1";
        p1SymbolVal = String(p1Symbol.value) || "X";
        p1ComputerVal = String(p1Computer.value) || "human";
        p2NameVal = String(p2Name.value) || "Player 2";
        p2SymbolVal = String(p2Symbol.value) || "O";
        p2ComputerVal = String(p2Computer.value) || "human";

        events.emit("clickedStart", {
            p1Name: p1NameVal,
            p1Symbol: p1SymbolVal,
            p1Computer: p1ComputerVal,
            p2Name: p2NameVal,
            p2Symbol: p2SymbolVal,
            p2Computer: p2ComputerVal,
        });
    }

    const clickedReset = (e) => {
        events.emit("clickedReset", "");
    }

    const clickedCell = (e) => {
        events.emit("clickedCell", [
            e.target.getAttribute("data-x-coordinate"),
            e.target.getAttribute("data-y-coordinate")
        ]);
    }

    const drawLine = (ctx, begin, end, stroke="black", width=1) => {
        // Using canvas. Ref: https://www.javascripttutorial.net/web-apis/javascript-draw-line/
        if (stroke) {
            ctx.strokeStyle = stroke;
        }

        if (width) {
            ctx.lineWidth = width;
        }

        ctx.beginPath();
        ctx.moveTo(...begin);
        ctx.lineTo(...end);
        ctx.stroke();
    }

    const clearCanvas = () => {
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    const renderWinningPosition = (pairs) => {
        // Geometric transforms
        // Scales up to display grid size
        const scaledPairs = pairs.map(([[ax, ay], [bx, by]]) => [[ax*100, ay*100], [bx*100, by*100]]);
        // Moves origin so it is centred on grid
        const shiftedPairs = scaledPairs.map(([[ax, ay], [bx, by]]) => [[ax+50, ay+50], [bx+50, by+50]]);
        // Vector scales to "extend" the line past the centre of the squares
        const vectorScaledPairs = shiftedPairs.map(([[ax, ay], [bx, by]]) => {
            // // Centre between both points
            // const cx = ax + (0.5*(-ax + bx));
            // const cy = ay + (0.5*(-ay + by));
            
            // // Return scaled vector from the centre (ie extends the line 10% either way)
            // return [[cx + (1.2*(-cx + ax)), cy + (1.2*(-cy + ay))], [cx + (1.2*(-cx + bx)), cy + (1.2*(-cy + by))]]

            // Vector from a -> b
            const vx = -ax + bx;
            const vy = -ay + by;

            // Length of V (ie. |a->b|)
            const vLength = Math.sqrt(vx**2 + vy**2);

            // Unit vector from a -> b of 1 pixel length (ie. v / |v|)
            const ux = vx / vLength;
            const uy = vy / vLength;
            
            // Return pairs projected out an extra 20 pixels length in the unit vector direction
            // ie a = a-20*u and b=b+20*u
            return [[ax-20*ux, ay-20*uy], [bx+20*ux, by+20*uy]]
        })

        // Draw line for each winning position
        const context = canvas.getContext("2d");
        vectorScaledPairs.forEach(([start, end]) => {
            drawLine(context, start, end, stroke="black", width=5);
        })
        canvas.style.display = "block";
    }

    const renderGameStart = () => {
        alertText.textContent = ""
        playerSettingsButtons.forEach((element) => element.setAttribute("disabled", ""));
        startGameButton.setAttribute("disabled", "");
        resetGameButton.removeAttribute("disabled");
    }

    const renderGameWon = (data) => {
        disableBoard();
        alertText.textContent = `${data.player.getName()} wins!`;
        renderWinningPosition (data.pairs);
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

        clearCanvas();
        canvas.style.display = "none";
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
    ai = ai ?? "human";

    const getSymbol = () => symbol;
    const getName = () => playerName;
    const isAi = () => ai == "ai" ? true : false;

    return {
        getSymbol,
        getName,
        isAi,
    }
}

// Board Factory
const Board = (board = null) => {
    if (board) {
        board = logic.clone(board)
    } else {
        board = [[null, null, null],
                [null, null, null],
                [null, null, null]]
    }
    
    const getBoard = () => board;

    const setCell = (coord, val) => {
        const x = coord[0];
        const y = coord[1];
        board[y][x] = val;
    }

    return {
        getBoard,
        setCell,
    }
}

// State Factory
const State = (board, p1, p2) => {
    return {
        board,
        p1,
        p2,
    }
}

// Logic Module
const logic = (() => {
    // Utility Functions
    const clone = (items) => items.map(item => Array.isArray(item) ? clone(item) : item);

    // Tic-Tac-Toe Logic
    const player = (state) => {
        turnDiff = state.board.getBoard().flat().reduce((acc, cur) => {
            if (cur === state.p1.getSymbol()) {
                return acc + 1;
            } else if (cur === state.p2.getSymbol()) {
                return acc - 1;
            } else {
                return acc;
            }
        }, 0);

        if (turnDiff <= 0) {
            return state.p1;
        } else {
            return state.p2;
        }
    }

    const actions = (state) => {
        const allActions = [];

        for (let y = 0; y < state.board.getBoard().length; y++) {
            for (let x = 0; x < state.board.getBoard()[y].length; x++) {
                const cell = state.board.getBoard()[y][x];
                if (!cell) {
                    allActions.push([x, y])
                }                
            }
        }

        return allActions;
    }

    const result = (state, action) => {
        const x = action[0];
        const y = action[1];

        const newBoard = Board(state.board.getBoard());
        newBoard.setCell(action, player(state).getSymbol())

        return State(newBoard, state.p1, state.p2);
    }

    const winner = (state) => {
        let winningSymbol = null;
        let winningPairs = [];

        const board = state.board.getBoard();

        // Check horizontals
        for (let y=0; y<board.length; y++) {
            const val = board[y][0];
            if (board[y].every((cell) => cell === val) && val != null){
                winningSymbol = val;
                winningPairs.push([[0,y],[2,y]]);
            }
        }

        // Check verticals
        for (let x=0; x<board[0].length; x++) {
            const val = board[0][x];
            const column = board.map((row) => row[x])
            if (column.every((cell) => cell === val) && val != null) {
                winningSymbol = val;
                winningPairs.push([[x,0],[x,2]]);
            }
        }

        // Check diagonals
        if (board[0][0] === board[1][1] && board [0][0] === board[2][2] && board[0][0] != null) {
            winningSymbol = board[0][0];
            winningPairs.push([[0,0], [2,2]]);
        }
        if (board[0][2] === board[1][1] && board[0][2] === board[2][0] && board [0][2] != null) {
            winningSymbol = board[0][2];
            winningPairs.push([[0,2], [2,0]]);
        }

        if (winningSymbol === state.p1.getSymbol()) {
            return {player: state.p1, pairs: winningPairs};
        } else if (winningSymbol === state.p2.getSymbol()) {
            return {player: state.p2, pairs: winningPairs};
        } else {
            return null
        }
    }

    const terminal = (state) => {
        if (winner(state)) {
            return true
        } else if (actions(state).length <= 0) {
            return true
        } else {
            return false;
        }
    }

    // AI Functions
    const utility = (state) => {
        const data = winner(state) ?? ""
        const winningPlayer = data.player ?? ""
        if (winningPlayer === state.p1) {
            return 1;
        } else if (winningPlayer === state.p2) {
            return -1;
        } else {
            return 0;
        }
    }

    const shuffled = (array) => {
        // Ref: https://bost.ocks.org/mike/shuffle/compare.html
        // Fisher-Yates shuffle (but not in-place)
        const newArray = [...array];
        for (let i = newArray.length-1; i >= 0; i--){
            let j = Math.floor(Math.random() * (i+1))
            let temp = newArray[j];
            newArray[j] = newArray[i];
            newArray[i] = temp;
        }
        return newArray
    }

    const hash = (state) => {
        const hash = state.board.getBoard()
            .flat()
            .map(cell => cell ?? "_") 
            .join("")
        return hash
    }

    const alphabeta = (state, depth, alpha, beta, maximizingPlayer, counter, memo) => {
        counter[0] += 1 // Logging number of calls to alphabeta

        if (depth === 0) {
            return {
                value: utility(state),
                precise: false,
            };
        }
        if (terminal(state)) {
            return {
                value: utility(state),
                precise: true,
            };
        }

        if (hash(state) in memo) {
            memo[hash(state)][1] += 1;
            return {
                value: memo[hash(state)][0],
                precise: true,
            }
        }

        if (maximizingPlayer === true) {
            let value = -Infinity;
            const availableActions = shuffled(actions(state))
            let precise = true;
            for (let i = 0; i < availableActions.length; i++) {
                const {value: newValue, precise: newPrecise} = alphabeta(result(state, availableActions[i]), depth -1, alpha, beta, false, counter, memo);
                if (newPrecise == false) {
                    precise = false;
                }
                value = Math.max(value, newValue);
                alpha = Math.max(alpha, value);
                if (alpha >= beta) {
                    precise = false;
                    break; // beta cutoff
                }
            }
            if (precise) {
                memo[hash(state)] = [value, 0];
            }
            return {
                value,
                precise,
            };
        } else {
            let value = Infinity;
            const availableActions = shuffled(actions(state))
            let precise = true;
            for (let i = 0; i < availableActions.length; i++) {
                const {value: newValue, precise: newPrecise} = alphabeta(result(state, availableActions[i]), depth -1, alpha, beta, true, counter, memo);
                if (newPrecise == false) {
                    precise = false;
                }
                value = Math.min(value, newValue);
                beta = Math.min(beta, value);
                if (beta <= alpha) {
                    precise = false;
                    break; // alpha cutoff
                }
            }
            if (precise) {
                memo[hash(state)] = [value, 0];
            }
            return {
                value,
                precise,
            };
        }
    }

    const minimax = (state) => {
        const availableActions = shuffled(actions(state))
        
        let bestAction = null
        let counter = [0]
        let memo = {}
        if (logic.player(state) === state.p1) {
            let value = -Infinity;
            for (let i = 0; i < availableActions.length; i++) {
                const {value: newValue, precise: precise} = alphabeta(result(state, availableActions[i]), 10, -Infinity, Infinity, false, counter, memo);
                if (newValue > value) {
                    value = newValue;
                    bestAction = availableActions[i]
                }
            }
        } else {
            let value = Infinity;
            for (let i = 0; i < availableActions.length; i++) {
                const {value: newValue, precise: precise} = alphabeta(result(state, availableActions[i]), 10, -Infinity, Infinity, true, counter, memo);
                if (newValue < value) {
                    value = newValue;
                    bestAction = availableActions[i]
                }
            }
        }

        console.log(counter[0])
        return bestAction;

    }

    return {
        clone,
        result,
        winner,
        terminal,
        player,
        utility,
        minimax,
        hash,
    }
})();


// Game Module
const game = (() => {
    let state = State();

    const emptyBoard = [[null, null, null],
                        [null, null, null],
                        [null, null, null]];

    const startGame = (data) => {
        const board = Board(emptyBoard);
        const p1 = Player(data.p1Name, data.p1Symbol, data.p1Computer);
        const p2 = Player(data.p2Name, data.p2Symbol, data.p2Computer);
        state = State(board, p1, p2);
        events.emit("boardUpdated", state)
        events.emit("gameStart", "");
        events.emit("nextPlayerUpdated", logic.player(state))
    }

    const resolveBoard = () => {
        // Check if won or drawn
        const data = logic.winner(state)
        if (data) {
            events.emit("gameWon", data);
        } else if (logic.terminal(state)) {
            events.emit("gameDrawn", "");
        }

    }

    const clickedCell = (cell) => {
        if (state.board.getBoard()[cell[1]][cell[0]] != null) {
            // Do nothing
        } else {
            state = logic.result(state, cell);
        }
        events.emit("boardUpdated", state);
        events.emit("nextPlayerUpdated", logic.player(state));

        resolveBoard();
    }

    const resetGame = () => {
        const board = Board(emptyBoard);
        const p1 = Player();
        const p2 = Player();
        state = State(board, p1, p2);
        events.emit("boardUpdated", state);
        events.emit("gameReset");
    }

    const checkForAiMove = (_) => {
        if (!logic.terminal(state)) {
            const nextPlayer = logic.player(state)
            if (nextPlayer.isAi() === true) {
                const bestMove = logic.minimax(state);
                setTimeout(() => {events.emit("clickedCell", bestMove)}, 200);
            }
        }
    }

    // Bind Events
    events.on("clickedStart", startGame);
    events.on("clickedCell", clickedCell);
    events.on("clickedReset", resetGame);
    events.on("nextPlayerUpdated", checkForAiMove);

    // Initialize in reset state
    resetGame();

})();

// Do button click animation
// pretyfy colours and css (select boxes, headings, fonts)
// maybe change board state updated to "turn finished" or "next turn" or "render turn" or some such
// Restyle winning line thing (make translucent, less dominating visually)
// Hard code an emoji font from a cdn so that it is consistent with the images (no tombstones, etc)
// Make "random" button that auto picks some emojis and fills in random player names