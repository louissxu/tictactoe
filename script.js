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

    // UI Functions
    const clearChildren = (node) => {
        while (node.firstChild) {
            node.removeChild(node.lastChild);
        }
    }

    const clearBoard = () => {
        clearChildren(gameBoard);
    }

    const renderBoard = (state) => {
        clearBoard();

        for (let y = 0; y < state.length; y++) {
            for (let x=0; x < state[y].length; x++) {
                const cell = document.createElement("button");
                cell.textContent = state[y][x];
                cell.setAttribute("data-x-coordinate", x);
                cell.setAttribute("data-y-coordinate", y);
                cell.classList.add("cell")

                if (state[y][x] != "") {
                    cell.setAttribute("disabled", "")
                }

                gameBoard.appendChild(cell);
            }
        }
    }

    const disableBoard = () => {
        gameBoard.querySelectorAll(".cell").forEach((cell) => cell.setAttribute("disabled", ""));
    }

    const renderGameWon = (winner) => {
        disableBoard()        
        alertText.textContent = `${winner.getName()} wins!`
    }

    const cellClicked = (e) => {
        events.emit("cellClicked", [e.target.getAttribute("data-x-coordinate"), e.target.getAttribute("data-y-coordinate")]);
    };

    const resetClicked = (e) => {
        events.emit("resetClicked", "");
    };

    // Bind Events
    gameBoard.addEventListener("click", (outerEvent) => {
        if (outerEvent.target.classList.contains("cell")) {
            cellClicked(outerEvent)
        }
    })

    gameControls.querySelector("#reset-game").addEventListener("click", resetClicked)


    events.on("boardStateUpdated", renderBoard)
    events.on("gameWon", renderGameWon)

    // Return Object
    return {renderBoard};
})();

// Player Factory
const Player = (initialName, initialSymbol = null) => {
    const symbol = initialSymbol ?? "X";
    const name = initialName;
    const getSymbol = () => symbol;
    const getName = () => name;

    return {getSymbol,
            getName,}
}


// Game Factory
const Game = (initialState = null) => {
    let state = initialState ?? [["", "", ""],
                                   ["", "", ""],
                                   ["", "", ""]];
    const p1 = Player("Player 1", "X")
    const p2 = Player("Player 2", "O")

    // Game Functions
    const nextPlayer = () => {
        const turnDiff = state.flat().reduce((acc, cur) => {
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
    
    const availableActions = () => {
        const allActions = [];

        for (let y = 0; y < state.length; y++) {
            for (let x = 0; x < state[y].length; x++) {
                const cell = state[y][x];
                if (cell === "") {
                    allActions.push([x, y])
                }                
            }
        }
        return allActions;
    }

    const tryAction = (coordinates) => {
        const x = coordinates[0];
        const y = coordinates[1];

        if (state[y][x] === "") {
            state[y][x] = nextPlayer().getSymbol();
        }

        events.emit("boardStateUpdated", state);
    }

    const checkWinner = () => {

        let winner = null;

        // Check horizontals
        for (let y=0; y<state.length; y++) {
            const val = state[y][0];
            if (state[y].every((cell) => cell === val) && val != ""){
                winner = val;
            }
        }

        // Check verticals
        for (let x=0; x<state[0].length; x++) {
            const val = state[0][x];
            const column = state.map((row) => row[x])
            if (column.every((cell) => cell === val) && val != "") {
                winner = val;
            }
        }

        // Check diagonals
        if (state[0][0] === state[1][1] && state [0][0] === state[2][2] && state[0][0] != "") {
            winner = state[0][0];
        }
        if (state[0][2] === state[1][1] && state[0][2] === state[2][0] && state [0][2] != "") {
            winner = state[0][2];
        }

        if (winner === p1.getSymbol()) {
            events.emit("gameWon", p1)
        } else if (winner === p2.getSymbol()) {
            events.emit("gameWon", p2)
        }
    }

    const resetGame = () => {
        state = [["", "", ""],
                 ["", "", ""],
                 ["", "", ""]];
        events.emit("boardStateUpdated", state)
    }

    // Bind Events
    events.on("cellClicked", tryAction);
    events.on("resetClicked", resetGame);
    events.on("boardStateUpdated", checkWinner);

    events.emit("boardStateUpdated", state);

    return {nextPlayer,
            availableActions,
            tryAction,
            state,};
};


// const a = [["","","X"], ["","O","O"], ["X","","X"]];

// ui.renderBoard(a);

const a = [[1,2,3], [4,5,6], [7,8,9]]

const game = Game();
