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
    const gameControls = document.querySelector("#n-container-controls");
    const alertText = document.querySelector("#alert-text");

    const startGameButton = gameControls.querySelector("#start-game");
    const playerSettingsButtons = gameControls.querySelectorAll("input, select, input[type='radio']+label")
    const resetGameButton = gameControls.querySelector("#reset-game");

    const canvas = document.querySelector("#canvas");

    // Cache game Controls DOM
    const p1Name = gameControls.querySelector("#p1-name");
    const p1Symbol = gameControls.querySelector("#p1-symbol");
    const p1Computer = Array.from(document.getElementsByName("p1-human-or-ai"));
    const p1Imperfect = gameControls.querySelector("#p1-imperfect");
    const p2Name = gameControls.querySelector("#p2-name");
    const p2Symbol = gameControls.querySelector("#p2-symbol");
    const p2Computer = Array.from(document.getElementsByName("p2-human-or-ai"));
    const p2Imperfect = gameControls.querySelector("#p2-imperfect");

    const p1Ai = gameControls.querySelector("#p1-ai")
    const p2Ai = gameControls.querySelector("#p2-ai")

    // Data of random names and symbols used when "demo" button is pressed
    const names = [
        [["Alice", "🔑"], ["Bob", "🔒"]],
        [["Dipper", "🧢"], ["Mabel", "🌈"]],
        [["Wallace", "🧀"], ["Gromit", "🦴"]],
        [["Fry", "🚀"], ["Bender", "🤖"]],
        [["Tom", "🐱"], ["Jerry", "🐭"]],
        [["Finn", "🎒"], ["Jake", "🐶"]],
        [["Ralph", "🏅"], ["Vanellope", "🦄"]],
        [["Buzz", "🧑‍🚀"], ["Woody", "🤠"]],
        [["Sven", "🦌"], ["Olaf", "☃️"]]
        // ["Stewie", "Brian"],
        // ["Rick", "Morty"],
        // ["Bart", "Lisa"],
        // ["Shrek", "Donkey"],
        // ["Garfield", "Odie"],
        // ["Itchy", "Scratchy"],
        // ["R2D2", "C-3PO"],
        // ["Mario", "Luigi"],
        // ["Bert", "Ernie"],
        // ["Mickey", "Minnie"],
        // ["Sherlock", "Watson"],
        // ["Marlin", "Dory"],
        // ["Calvin", "Hobbes"],
        // ["Bluey", "Bingo"],
    ]

    // Add symbols to select boxes in UI
    for (i=0; i<names.length; i++){
        const opt1 = document.createElement("option");
        opt1.value = names[i][0][1];
        opt1.innerHTML = names[i][0][1];
        p1Symbol.appendChild(opt1);

        const opt2 = document.createElement("option");
        opt2.value = names[i][1][1];
        opt2.innerHTML = names[i][1][1];
        p2Symbol.appendChild(opt2);
    }

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
        // Fill default values if nothing entered
        p1NameVal = String(p1Name.value) || "Player 1";
        p1SymbolVal = String(p1Symbol.value) || "X";
        p1ImperfectVal = Boolean(p1Imperfect.checked) || false;
        p2NameVal = String(p2Name.value) || "Player 2";
        p2SymbolVal = String(p2Symbol.value) || "O";
        p2ImperfectVal = Boolean(p2Imperfect.checked) || false;

        // Ref: https://stackoverflow.com/a/41037200
        p1ComputerVal = p1Computer.find(r => r.checked).value || "human"
        p2ComputerVal = p2Computer.find(r => r.checked).value || "human"

        events.emit("clickedStart", {
            p1Name: p1NameVal,
            p1Symbol: p1SymbolVal,
            p1Computer: p1ComputerVal,
            p1Imperfect: p1ImperfectVal,
            p2Name: p2NameVal,
            p2Symbol: p2SymbolVal,
            p2Computer: p2ComputerVal,
            p2Imperfect: p2ImperfectVal,
        });
    }

    const clickedDemo = (e) => {
        // Resets board and plays a demo game with random values and two imperfect ai's
        events.emit("clickedReset", "")

        // Picks new random set of names
        // To avoid repeats, loops until it picks one that doesn't match the current one
        let choice;
        do {
            choice = names[Math.floor(Math.random()*(names.length))]
        } while (p1Name.value === choice[0][0] && p2Name.value === choice[1][0]);
        
        // Fill in values into the controls window
        p1Name.value = choice[0][0];
        p1Symbol.value = choice[0][1];
        p1Ai.checked = true;
        p1Imperfect.checked = true;

        p2Name.value = choice[1][0];
        p2Symbol.value = choice[1][1];
        p2Ai.checked = true;
        p2Imperfect.checked = true;

        clickedStart("");
    }

    const clickedReset = (e) => {
        events.emit("clickedReset", "");
    }

    const clickedHuman = (e) => {
        // When human is selected. Automatically clear imperfect ai field.
        const p1ImperfectField = gameControls.querySelector("#p1-imperfect");
        const p2ImperfectField = gameControls.querySelector("#p2-imperfect");

        const playerId = e.target.id.slice(0, 2);

        if (playerId === "p1") {
            p1ImperfectField.checked = false
        } else if (playerId === "p2") {
            p2ImperfectField.checked = false
        }
    }

    const clickedImperfectAi = (e) => {
        // When imperfect AI is clicked. Change Human/AI selector to AI automatically.
        const p1AiField = gameControls.querySelector("#p1-ai");
        const p2AiField = gameControls.querySelector("#p2-ai");

        const playerId = e.target.id.slice(0, 2);

        if (e.target.checked === true) {
            if (playerId === "p1") {
                p1AiField.checked = true
            } else if (playerId === "p2") {
                p2AiField.checked = true
            }
        }
    }

    const clickedCell = (e) => {
        events.emit("humanClickedCell", [
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
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.lineCap = "round";
        ctx.moveTo(...begin);
        ctx.lineTo(...end);
        ctx.stroke();
    }

    const clearCanvas = () => {
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    const renderWinningPosition = (pairs) => {
        // Render Winning Line

        // Geometric transforms

        // **Note** the transform values were calculated based on the final element size and grid gaps
        // ie given that the game board is set to be 300*330. But grid gaps are taken out etc. then
        // the values are odd values. Final cell size is 98x98 with 3px horizontal sep, 12px vert sep

        // Scales up to display grid size
        const scaledPairs = pairs.map(([[ax, ay], [bx, by]]) => [[ax*101, ay*110], [bx*101, by*110]]);
        // Moves origin so it is centred on grid
        const shiftedPairs = scaledPairs.map(([[ax, ay], [bx, by]]) => [[ax+49, ay+49], [bx+49, by+49]]);
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

    const renderWinningBoard = (state, enabledCells) => {
        clearBoard();
        const board = state.board.getBoard();

        const membershipCheck = (members, elem) => {
            for (let i=0; i<members.length; i++) {
                if (elem[0] === members[i][0] && elem[1] === members[i][1]){
                    return true
                }
            }
            return false
        }

        for (let y = 0; y < board.length; y++) {
            for (let x=0; x < board[y].length; x++) {
                const cell = document.createElement("button");
                cell.textContent = board[y][x];
                cell.setAttribute("data-x-coordinate", x);
                cell.setAttribute("data-y-coordinate", y);
                cell.classList.add("cell")

                if (membershipCheck(enabledCells, [x, y])) {
                    cell.classList.add("active");
                } else {
                    cell.classList.add("inactive");
                }

                // if (board[y][x] != "") {
                //     cell.setAttribute("disabled", "")
                // }

                gameBoard.appendChild(cell);
            }
        }
    }

    const renderGameStart = () => {
        alertText.textContent = ""
        playerSettingsButtons.forEach((element) => element.setAttribute("disabled", ""));
        startGameButton.setAttribute("disabled", "");
        resetGameButton.removeAttribute("disabled");
    }

    const renderGameWon = (data) => {
        alertText.textContent = `${data.player.getName()} wins!`;
        renderWinningBoard(data.state, data.enabledCells);
        disableBoard();
        renderWinningPosition(data.pairs);
    }

    const renderGameDrawn = () => {
        disableBoard();
        alertText.textContent = `Draw! Try again.`;
    }

    const renderGameReset = (board) => {
        disableBoard();
        alertText.textContent = 'Press "Start Game" to begin.';

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

    gameControls.querySelector("#demo-game").addEventListener("click", clickedDemo);

    gameControls.querySelector("#reset-game").addEventListener("click", clickedReset);

    gameControls.addEventListener("change", (e) => {
        if (e.target.type === "radio" && e.target.value === "human"){
            clickedHuman(e);
        }
    })

    gameControls.addEventListener("change", (e) => {
        if (e.target.classList.contains("imperfect-checkbox")) {
            clickedImperfectAi(e);
        }
    });

    gameBoard.addEventListener("click", (e) => {
        if (e.target.classList.contains("cell")) {
            clickedCell(e);
        }
    });

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
const Player = (playerName = null, symbol = null, ai = null, imperfect = null) => {
    playerName = playerName ?? "Player 1";
    symbol = symbol ?? "X";
    ai = ai ?? "human";
    imperfect = imperfect ?? false;

    const getSymbol = () => symbol;
    const getName = () => playerName;
    const isAi = () => ai == "ai" ? true : false;
    const isImperfect = () => imperfect;

    return {
        getSymbol,
        getName,
        isAi,
        isImperfect,
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

    const winningCells = (pairs) => {
        /**
         * Takes a list of winning pairs, returns a list of coordinates of cells that make up the "won" cells. Returns empty list if no pairs provided
         * @param {number[][][]} pairs - A list of pairs of cell coordinates that make a won line. ie [[[ix1, iy1], [ix2, iy2]], [[jx1, jy1], [jx2, jy2]]]
         * @returns {number[][]} winningCells - list of coordinates of cells (if any) that make up the winning line(s). ie [[ax, ay], [bx, by], [cx, cy],...]
         */


        // Couldn't use Set becuase coordinates are stored as a coordinate object so two identical coordinates dont "match"
        // (as they are not the same object despite having the same value)
        const cellsList = []

        for (let i=0; i<pairs.length; i++){
            const start = pairs[i][0];
            const end = pairs[i][1];
            const middle = [(start[0]+end[0])/2, (start[1]+end[1])/2]

            cellsList.push(start)
            cellsList.push(middle)
            cellsList.push(end)
        }

        const equivalent = (a, b) => {
            if (a[0] === b[0] && a[1] === b[1]){
                return true
            }
            return false
        }

        const uniqueCoordinates = cellsList.reduce((prev, curr) => {
            for (let i=0; i<prev.length; i++) {
                if (equivalent(prev[i], curr)) {
                    return prev
                }
            }
            return [...prev, curr]

        }, [])

        return uniqueCoordinates;

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

        let wonCells
        if (winningSymbol) {
            wonCells = winningCells(winningPairs);
        }

        if (winningSymbol === state.p1.getSymbol()) {
            return {player: state.p1, pairs: winningPairs, state: state, enabledCells: wonCells};
        } else if (winningSymbol === state.p2.getSymbol()) {
            return {player: state.p2, pairs: winningPairs, state: state, enabledCells: wonCells};
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

    const randomAction = (state) => {
        const availableActions = shuffled(actions(state))
        return availableActions[0];
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

        console.log(`Minimax iterations: ${counter[0]} | Memo size: ${Object.keys(memo).length}`)
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
        randomAction,
    }
})();


// Game Module
const game = (() => {
    let state = State();

    const emptyBoard = [[null, null, null],
                        [null, null, null],
                        [null, null, null]];

    let queuedNextTurn;

    const startGame = (data) => {
        const board = Board(emptyBoard);
        const p1 = Player(data.p1Name, data.p1Symbol, data.p1Computer, data.p1Imperfect);
        const p2 = Player(data.p2Name, data.p2Symbol, data.p2Computer, data.p2Imperfect);
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

    const humanClickedCell = (cell) => {
        // Only allow through click if it is not an ai player's turn
        if (!logic.player(state).isAi() === true) {
            clickedCell(cell);
        }
    }

    const aiClickedCell = (cell) => {
        clickedCell(cell);
    }

    const clickedCell = (cell) => {
        if (state.board.getBoard()[cell[1]][cell[0]] != null) {
            // Do nothing
        } else {
            state = logic.result(state, cell);

            events.emit("boardUpdated", state);
            events.emit("nextPlayerUpdated", logic.player(state));
    
            resolveBoard();
        }

    }

    const resetGame = () => {
        const board = Board(emptyBoard);
        const p1 = Player();
        const p2 = Player();
        state = State(board, p1, p2);

        clearTimeout(queuedNextTurn)

        events.emit("boardUpdated", state);
        events.emit("gameReset");
    }

    const checkForAiMove = (_) => {
        if (!logic.terminal(state)) {
            const nextPlayer = logic.player(state)
            if (nextPlayer.isAi() === true) {
                let nextMove;
                const chance = Math.random();
                if (nextPlayer.isImperfect() === true && chance < 0.3) {
                    nextMove = logic.randomAction(state);
                } else {
                    nextMove = logic.minimax(state);
                }
                queuedNextTurn = setTimeout(() => {events.emit("aiClickedCell", nextMove)}, 200);
            }
        }
    }

    // Bind Events
    events.on("clickedStart", startGame);
    events.on("humanClickedCell", humanClickedCell);
    events.on("aiClickedCell", aiClickedCell)
    events.on("clickedReset", resetGame);
    events.on("nextPlayerUpdated", checkForAiMove);

    // Initialize in reset state
    resetGame();

})();

// Prettify  colours and css (select boxes, headings, fonts)
// maybe change board state updated to "turn finished" or "next turn" or "render turn" or some such
// Restyle winning line thing (make translucent, less dominating visually)
// Hard code an emoji font from a cdn so that it is consistent with the images (no tofu, etc)
// Decide on and pick winning cell colour. Losing cell colour and disabled cell colour and when to use each of these
// fade out the entire game board when the game is disabled or needs to be reset. make it more obvious that it is disabled
// check the reflow widths. esp at ~451 where it goes to a weird stack of 1 then 2
// clean up comments
// add js doc strings
// neaten up script