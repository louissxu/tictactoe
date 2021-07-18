#Tic-Tac-Toe

Tic-Tac-Toe written in HTML/CSS/JS

Interactive two player tic-tac-toe with option for one (or two) computer players.

All interactivity written with client side javascript. Written with factory functions and module pattern with three primary modules.
1. UI module
    Handles the UI interface, player names/symbols, button presses, board rendering etc.
2. Logic module
    Handles purely the tic-tac-toe logic. Written primarily in a functional style.
3. Game module
    Handles the game interaction. Starting the game, ending the game, what the buttons do, etc.

Events passed around the modules using an eventbus/pub-sub pattern.

Computer players calculate optimal move with minimax algorithm. AI written in functional style in logic module. Optimised with alpha-beta pruning and memoisation to reduce number of minimax calls required for full calculation. Option for imperfect ai which adds a percentage chance to pick a random move (rather than optimal move) so games don't all end in a perfect play draw.

Controls and zones laid out with css flexbox. Responsive with minimum design size of 320px width. Game board cells laid out with css grid.