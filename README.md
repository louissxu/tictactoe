# Tic-Tac-Toe

Tic-Tac-Toe written in HTML/CSS/JS.

An interactive two player tic-tac-toe game with the option for one (or two) computer players.

#### [Live demo hosted on github pages.](https://louissxu.github.io/tictactoe)

## JavaScript
### Primary Modules
All interactivity is written with client side javascript. It is written with the module pattern with three primary modules.
1. #### Logic Module
    Handles purely the tic-tac-toe logic. Written in a functional paradigm.
2. #### UI Module
    Handles the UI interface, player names/symbols, button presses, board rendering etc.
3. #### Game Module
    Handles the game interaction. Starting the game, ending the game, what the buttons do, etc.

### Ancillary Modules
4. #### Pub/Sub Module
    Events are passed around the modules using an eventbus/pub-sub pattern which is handled by this module.

### Factory Functions
Factory functions are used to create the objects passed around the modules. These are used to create the Board objects, Player objects, and State objects.
* #### Board Factory
    Stores the current state of the game board.
* #### Player Factory
    Stores the player information and associated settings. Name, symbol, human/ai, etc.
* #### State Factory
    Stores The whole game state together (the board and the two players).

## AI Players
### Minimax
The minimax algorithm is used to calculate the optimal move when an AI player is asked to make a move. The AI is written in a functional paradigm and is within the logic module.

The AI searches recursively for the optimal move knowing that the maximising player is trying to maximise the final score whilst minimising player is trying to do the opposite. Given that this is tic-tac-toe, the optimal play always ends with a drawn game with utility of zero.

Given that there are often multiple moves that similarly result in a draw, the list of possible moves is shuffled with a Fisher-Yates shuffle before being searched so that there is some variability even when playing with perfect play (so all games do not look identical even when playing to a draw).

In the game's controls there is also the option for "imperfect ai" which adds a percentage chance for the AI to pick a random move - instead of the optimal move - so games don't all end in a perfect play draw.

### Optimisations
Naive minimax is a slow algorithm. To get a result requires a full tree search of every possible move. To calculate a starting move requires ~550k calls to the minimax function.

Alpha-beta pruning can be added to the search strategy to decrease the number of unfruitful nodes that are searched. When a node is known to be less optimal than an adjacent, already searched node, it is discarded without being explored fully. With this optimisation the number of minimax calls to find a starting move is reduced to ~27k.

Memoisation is another possible optimisation. By keeping a cache of calls that have been made, identical recursive calls can be avoided by returning the stored value rather than performing a repeat search of that subtree. This reduces the number of minimax calls to ~16k. However, this is at a cost of a cache that contains ~4.5k entries.

These optimisation strategies can be combined. However, this needs to be done carefully. Only nodes that were searched precisely (i.e., searched to full depth and not discarded due to alpha-beta pruning) can be added to the cache.

With both alpha-beta pruning and memoisation enabled, the number of minimax calls is reduced to ~21k with a cache size of only ~0.5k entries.

When a move is made, the number of calls to minimax, and the size of the memo cache, is reported to console for curiosity.

#### Time and space used to calculate a first move
Algorithm | Minimax calls | Memo entries
----------|----------|----------
Naive minimax | ~550k (549945) | -
Alpha-beta pruning| ~27k | -
Memoisation | ~16k (16167) | ~4.5k (4519)
Alpha-beta and memo | ~21k | ~0.5k

As a design decision, the cache was not kept between turns/games and instead was freshly calculated each time a move was requested. The cache could be kept between invocations however it was decided as a design choice not to rely on persistent memory to store the cache.

## CSS
The controls and zones are laid out with CSS flexbox. The design is responsive with minimum design size of 320px width to accommodate phones/tablets. The game board cells are laid out with CSS grid.

CSS is written in Sass and compiled to plain CSS using node-sass via a VS Code build script.

UX design from a mix of sources. Some loosely based on material design components. All coded in plain css without the use of a front-end framework.

Symbols can be emoji for visual variety, rather than just X and O in regular font. Debated whether to embed/hardcode an emoji font or embed svg/images directly. However, the decision was made to avoid this. Best solution likely involves webpack or twemoji or similar and was beyond the scope of this project. Accepted that in devices without native up-to-date emoji support there might be tofu for the unrecognised emoji.