// PubSub Module
const events = (() => {
    /**
     * Classic pub/sub pattern module.
     * 
     * usage:
     *  events.on("eventName", function) - subscribes to eventName, runs fuction when eventName is emitted/published.
     *  events.off("eventName", function) - unsubscribes.
     *  events.emit("eventName", ...args) - invokes all functions subscribed to "eventName". If args provided then they are passed to ongoing function.
     */

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


// Logic Module
const logic = (() => {
    /**
     * Contains core Tic-Tac-Toe logic.
     * Logic for the game as well as the logic for the AI component of the game
     */

    // Utility Functions
    const clone = (items) => {
        /**
         * Deep copies an array
         */
        return items.map(item => Array.isArray(item) ? clone(item) : item);
    }

    // Tic-Tac-Toe Logic
    const player = (state) => {
        /**
         * Takes state input and returns who the next player is
         * @param {State} state - state object containing the current game state 
         * @returns {Player} returns player object corresponding to the next player
         */

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
        /**
         * Takes state input and returns list of coordinates of possible next moves
         * @param {State} state - state object of current game state 
         * @returns {number[][]} list of possible moves that could be made at this time [[x1, y1], [x2, y2], ...]
         */
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
        /**
         * Takes board state and an action and returns the changed board state if an action is taken at action coordinates
         * @param {State} state - starting board state
         * @param {number[]} action - coordinate of location for action to be taken [x, y] 
         * @returns {State} new State object corresponding with new board state
         */

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
        // (as they are different objects even when they have the same value)
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
        /**
         * Takes state object and figures out if there is a winning player. If there is a winner returns the winning player. Otherwise returns null
         * Return object has been expanded to include extra data to facilitate rendering of the won board state. If it's not packed into this function then the winning "position" needs to be recalculated again to get that same data (of which cells were "involved" in the win)
         * 
         * @param {State} state - board state to be evaluated 
         * @returns {?{player: Player, pairs: number[][][], state: State, enabledCells: number[][]}}
         */

        // Variables to store which player was winner and which coordinate pairs comprise the win position
        let winningSymbol = null;
        let winningPairs = [];

        const board = state.board.getBoard();

        // Check for possible win states
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

        // If board won, calculates which cells were "involved" in the win (to highlight in UI later)
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
        /**
         * Takes board state and returns whether the board is terminal (game has ended). Board is terminal if either game has been won by someone. Or if there are no more valid moves
         * @param {State} state - current board state 
         * @returns {boolean} true if the board is terminal. false if not terminal
         */
        if (winner(state)) {
            return true
        } else if (actions(state).length <= 0) {
            return true
        } else {
            return false;
        }
    }

    const randomAction = (state) => {
        /**
         * Takes board state and returns a random action. Used for imperfect AI.
         * 
         * @param {State} state - board state
         * @returns {number[]} coordinate for action to be taken by state
         */
        const availableActions = shuffled(actions(state))
        return availableActions[0];
    }

    // AI Functions
    const utility = (state) => {
        /**
         * @param {State} state - current board state
         * @returns {number} utility of the current board - 1 if p1 win, -1 if p2 win, 0 if draw
         */
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
        /**
         * Shuffles an array
         * Uses Fisher-Yates shuffle. However not in-place since functional paradigm so return is a copy
         * Ref: https://bost.ocks.org/mike/shuffle/compare.html
         * 
         * @param {Array} array - input array
         * @returns {Array} new shuffled array
         */
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
        /**
         * Hash function for board state
         * @param {State} state - board state to hash
         * @returns {string} hash recorded as a string representation of the board state. Used for cache index.
         */
        const hash = state.board.getBoard()
            .flat()
            .map(cell => cell ?? "_") 
            .join("")
        return hash
    }

    const alphabeta = (state, depth, alpha, beta, maximizingPlayer, counter, memo) => {
        /**
         * Alpha beta function. Used to recursively calculate optimal move. Uses minimax algorithm, with alpha beta and memoisation as optimisations. For interest, tracks the number of calls to this function with counter log.
         * 
         * @param {State} state - state of the board
         * @param {number} depth - depth limit to alpha beta search. In practice not used here as enough depth provided to allow full tree search
         * @param {number} alpha - stores alpha cut-off
         * @param {number} beta - stores beta cut-off
         * @param {boolean} maximizingPlayer - true if first move should be to maximise value
         * @param {Array} - counter accessible to all alphabeta calls. Stored as first index of array so it is mutable
         * @param {Object} memo - Object used as a dictionary to store {hash(State): [utility, times value read]} cache
         * @returns {{value: number, precise: boolean}} returns object containing utility of the game state (value) and whether that was reached precisely (precise)
         */
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
            memo[hash(state)][1] += 1;  // Increments usage to record how frequently the memo is used to skip exploring a subtree. Was used for efficiency debugging.
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
        /**
         * Entry function to figure out the best move from a given state. Optimises utility based on whether the player is the maximising or minimising player
         * 
         * @param {State} state - current state of board to calculate the optimal move
         * @returns {number[]} - coordinates [x, y] of best move that maximises(/or minimises - as appropriate) the player's utility
         */
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


// UI Module
const ui = (() => {
    /**
     * UI module
     * 
     * Handles the interactions with the game's HTML
     * Catches the UI input buttons and fires off events with the data
     * Receives events when the game state changes or board changes and renders the board/UI as required
     */

    // Cache DOM
    const gameBoard = document.querySelector("#game-board");
    const gameControls = document.querySelector("#n-container-controls");
    const alertText = document.querySelector("#alert-text");

    const startGameButton = gameControls.querySelector("#start-game");
    const playerSettingsButtons = gameControls.querySelectorAll("input, select, input[type='radio']+label")
    const resetGameButton = gameControls.querySelector("#reset-game");

    const canvas = document.querySelector("#canvas");

    const gameContainer = document.querySelector("#n-container-game");
    const playerControlsContainers = Array.from(document.getElementsByClassName("n-container-players"));

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

    // Add symbols from above data to select boxes in UI
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

    // Functions handling Button clicks and UI clicks
    const clickedStart = (e) => {
        /**
         * Takes values from all the player input fields.
         * Puts in default values if fields are empty.
         * Announces the event with the field values through pub/sub.
         * Game module subscribes to this and starts the game with these values.
         */

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
        /**
         * Plays a demo game with random values (from dummy data list) and two imperfect AIs.
         * Picks random values. Inserts the values into the UI fields then starts the game.
         */

        events.emit("clickedReset", "")

        // Picks new random set of names from dummy names list
        // To avoid repeats, loops until it picks one that doesn't match the current one
        let choice;
        do {
            choice = names[Math.floor(Math.random()*(names.length))]
        } while (p1Name.value === choice[0][0] && p2Name.value === choice[1][0]);
        
        // Fill in values into the controls fields
        p1Name.value = choice[0][0];
        p1Symbol.value = choice[0][1];
        p1Ai.checked = true;
        p1Imperfect.checked = true;

        p2Name.value = choice[1][0];
        p2Symbol.value = choice[1][1];
        p2Ai.checked = true;
        p2Imperfect.checked = true;

        // Starts game
        clickedStart("");
    }

    const clickedReset = (e) => {
        /**
         * Fires when the reset button is clicked.
         */
        events.emit("clickedReset", "");
    }

    const clickedHuman = (e) => {
        /**
         * Automates part of UI.
         * When "human" is selected automatically clears imperfect AI field.
         */
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
        /** 
         * Automates part of UI.
         * When "imperfect AI" is clicked. Changes human/ai selector to AI.
         */
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
        /**
         * Fires event when human clicks on a cell in the game board. Includes arg of cell coordinates
         * Subscribed by game module which processes the cell that was clicked.
         */
        events.emit("humanClickedCell", [
            e.target.getAttribute("data-x-coordinate"),
            e.target.getAttribute("data-y-coordinate")
        ]);
    }

    // Board Rendering Functions
    const clearBoard = () => {
        /**
         * Removes all cells from gameBoard. Used in prepration to render new cells.
         */
        while (gameBoard.firstChild) {
            gameBoard.removeChild(gameBoard.lastChild);
        }
    }

    const renderBoard = (state) => {
        /**
         * @param {State} state - A state object containing the state of the board to be rendered.
         * 
         * Adds 3x3 grid of cells to the gameBoard location. Each cell contains:
         *  - cell symbol if filled
         *  - x,y coordinate as data values
         */
        clearBoard();
        const board = state.board.getBoard();

        for (let y = 0; y < board.length; y++) {
            for (let x=0; x < board[y].length; x++) {
                const cell = document.createElement("button");
                cell.textContent = board[y][x];
                cell.setAttribute("data-x-coordinate", x);
                cell.setAttribute("data-y-coordinate", y);
                cell.classList.add("cell")

                if (board[y][x] != null) {
                    cell.setAttribute("disabled", "")
                }

                gameBoard.appendChild(cell);
            }
        }
    }

    const disableBoard = () => {
        /**
         * Disables all cells in board by adding disabled attribute.
         */
        gameBoard.querySelectorAll(".cell").forEach((cell) => cell.setAttribute("disabled", ""));
    }

    const fadeBoard = () => {
        /**
         * Fades all cells by adding fade attribute.
         */
        gameBoard.querySelectorAll(".cell").forEach((cell) => cell.classList.add("fade"))
    }

    const drawLine = (ctx, begin, end, stroke="black", width=1, alpha=1) => {
        /**
         * Draws line using canvas. Used to draw lines over the top of the board
         * Ref: https://www.javascripttutorial.net/web-apis/javascript-draw-line/
         */
        if (stroke) {
            ctx.strokeStyle = stroke;
        }

        if (width) {
            ctx.lineWidth = width;
        }

        if (alpha) {
            ctx.globalAlpha = alpha;
        }

        ctx.beginPath();
        ctx.lineCap = "round";
        ctx.moveTo(...begin);
        ctx.lineTo(...end);
        ctx.stroke();
    }

    const clearCanvas = () => {
        /**
         * Clears canvas over the top of the board
         */
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    const renderWinningPosition = (pairs) => {
        /**
         * Draws a line over the winning position(s)
         * 
         * @param {number[][][]} pairs - A list of pairs of cell coordinates that make up a won line. ie [[[ix1, iy1], [ix2, iy2]], [[jx1, jy1], [jx2, jy2]]]
         * 
         * Draws a line from i1 to i2 (and if there is a simultaneous win condition, j1 to j2)
         */

        // Geometric transform math

        // **Note** the transform values were calculated based on the final element size and grid gaps
        // ie given that the game board is set to be 300*330. But grid gaps are taken out etc. then
        // the values are not neat round values values.
        // Final cell size is 98x98 with 3px horizontal gap, 12px vertical gap

        // Range of input:
        // 0 <= x <= 2
        // 0 <= y <= 2

        // Scales up to display grid size
        const scaledPairs = pairs.map(([[ax, ay], [bx, by]]) => [[ax*101, ay*110], [bx*101, by*110]]);
        
        // Moves origin so (0,0) is centred on top left cell
        const shiftedPairs = scaledPairs.map(([[ax, ay], [bx, by]]) => [[ax+49, ay+49], [bx+49, by+49]]);
        
        // Vector scales to "extend" the line past the centre of the squares (so they "stick out" past the middle points)
        const vectorScaledPairs = shiftedPairs.map(([[ax, ay], [bx, by]]) => {
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
            drawLine(context, start, end, stroke="black", width=5, alpha=0.7);
        })
        canvas.style.display = "block";
    }

    const renderBoardExtended = (state, enabledCells) => {
        // TODO
        // REFACTOR CELL COLOURING AND HOW DISABLED IS MANAGED

        /**
         * Cells
         * 
         * cells disabled
         * cells coloured (win)
         * cells faded out (reduced opacity)
         * 
         * disabled state. all cells disabled but not faded out
         * playing game. filled cells disabled but not faded out
         * draw game. all cells disabled,  all cells faded out
         * won game. all cells disabled, most cells faded out. some cells win colour
         * ai turn. maybe all cells disabled?
         * 
         * 
         * change this param to "winningCells"
         */


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
                    cell.classList.add("winning-cell");
                } else {
                    cell.classList.add("fade");
                }

                // if (board[y][x] != "") {
                //     cell.setAttribute("disabled", "")
                // }

                gameBoard.appendChild(cell);
            }
        }
    }

    // UI Render Functions
    // Gets invoked when game state changes.
    // Adjusts and renders game UI elements for when state changes. eg alert box, field opacity, locking fields.
    const renderGameStart = () => {
        alertText.textContent = ""
        playerSettingsButtons.forEach((element) => element.setAttribute("disabled", ""));
        startGameButton.setAttribute("disabled", "");
        resetGameButton.removeAttribute("disabled");

        gameContainer.classList.remove("fade-out");
        playerControlsContainers.forEach((el) => el.classList.add("fade-out"));
    }

    const renderGameWon = (data) => {
        alertText.textContent = `${data.player.getName()} wins!`;
        renderBoardExtended(data.state, data.enabledCells);
        disableBoard();
        renderWinningPosition(data.pairs);
    }

    const renderGameDrawn = () => {
        disableBoard();
        fadeBoard();
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

        gameContainer.classList.add("fade-out");
        playerControlsContainers.forEach((el) => el.classList.remove("fade-out"));
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

    // Subscribe to Pub/Sub Events
    events.on("boardUpdated", renderBoard);
    events.on("gameStart", renderGameStart);
    events.on("gameWon", renderGameWon);
    events.on("gameDrawn", renderGameDrawn);
    events.on("gameReset", renderGameReset);
    events.on("nextPlayerUpdated", renderPlayerUpdated);
    events.on("startAiTurn", disableBoard); // Disables board from clicks when it's an AI turn

    // Return Object
    return {};
})();


const Player = (playerName = null, symbol = null, ai = null, imperfect = null) => {
    /**
     * Player factory
     * Creates player object that stores player attributes and details.
     * 
     * @typedef {Object} Player
     * @property {?string} playerName - string containing the players name for display purposes
     * @property {?string} symbol - unicode symbol used to fill players locations in displayed game board
     * @property {?string} ai - stores whether the player is "ai" or "human"
     * @property {?boolean} imperfect - stores whether the computer player is imperfect
     */
    playerName = playerName ?? "Player 1";
    symbol = symbol ?? "X";
    ai = ai ?? "human";
    imperfect = imperfect ?? false;

    const getSymbol = () => symbol;
    const getName = () => playerName;
    const isAi = () => ai === "ai" ? true : false;
    const isImperfect = () => imperfect;

    return {
        getSymbol,
        getName,
        isAi,
        isImperfect,
    }
}


const Board = (board = null) => {
    /**
     * Board factory
     * Creates board object that stores positions on the board in a 2d array.
     * 
     * @typedef {Object} Board
     * @property {?string[][]} board - 2d array of strings which stores the state of the board. Null if empty, player's symbol if filled
     */
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


const State = (board, p1, p2) => {
    /**
     * State factory
     * Creates state object that stores board and player together to facilitate passing around as a combined object.
     *
     * @typedef {Object} State
     * @property {Board} board
     * @property {Player} p1
     * @property {Player} p2
     */
    return {
        board,
        p1,
        p2,
    }
}


// Game Module
const game = (() => {
    /**
     * Game module
     * Handles the game ancillary logic, managing of the game's state. Starting the game, resetting the game etc
     * Is the intermediary between a lot of the actions between the UI and the strict game logic
     */

    // Variable to store the state of the board in. The HTML board is a one way rendered copy of this
    let state = State();

    // Dummy variable so that a empty board can be created more easily
    const emptyBoard = [[null, null, null],
                        [null, null, null],
                        [null, null, null]];

    // Variable to store timeout timer between turns so it can be cancelled by other functions if game is stopped/reset while AI turn is waiting.
    let queuedNextTurn;

    const startGame = (data) => {
        /**
         * Function to start a game. Receives data from the UI, stores the state and emits events to get the game running
         * 
         * @param {Object} data - data received from UI as a dictionary
         */
        const board = Board(emptyBoard);
        const p1 = Player(data.p1Name, data.p1Symbol, data.p1Computer, data.p1Imperfect);
        const p2 = Player(data.p2Name, data.p2Symbol, data.p2Computer, data.p2Imperfect);
        state = State(board, p1, p2);
        events.emit("boardUpdated", state)
        events.emit("gameStart", "");
        events.emit("nextPlayerUpdated", logic.player(state))
    }

    const resolveBoard = () => {
        /**
         * Check if state is won or drawn
         */
        const data = logic.winner(state)
        if (data) {
            events.emit("gameWon", data);
        } else if (logic.terminal(state)) {
            events.emit("gameDrawn", "");
        }

    }

    const humanClickedCell = (cell) => {
        /**
         * Wrapper to clickedCell to only let through click if current player is human
         */
        if (!logic.player(state).isAi() === true) {
            clickedCell(cell);
        }
    }

    const aiClickedCell = (cell) => {
        /**
         * Wrapper that just passes through AI clicks to clickedCell
         */
        clickedCell(cell);
    }

    const clickedCell = (cell) => {
        /**
         * Takes coordinates of clicked cell and processes game update
         * 
         * @param {number[]} cell - [x, y] coordinates of cell that was clicked
         */
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
        /**
         * Resets game state and updates UI
         */
        const board = Board(emptyBoard);
        const p1 = Player();
        const p2 = Player();
        const state = State(board, p1, p2);

        clearTimeout(queuedNextTurn)

        events.emit("boardUpdated", state);
        events.emit("gameReset");
    }

    const checkForAiMove = (_) => {
        /**
         * Checks if current player is AI and queues AI move if it is.
         * If AI is imperfect, it has a certain percentage chance of playing a random move.
         * Otherwise plays minimax optimal move.
         */
        if (!logic.terminal(state)) {
            const nextPlayer = logic.player(state)
            if (nextPlayer.isAi() === true) {
                events.emit("startAiTurn"); // announce start of AI turn so board gets disabled

                let nextMove;
                const chance = Math.random();
                if (nextPlayer.isImperfect() === true && chance < 0.3) {
                    nextMove = logic.randomAction(state);
                } else {
                    nextMove = logic.minimax(state);
                }
                queuedNextTurn = setTimeout(() => {events.emit("aiClickedCell", nextMove)}, 200); // Time delay so the board doesn't all instantly fill when the game played is AI vs AI
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

// maybe change board state updated to "turn finished" or "next turn" or "render turn" or some such
// Hard code an emoji font from a cdn so that it is consistent with the images (no tofu, etc)
// Decide on and pick winning cell colour. Losing cell colour and disabled cell colour and when to use each of these
// Fix disabled button stuff
// Add link to github repo