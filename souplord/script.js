// --- DOM Elements ---
const ingredientsContainer = document.getElementById('ingredients-container');
const scoreDisplay = document.getElementById('score-display');
const servedDisplay = document.getElementById('served-display');
const timerDisplay = document.getElementById('timer-display');
const tablesContainer = document.getElementById('tables-container');
const trashCan = document.getElementById('trash-can');
const pots = document.querySelectorAll('.pot');
const gameOverModal = document.getElementById('game-over-modal');
const finalMoneyDisplay = document.getElementById('final-money');
const finalServedDisplay = document.getElementById('final-served');
const playAgainBtn = document.getElementById('play-again-btn');

// --- Game State & Data ---
const MASTER_INGREDIENTS = [
    "🥕 Carrots", "🧅 Onions", "🥬 Celery", "🥔 Potatoes", "🧄 Garlic",
    "🍅 Tomatoes", "🍄 Mushrooms", 
    "🌿 Parsley", "🧂 Pepper", "🌶️ Chili", "🌽 Corn", "🥦 Broccoli",
    "🍗 Chicken", "🥩 Beef"
];
const TILE_COUNT = 12;
const TABLE_COUNT = 6;
const EARNINGS_MAP = { 1: 3, 2: 9, 3: 18, 4: 30 };
const WRONG_ORDER_PENALTY = 20;
const TRASH_COST_PER_TILE = 1;
const TRASH_COST_PER_INGREDIENT_IN_POT = 2;
const GAME_DURATION_MINUTES = 1; 
// Note: The earnings map still has a value for 4 ingredients.
const MIN_RECIPE_INGREDIENTS = 1;
const MAX_RECIPE_INGREDIENTS = 3;

let tileIdCounter = 0;
let money = 0;
let tablesServed = 0;
let gameTimeInSeconds = GAME_DURATION_MINUTES * 60;
let timerInterval = null;

// --- Functions ---

/**
 * Extracts the emoji from an ingredient string. 
 * @param {string} ingredientText - e.g., "🥕 Carrots"
 * @returns {string} - e.g., "🥕"
 */
function getEmoji(ingredientText) {
    if (!ingredientText) return '';
    return ingredientText.split(' ')[0];
}

/** Updates the score display with the current money total. */
function updateScoreDisplay() {
    scoreDisplay.innerHTML = `💵 <span class="stat-number">${money}</span>`;
}

/** Updates the tables served display. */
function updateServedDisplay() {
    servedDisplay.innerHTML = `🍽️ <span class="stat-number">${tablesServed}</span>`;
}

/** Updates the timer display. */
function updateTimerDisplay() {
    const time = Math.max(0, gameTimeInSeconds); // Ensure time doesn't go below 0 for display
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    timerDisplay.innerHTML = `⏱️ <span class="stat-number">${formattedTime}</span>`;
}

/**
 * Generates a random recipe.
 * @returns {string[]} An array of ingredient names.
 */
function generateRecipe() {
    const recipe = new Set();
    const recipeSize = Math.floor(Math.random() * (MAX_RECIPE_INGREDIENTS - MIN_RECIPE_INGREDIENTS + 1)) + MIN_RECIPE_INGREDIENTS;
    while (recipe.size < recipeSize) {
        recipe.add(getRandomIngredient());
    }
    return Array.from(recipe);
}

/** Gets a random ingredient from the master list. */
function getRandomIngredient() {
    const randomIndex = Math.floor(Math.random() * MASTER_INGREDIENTS.length);
    return MASTER_INGREDIENTS[randomIndex];
}

/** Creates a new draggable tile element. */
function createTile(ingredientText) {
    const tile = document.createElement('div');
    tile.id = `tile-${tileIdCounter++}`;
    tile.classList.add('tile');
    tile.setAttribute('draggable', 'true');
    tile.dataset.ingredient = ingredientText; // Store full name in dataset
    tile.innerText = getEmoji(ingredientText); // Display only the emoji

    // Add drag event listeners to the new tile
    tile.addEventListener('dragstart', handleDragStart);
    tile.addEventListener('dragend', handleDragEnd);

    return tile;
}

/** Initializes the game board with starting tiles. */
function initializeBoard() {
    for (let i = 0; i < TILE_COUNT; i++) {
        const newTile = createTile(getRandomIngredient());
        ingredientsContainer.appendChild(newTile);
    }
}

/** Creates and initializes all customer tables. */
function initializeTables() {
    for (let i = 0; i < TABLE_COUNT; i++) {
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-wrapper';

        const recipeDisplay = document.createElement('div');
        recipeDisplay.className = 'table-recipe';

        const dropzone = document.createElement('div');
        dropzone.className = 'table-dropzone';
        dropzone.dataset.tableId = i;

        // Add drag listeners for the dropzone
        dropzone.addEventListener('dragenter', handleTableDragEnter);
        dropzone.addEventListener('dragover', handleTableDragOver);
        dropzone.addEventListener('dragleave', handleTableDragLeave);
        dropzone.addEventListener('drop', handleTableDrop);

        tableWrapper.append(recipeDisplay, dropzone);
        tablesContainer.appendChild(tableWrapper);
        assignNewRecipeToTable(tableWrapper);
    }
}
// --- Event Handlers ---

function handleDragStart(e) {
    e.target.classList.add('dragging');
    // Use the dataset to transfer the full ingredient name
    e.dataTransfer.setData('text/plain', e.target.dataset.ingredient);
    e.dataTransfer.setData('text/id', e.target.id);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

// --- Pot Drag Handlers (for adding ingredients) ---

function handlePotDragStart(e) {
    e.target.classList.add('dragging-pot');
    const ingredientsList = e.target.nextElementSibling;
    const ingredients = Array.from(ingredientsList.children).map(li => li.dataset.ingredient);
    e.dataTransfer.setData('application/json', JSON.stringify(ingredients));
    e.dataTransfer.setData('text/pot-id', e.target.dataset.potId);
}

function handlePotDragEnd(e) {
    e.target.classList.remove('dragging-pot');
}


function handlePotDragEnter(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function handlePotDragOver(e) {
    e.preventDefault(); // Necessary to allow dropping
}

function handlePotDragLeave() {
    this.classList.remove('drag-over');
}

function handlePotDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    const ingredientText = e.dataTransfer.getData('text/plain');
    const draggedTileId = e.dataTransfer.getData('text/id');
    const draggedTile = document.getElementById(draggedTileId);

    // 1. Add ingredient to the pot's list
    const ingredientsList = this.nextElementSibling;
    const listItem = document.createElement('li');
    listItem.dataset.ingredient = ingredientText; // Store full name
    listItem.innerText = getEmoji(ingredientText); // Display only emoji
    ingredientsList.appendChild(listItem);

    // 2. Replace the used tile
    if (draggedTile) {
        const parent = draggedTile.parentElement;
        const nextSibling = draggedTile.nextSibling;
        draggedTile.remove(); // Remove the original tile

        // Add a new random ingredient tile in the same spot
        const newTile = createTile(getRandomIngredient());
        parent.insertBefore(newTile, nextSibling);
    }
}

// --- Table Dropzone Handlers (for delivering soup) ---

function handleTableDragEnter(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function handleTableDragOver(e) {
    e.preventDefault(); // Necessary to allow dropping
}

function handleTableDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleTableDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    const potIngredients = JSON.parse(e.dataTransfer.getData('application/json'));
    const potId = e.dataTransfer.getData('text/pot-id');
    const recipeIngredients = JSON.parse(this.dataset.recipe);

    const isMatch = compareIngredients(potIngredients, recipeIngredients);

    if (isMatch) {
        this.innerText = '😊';
        this.classList.add('happy');

        // Calculate and add earnings
        const numIngredients = recipeIngredients.length;
        const earnings = EARNINGS_MAP[numIngredients] || 0;
        money += earnings;
        updateScoreDisplay();

        // A table was served successfully.
        tablesServed++;
        updateServedDisplay();
    } else {
        this.innerText = '😞';
        this.classList.add('sad');
        money -= WRONG_ORDER_PENALTY;
        updateScoreDisplay();
    }

    // Clear the pot that was used for any delivery attempt
    const potElem = document.querySelector(`.pot[data-pot-id='${potId}']`);
    if (potElem) {
        potElem.nextElementSibling.innerHTML = '';
    }
    
    // Assign a new recipe to the table after a delay
    setTimeout(() => assignNewRecipeToTable(this.parentElement), 2000);
}

// --- Trash Can Handlers ---

function handleTrashDragEnter(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function handleTrashDragOver(e) {
    e.preventDefault(); // Necessary to allow dropping
}

function handleTrashDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleTrashDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    const potIngredientsJSON = e.dataTransfer.getData('application/json');
    const draggedTileId = e.dataTransfer.getData('text/id');

    if (potIngredientsJSON) { // It's a pot
        const potIngredients = JSON.parse(potIngredientsJSON);
        if (potIngredients.length > 0) {
            const potId = e.dataTransfer.getData('text/pot-id');
            const cost = potIngredients.length * TRASH_COST_PER_INGREDIENT_IN_POT;
            money -= cost;
            updateScoreDisplay();

            const potElem = document.querySelector(`.pot[data-pot-id='${potId}']`);
            if (potElem) {
                potElem.nextElementSibling.innerHTML = ''; // Clear the pot's ingredient list
            }
        }
    } else if (draggedTileId) { // It's an ingredient tile
        const draggedTile = document.getElementById(draggedTileId);
        if (draggedTile) {
            money -= TRASH_COST_PER_TILE;
            updateScoreDisplay();

            // Replace the trashed tile with a new one in the same position
            const parent = draggedTile.parentElement;
            const nextSibling = draggedTile.nextSibling;
            draggedTile.remove();
            parent.insertBefore(createTile(getRandomIngredient()), nextSibling);
        }
    }
}

/**
 * Compares two arrays of ingredients, ignoring order.
 * @param {string[]} arr1
 * @param {string[]} arr2
 * @returns {boolean}
 */
function compareIngredients(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();
    return sorted1.every((value, index) => value === sorted2[index]);
}

/** Assigns a new recipe to a table and updates its UI. */
function assignNewRecipeToTable(tableWrapper) {
    const recipe = generateRecipe();
    const recipeDisplay = tableWrapper.querySelector('.table-recipe');
    const dropzone = tableWrapper.querySelector('.table-dropzone');

    recipeDisplay.innerHTML = recipe.map(getEmoji).join('');
    dropzone.dataset.recipe = JSON.stringify(recipe);
    dropzone.innerText = '🍽️';
    dropzone.className = 'table-dropzone'; // Reset classes
}

/** Ends the game, shows final stats, and disables interaction. */
function endGame() {
    // The interval is now stopped right before this function is called.
    timerDisplay.innerHTML = `⏱️ <span class="stat-number">0:00</span>`; // Ensure it shows 0:00

    // Disable all game interactions
    document.getElementById('game-area').style.pointerEvents = 'none';
    trashCan.style.pointerEvents = 'none';

    // Update and show the game over modal
    finalMoneyDisplay.innerText = `$${money}`;
    finalServedDisplay.innerText = tablesServed;
    gameOverModal.classList.remove('hidden');
}

/** Starts the game timer. */
function startGameTimer() {
    if (timerInterval) clearInterval(timerInterval); // Clear any existing timer

    timerInterval = setInterval(() => {
        gameTimeInSeconds--; // Decrement first
        updateTimerDisplay(); // Then update the display

        if (gameTimeInSeconds <= 0) {
            clearInterval(timerInterval); // Stop the timer
            endGame();
        }
    }, 1000);
}

// --- Event Listeners ---

// Add listeners to each pot for drop functionality
pots.forEach(pot => {
    // For adding ingredients to the pot
    pot.addEventListener('dragenter', handlePotDragEnter);
    pot.addEventListener('dragover', handlePotDragOver);
    pot.addEventListener('dragleave', handlePotDragLeave);
    pot.addEventListener('drop', handlePotDrop);
    // For dragging the pot itself
    pot.addEventListener('dragstart', handlePotDragStart);
    pot.addEventListener('dragend', handlePotDragEnd);
});

// Add listeners to the trash can
trashCan.addEventListener('dragenter', handleTrashDragEnter);
trashCan.addEventListener('dragover', handleTrashDragOver);
trashCan.addEventListener('dragleave', handleTrashDragLeave);
trashCan.addEventListener('drop', handleTrashDrop);

// Add listener for the "Play Again" button in the modal
playAgainBtn.addEventListener('click', () => {
    location.reload();
});

// --- Initialization ---
updateScoreDisplay(); // Set initial score to $0
updateServedDisplay();
updateTimerDisplay(); // Show initial time before the first interval tick
initializeTables();
initializeBoard();
startGameTimer();