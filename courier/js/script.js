
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        const townImage = new Image();
        townImage.src = 'images/town.png';
        const forestImage = new Image();
        forestImage.src = 'images/forest.png';
        const mountainImage = new Image();
        mountainImage.src = 'images/mountain.png';
        const lakeImage = new Image();
        lakeImage.src = 'images/water.png';
        const grasslandImage = new Image();
        grasslandImage.src = 'images/grassland.png';
        const swampImage = new Image();
        swampImage.src = 'images/swamp.png';

        let gridSize = 30; // Size of each grid cell - increased to make grid bigger
        let playerX, playerY; // Player position in grid coordinates
        let mapWidth = 50; // Map size in grid cells - changed to 50
        let mapHeight = 50; // Map size in grid cells - changed to 50
        let mapData; // 2D array representing the map
        let townNames = {}; // Store town names with their coordinates as keys
        let townCoordinates = []; // Stores {x, y} of all towns

        let viewOffsetX = 0; // Offset for panning the map
        let viewOffsetY = 0;
        let isDragging = false;
        let dragStartX, dragStartY;
        let zoomLevel = 1; // Initial zoom level
        const zoomSpeed = 0.1; // Speed of zooming
        const minZoom = 0.5;
        const maxZoom = 3;

        let dayCount = 0; // Number of days passed
        let foodCount = 100; // Initial food count
        let goldCount = 10; // Initial gold count
        let healthCount = 100; // Initial health count
        const maxFoodCapacity = 100; // Max food player can have
        const maxHealthCapacity = 100; // Max health player can have
        const foodPerGoldUnit = 10; // 10 food for 1 gold (so 1 gold buys 10 food)
        const healthPerGoldUnitHeal = 2; // 2 health for 1 gold (so 0.5 gold per 1 health)

        let activeQuests = []; // Stores an array of quest objects
        const deliveryRewardFactor = 2; // Gold per unit distance for delivery quests
        const minDeliveryDistance = 5; // Minimum distance for a delivery quest
        const maxDeliveryAttempts = 10; // Max attempts to find a suitable delivery town
        const maxActiveQuests = 3; // Max number of quests player can have

        // Victory Condition
         let retirementGoal = { townName: null, goldAmount: 100, x: null, y: null };

        // Monster encounter variables
        let turnsInHazardousTerrain = 0;
        let isMonsterEncounterActive = false;
        let currentMonster = null; // { name, health, attack, goldReward, foodReward }

        const baseEncounterChance = 0.05; // 5% chance
        const chanceIncreasePerTurn = 0.05; // +5% per successive turn
        const maxEncounterChance = 0.5; // Cap at 50%

        const playerBaseAttack = 20; // Damage player deals
        const playerRunSuccessChance = 0.6; // 60% chance to run successfully
        const runHealthPenalty = 5; // Health lost when running
        const monsterHitHealthLoss = 15; // Health lost when hit by monster
        const monsterHitGoldLoss = 3; // Gold lost when hit by monster
        const noFoodHealthPenalty = 10; // Health lost per turn when food is 0

        const healthCounterDisplay = document.getElementById('healthCounter');
        const dayCounterDisplay = document.getElementById('dayCounter');
        const dayValueDisplay = document.getElementById('dayValue');
        const healthValueDisplay = document.getElementById('healthValue');
        const foodCounterDisplay = document.getElementById('foodCounter');
        const foodValueDisplay = document.getElementById('foodValue');
        const goldCounterDisplay = document.getElementById('goldCounter');
        const goldValueDisplay = document.getElementById('goldValue');
        const activeQuestDisplay = document.getElementById('activeQuestDisplay');
        const gameOverScreen = document.getElementById('gameOverScreen');
        const restartButton = document.getElementById('restartButton');
        const gameOverReason = document.getElementById('gameOverReason');

        // Victory screen elements
        const victoryScreen = document.getElementById('victoryScreen');
        const victoryTownName = document.getElementById('victoryTownName');
        const restartButtonVictory = document.getElementById('restartButtonVictory');
        const retirementTownNameDisplay = document.getElementById('retirementTownName');
        const retirementGoldAmountDisplay = document.getElementById('retirementGoldAmount');

        const messageDisplay = document.getElementById('messageDisplay');
        let messageTimeout;

        // Town screen elements
        const townScreen = document.getElementById('townScreen');
        const townNameDisplay = document.getElementById('townNameDisplay');
        const foodBuySlider = document.getElementById('foodBuySlider');
        const buyFoodButton = document.getElementById('buyFoodButton');
        const closeTownButton = document.getElementById('closeTownButton');

        // New Health Healing elements
        const healthHealSlider = document.getElementById('healthHealSlider');
        const healHealthButton = document.getElementById('healHealthButton');

        // Delivery quest elements
        const deliveryOptionButtons = [
            document.getElementById('deliveryOption1'),
            document.getElementById('deliveryOption2'),
            document.getElementById('deliveryOption3')
        ];
        // Removed noDeliveryButton element
        let availableQuests = [];

        // Monster encounter screen elements
        const monsterEncounterScreen = document.getElementById('monsterEncounterScreen');
        const monsterNameDisplay = document.getElementById('monsterName');
        const monsterHealthDisplay = document.getElementById('monsterHealth');
        const monsterMessageDisplay = document.getElementById('monsterMessage');
        const fightButton = document.getElementById('fightButton');
        const runButton = document.getElementById('runButton');

        /**
         * Updates the displayed day count.
         */
        function updateDayCounter() {
            dayValueDisplay.textContent = `${Math.floor(dayCount)}`;
        }

        /**
         * Updates the displayed health count.
         */
        function updateHealthCounter() {
            healthValueDisplay.textContent = `${Math.floor(healthCount)}`;
        }

        /**
         * Updates the displayed food count.
         */
        function updateFoodCounter() {
            foodValueDisplay.textContent = `${Math.floor(foodCount)}`;
        }

        /**
         * Updates the displayed gold count.
         */
        function updateGoldCounter() {
            goldValueDisplay.textContent = `${Math.floor(goldCount)}`;
        }

        /**
         * Shows a message on the screen for a specified duration.
         * @param {string} message - The message to display.
         * @param {number} duration - The duration in milliseconds to display the message.
         */
        function showMessage(message, duration = 2500) {
            clearTimeout(messageTimeout);
            messageDisplay.style.display = ''; // Reset inline display style to allow CSS classes to take over
            messageDisplay.textContent = message;
            messageDisplay.classList.remove('hide-message');
            messageDisplay.classList.add('show-message');

            messageTimeout = setTimeout(() => {
                messageDisplay.classList.remove('show-message');
                messageDisplay.classList.add('hide-message');
                // After the fade-out transition, set display to none to remove from layout.
                // The { once: true } option automatically removes the listener after it runs.
                messageDisplay.addEventListener('transitionend', () => {
                    messageDisplay.style.display = 'none';
                }, { once: true });
            }, duration);
        }

        /**
         * Updates the active quest display on the top right.
         */
        function updateActiveQuestDisplay() {
            if (activeQuests.length > 0) {
                let questHTML = '<ul>';
                activeQuests.forEach(quest => {
                    questHTML += `
                        <li class="quest-item">
                            <img src="images/delivery.png" alt="Deliver to:" class="h-5 w-5 mr-2" title="Delivery Quest">
                            <span>${quest.targetTownName}: ${quest.reward}</span>
                            <img src="images/gold.png" alt="Gold" class="h-5 w-5 ml-1" title="Gold">
                        </li>
                    `;
                });
                questHTML += '</ul>';
                activeQuestDisplay.innerHTML = questHTML;
                activeQuestDisplay.style.display = 'block';
            } else {
                activeQuestDisplay.style.display = 'none';
            }
        }

        /**
         * Updates active quests based on the number of days passed.
         * Reduces rewards and removes expired quests.
         * @param {number} daysPassed - The number of days that have passed.
         */
        function updateQuestTimers(daysPassed) {
            if (activeQuests.length === 0) return;

            const expiredQuests = [];
            let questsUpdated = false;

            activeQuests.forEach(quest => {
                const oldReward = quest.reward;
                quest.reward = Math.max(0, quest.reward - daysPassed);
                if (quest.reward !== oldReward) {
                    questsUpdated = true;
                }
                // Only trigger expiry on the turn the reward drops to 0
                if (quest.reward <= 0 && oldReward > 0) {
                    expiredQuests.push(quest);
                }
            });

            if (expiredQuests.length > 0) {
                expiredQuests.forEach(quest => {
                    showMessage(`You were too slow to deliver to ${quest.targetTownName}. The quest has expired.`, 3500);
                });
                activeQuests = activeQuests.filter(quest => !expiredQuests.includes(quest));
            }

            // Update the display if any quest reward changed or a quest expired.
            if (questsUpdated) {
                updateActiveQuestDisplay();
            }
        }

        /**
         * Displays the game over screen and disables game input.
         */
        function gameOver() {
            gameOverScreen.style.display = 'flex'; //show game over screen
            victoryScreen.style.display = 'none'; // Hide victory screen if somehow open
            townScreen.style.display = 'none'; // Hide town screen if open
            monsterEncounterScreen.style.display = 'none'; // Hide monster screen if open
            // Disable input
            disableGameInput();
        }

        /**
         * Resizes the canvas to fit the window and redraws the map.
         * Does not regenerate the map to preserve current game state.
         */
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            drawMap(); // Redraw the map to fit new dimensions
        }

        /**
         * Generates a new random map with various terrain types and towns.
         * Includes a second pass to cluster similar terrain types and generates roads between two random towns.
         */
        function generateMap() {
            mapData = [];
            townNames = {}; // Clear town names each time the map is generated
            let generatedTownNames = new Set(); // To ensure unique names
            townCoordinates = []; // Clear town coordinates

            // First pass: Randomly place terrain types
            for (let y = 0; y < mapHeight; y++) {
                mapData[y] = [];
                for (let x = 0; x < mapWidth; x++) {
                    const randomValue = Math.random();
                    if (randomValue < 0.1) { // 10% chance
                        mapData[y][x] = 1; // Mountain
                    } else if (randomValue < 0.3) { // 20% chance (cumulative, so 30% total)
                        mapData[y][x] = 2; // Forest
                    } else if (randomValue < 0.4) { // 10% chance (cumulative, so 40% total)
                        mapData[y][x] = 3; // Lake
                    } else if (randomValue < 0.41) { // 1% chance for towns (cumulative, so 41% total)
                        mapData[y][x] = 4; // Town
                    } else if (randomValue < 0.5) { // 9% chance for swamps (cumulative, so 50% total)
                        mapData[y][x] = 5; // Swamp
                    } else {
                        mapData[y][x] = 0; // Open space
                    }
                }
            }

            // Second pass: Cluster features based on neighbors
            const tempMapData = JSON.parse(JSON.stringify(mapData)); // Deep copy
            for (let y = 0; y < mapHeight; y++) {
                for (let x = 0; x < mapWidth; x++) {
                    if (tempMapData[y][x] === 0) { // Only apply to open spaces in the original map
                        let neighbors = [];
                        if (y > 0) neighbors.push(tempMapData[y - 1][x]);
                        if (y < mapHeight - 1) neighbors.push(tempMapData[y + 1][x]);
                        if (x > 0) neighbors.push(tempMapData[y][x - 1]);
                        if (x < mapWidth - 1) neighbors.push(tempMapData[y][x + 1]);

                        let mountainCount = neighbors.filter(n => n === 1).length;
                        let forestCount = neighbors.filter(n => n === 2).length;
                        let lakeCount = neighbors.filter(n => n === 3).length;
                        let swampCount = neighbors.filter(n => n === 5).length;

                        // If an open space has multiple neighbors of a certain type, it becomes that type
                        if (mountainCount > 1) mapData[y][x] = 1;
                        else if (forestCount > 1) mapData[y][x] = 2;
                        else if (lakeCount > 1) mapData[y][x] = 3;
                        else if (swampCount > 1) mapData[y][x] = 5;
                    }
                }
            }

            // Generate names for towns and collect their coordinates
            for (let y = 0; y < mapHeight; y++) {
                for (let x = 0; x < mapWidth; x++) {
                    if (mapData[y][x] === 4) {
                        let townName;
                        do {
                            townName = generateTownName();
                        } while (generatedTownNames.has(townName)); // Ensure uniqueness
                        generatedTownNames.add(townName);
                        townNames[`${x},${y}`] = townName; // Store name with coordinates
                        townCoordinates.push({ x: x, y: y }); // Store town coordinates
                    }
                }
            }
        }

        /**
         * Initializes the player's position on a random open space.
         * Centers the view on the player's starting position.
         */
        function initializePlayer() {
            // Start the player in their designated retirement town.
            if (retirementGoal.townName && retirementGoal.x !== null && retirementGoal.y !== null) {
                playerX = retirementGoal.x;
                playerY = retirementGoal.y;
            } else {
                // Fallback if retirement goal isn't set (should not happen in normal flow)
                playerX = Math.floor(mapWidth / 2);
                playerY = Math.floor(mapHeight / 2);
                console.error("Could not find retirement town to start. Placing player at center.");
            }

            // Calculate the offset to center the map on the player
            viewOffsetX = playerX * gridSize - canvas.width / (2 * zoomLevel);
            viewOffsetY = playerY * gridSize - canvas.height / (2 * zoomLevel);
        }

        // Arrays for generating town names. Prefixes are capitalized, suffixes are not.
        const townPrefixes = ["River", "Brook", "Creek", "Lake", "Falls", "Spring", "Stone", "Iron", "Fair", "West", "High", "Dog", "Spoon", "Witching", "Dragon", "Tap"];
        const townSuffixes = ["wood", "forest", "grove", "meadow", "hill", "mount", "dale", "field", "town", "ville", "burg", "port", "haven", "shire", "view", "crest", "muth", "ford", "stead", "gate", "bridge", "bend", "point", "ridge", "vale", "brook", "spring", "well", "ston", "rock"];

        /**
         * Generates a random, unique town name.
         * @returns {string} The generated town name.
         */
        function generateTownName() {
            const prefixIndex = Math.floor(Math.random() * townPrefixes.length);
            const suffixIndex = Math.floor(Math.random() * townSuffixes.length);
            return townPrefixes[prefixIndex] + townSuffixes[suffixIndex];
        }

        /**
         * Draws the map, player, and town names on the canvas.
         * Applies current zoom level and view offset for panning.
         */
        function drawMap() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.scale(zoomLevel, zoomLevel);

            // Calculate visible map area to optimize drawing
            const visibleStartX = Math.floor(viewOffsetX / gridSize / zoomLevel);
            const visibleStartY = Math.floor(viewOffsetY / gridSize / zoomLevel);
            const visibleEndX = Math.ceil((viewOffsetX + canvas.width) / gridSize / zoomLevel);
            const visibleEndY = Math.ceil((viewOffsetY + canvas.height) / gridSize / zoomLevel);

            for (let y = Math.max(0, visibleStartY); y < Math.min(mapHeight, visibleEndY); y++) {
                for (let x = Math.max(0, visibleStartX); x < Math.min(mapWidth, visibleEndX); x++) {
                    const drawX = x * gridSize - viewOffsetX / zoomLevel;
                    const drawY = y * gridSize - viewOffsetY / zoomLevel;
                    const drawSize = gridSize + 1; // Draw each square 1 pixel larger to hide grid lines

                    switch (mapData[y][x]) {
                        case 1:
                            if (mountainImage.complete && mountainImage.naturalHeight !== 0) {
                                ctx.drawImage(mountainImage, drawX, drawY, drawSize, drawSize);
                            } else {
                                ctx.fillStyle = '#808080'; // Grey for mountains
                                ctx.fillRect(drawX, drawY, drawSize, drawSize);
                            }
                            break;
                        case 2:
                            // Check if the image is loaded and ready, otherwise use a fallback color
                            if (forestImage.complete && forestImage.naturalHeight !== 0) {
                                ctx.drawImage(forestImage, drawX, drawY, drawSize, drawSize);
                            } else {
                                ctx.fillStyle = '#228B22'; // Fallback green for forests
                                ctx.fillRect(drawX, drawY, drawSize, drawSize);
                            }
                            break;
                        case 3:
                            if (lakeImage.complete && lakeImage.naturalHeight !== 0) {
                                ctx.drawImage(lakeImage, drawX, drawY, drawSize, drawSize);
                            } else {
                                ctx.fillStyle = '#3b82f6'; // Blue for lakes
                                ctx.fillRect(drawX, drawY, drawSize, drawSize);
                            }
                            break;
                        case 4:
                            if (townImage.complete && townImage.naturalHeight !== 0) {
                                ctx.drawImage(townImage, drawX, drawY, drawSize, drawSize);
                            } else {
                                ctx.fillStyle = '#ffffff'; // White for other towns
                                ctx.fillRect(drawX, drawY, drawSize, drawSize);
                            }
                            const isQuestTarget = activeQuests.some(quest => x === quest.targetX && y === quest.targetY);
                            if (isQuestTarget) {
                                ctx.fillStyle = 'rgba(255, 255, 0, 0.5)'; // Yellow highlight for quest target town
                                ctx.fillRect(drawX, drawY, drawSize, drawSize);
                            }
                            // Add a border for the retirement town
                            if (x === retirementGoal.x && y === retirementGoal.y) {
                                ctx.strokeStyle = '#FFFFE0'; // Light Yellow
                                ctx.lineWidth = 3;
                                ctx.strokeRect(drawX, drawY, gridSize, gridSize);
                            }
                            break;
                        case 5:
                            if (swampImage.complete && swampImage.naturalHeight !== 0) {
                                ctx.drawImage(swampImage, drawX, drawY, drawSize, drawSize);
                            } else {
                                ctx.fillStyle = '#698339'; // Murky green for swamps
                                ctx.fillRect(drawX, drawY, drawSize, drawSize);
                            }
                            break;
                        case 0:
                        default:
                            if (grasslandImage.complete && grasslandImage.naturalHeight !== 0) {
                                ctx.drawImage(grasslandImage, drawX, drawY, drawSize, drawSize);
                            } else {
                                ctx.fillStyle = '#86ef7d'; // Grass green for open space
                                ctx.fillRect(drawX, drawY, drawSize, drawSize);
                            }
                            break;
                    }
                }
            }

            // Draw player, relative to the view offset
            const playerScreenX = playerX * gridSize - viewOffsetX / zoomLevel;
            const playerScreenY = playerY * gridSize - viewOffsetY / zoomLevel;
            ctx.fillStyle = '#ef4444'; // Red for player
            ctx.fillRect(playerScreenX, playerScreenY, gridSize, gridSize);
            ctx.strokeStyle = '#b91c1c'; // Darker red border
            ctx.strokeRect(playerScreenX, playerScreenY, gridSize, gridSize);

            // Draw town names with backgrounds for readability
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top'; // Set baseline to top for easier positioning

            for (const [coords, name] of Object.entries(townNames)) {
                const [x, y] = coords.split(",").map(Number);
                const townX = x * gridSize - viewOffsetX / zoomLevel + gridSize / 2; // Center text
                const townY = y * gridSize - viewOffsetY / zoomLevel + gridSize + 4; // Position text below the town tile

                const textMetrics = ctx.measureText(name);
                const textWidth = textMetrics.width;
                const textHeight = 12; // From font size
                const padding = 4;

                // Draw background rectangle
                ctx.fillStyle = 'rgba(30, 30, 30, 0.75)'; // Semi-transparent dark grey background
                ctx.fillRect(townX - textWidth / 2 - padding, townY - padding, textWidth + padding * 2, textHeight + padding * 2);

                // Draw text on top
                ctx.fillStyle = '#FFFFFF'; // White text
                ctx.fillText(name, townX, townY);
            }
            ctx.textBaseline = 'alphabetic'; // Reset to default

            ctx.restore();
        }

        /**
         * Calculates the Manhattan distance between two grid points.
         * @param {number} x1 - X coordinate of the first point.
         * @param {number} y1 - Y coordinate of the first point.
         * @param {number} x2 - X coordinate of the second point.
         * @param {number} y2 - Y coordinate of the second point.
         * @returns {number} The Manhattan distance.
         */
        function calculateDistance(x1, y1, x2, y2) {
            return Math.abs(x1 - x2) + Math.abs(y1 - y2);
        }

        /**
         * Generates three random delivery quests.
         */
        function generateDeliveryQuests() {
            availableQuests = [];
            const currentTownCoords = { x: playerX, y: playerY };

            for (let i = 0; i < 3; i++) {
                let targetTown = null;
                let distance = 0;
                let attempts = 0;
                
                while (attempts < maxDeliveryAttempts) {
                    const randomIndex = Math.floor(Math.random() * townCoordinates.length);
                    const potentialTargetTown = townCoordinates[randomIndex];

                    // Ensure target town is not the current town, not already a quest target, and is far enough
                    const isAlreadyQuestTarget = activeQuests.some(q => q.targetX === potentialTargetTown.x && q.targetY === potentialTargetTown.y);
                    if ((potentialTargetTown.x !== currentTownCoords.x || potentialTargetTown.y !== currentTownCoords.y) && !isAlreadyQuestTarget) {
                        const dist = calculateDistance(currentTownCoords.x, currentTownCoords.y, potentialTargetTown.x, potentialTargetTown.y);
                        if (dist >= minDeliveryDistance) {
                            targetTown = potentialTargetTown;
                            distance = dist;
                            break;
                        }
                    }
                    attempts++;
                }

                if (targetTown) {
                    const reward = Math.floor(distance * deliveryRewardFactor * 1.5); // 50% bonus to initial reward
                    availableQuests.push({
                        targetX: targetTown.x,
                        targetY: targetTown.y,
                        reward: reward,
                        targetTownName: townNames[`${targetTown.x},${targetTown.y}`],
                        distance: distance
                    });
                } else {
                    // If no suitable town found after attempts, add a placeholder or skip
                    availableQuests.push(null); 
                }
            }
            // Populate buttons
            availableQuests.forEach((quest, index) => {
                const button = deliveryOptionButtons[index];
                if (quest) {
                    button.textContent = `Deliver to ${quest.targetTownName} (${quest.reward} Gold)`;
                    button.onclick = () => takeDeliveryQuest(index);
                    button.disabled = false; // Re-enable the button for a new quest
                    button.style.display = 'block';
                } else {
                    button.textContent = `No delivery available`;
                    button.onclick = null;
                    button.disabled = true; // Disable if no quest
                    button.style.display = 'block';
                }
            });
        }

        /**
         * Sets the chosen delivery quest as the current active quest.
         * @param {number} questIndex - The index of the selected quest in availableQuests.
         */
        function takeDeliveryQuest(questIndex) {
            if (activeQuests.length >= maxActiveQuests) {
                showMessage(`Your quest log is full!`, 2500);
                return;
            }
            const newQuest = availableQuests[questIndex];
            activeQuests.push(newQuest);
            showMessage(`Quest accepted: Deliver to ${newQuest.targetTownName}!`, 3000);
            updateActiveQuestDisplay();
            
            // Disable the button for the quest just taken
            deliveryOptionButtons[questIndex].disabled = true;
            deliveryOptionButtons[questIndex].textContent = `Quest Taken`;
            deliveryOptionButtons[questIndex].onclick = null;

            // If quest log is now full, disable other available quests
            if (activeQuests.length >= maxActiveQuests) {
                deliveryOptionButtons.forEach((button) => {
                    if (!button.disabled) { // Only affect buttons that are still active
                        button.disabled = true;
                        button.textContent = `Quest Log Full`;
                        button.onclick = null;
                    }
                });
            }
        }
        /**
         * Sets up the retirement goal by selecting a random town.
         */
        function setupRetirementGoal() {
            if (townCoordinates.length > 0) {
                const randomTown = _.sample(townCoordinates);
                retirementGoal.townName = townNames[`${randomTown.x},${randomTown.y}`];
                retirementGoal.x = randomTown.x;
                retirementGoal.y = randomTown.y;
                retirementTownNameDisplay.textContent = retirementGoal.townName;
                retirementGoldAmountDisplay.textContent = retirementGoal.goldAmount;
            } else {
                console.error("No towns available to set a retirement goal.");
                // Hide the goal display if no towns exist
                document.getElementById('retirementGoalDisplay').style.display = 'none';
            }
        }

        /**
         * Displays the victory screen.
         */
        function showVictoryScreen() {
            victoryTownName.textContent = retirementGoal.townName;
            victoryScreen.style.display = 'flex';
            disableGameInput();
        }

        /**
         * Starts a monster encounter.
         */
        function startMonsterEncounter() {
            isMonsterEncounterActive = true;
            disableGameInput();
            townScreen.style.display = 'none'; // Ensure town screen is hidden
            gameOverScreen.style.display = 'none'; // Ensure game over is hidden

            // Define a simple monster (can be expanded to random monsters)
            currentMonster = {
                name: "Goblin",
                health: 50,
                attack: 15,
                goldReward: 15, // Gold gained on defeat
                foodReward: 0 // Food gained on defeat
            };

            monsterNameDisplay.textContent = currentMonster.name;
            monsterHealthDisplay.textContent = `Health: ${currentMonster.health}`;
            monsterMessageDisplay.textContent = `A wild ${currentMonster.name} appears!`;

            monsterEncounterScreen.style.display = 'flex';
        }

        /**
         * Handles the player fighting the monster.
         */
        function fightMonster() {
            if (!currentMonster) return;

            let battleMessage = "";

            // Player attacks
            currentMonster.health -= playerBaseAttack;
            battleMessage += `You hit the ${currentMonster.name} for ${playerBaseAttack} damage! `;

            if (currentMonster.health <= 0) {
                battleMessage += `The ${currentMonster.name} is defeated! `;
                if (currentMonster.goldReward > 0) {
                    goldCount += currentMonster.goldReward;
                    battleMessage += `You gained ${currentMonster.goldReward} gold.`;
                }
                if (currentMonster.foodReward > 0) {
                    foodCount += currentMonster.foodReward;
                    battleMessage += `You gained ${currentMonster.foodReward} food.`;
                }
                updateGoldCounter();
                updateFoodCounter();
                showMessage(battleMessage, 3000);
                endMonsterEncounter();
                return;
            }

            // Monster attacks
            healthCount = Math.max(0, healthCount - currentMonster.attack); // Ensure health doesn't go below 0
            battleMessage += `The ${currentMonster.name} hits you for ${currentMonster.attack} health!`;
            updateHealthCounter();

            monsterHealthDisplay.textContent = `Health: ${currentMonster.health}`;
            monsterMessageDisplay.textContent = battleMessage;

            if (healthCount <= 0) {
                gameOverReason.textContent = "You ran out of health battling the monster!";
                gameOver();
                endMonsterEncounter(); // Ensure screen is hidden
            }
        }

        /**
         * Handles the player running from the monster.
         */
        function runFromMonster() {
            let runMessage = "";
            if (Math.random() < playerRunSuccessChance) {
                healthCount = Math.max(0, healthCount - runHealthPenalty); // Ensure health doesn't go below 0
                updateHealthCounter();
                runMessage = `You successfully escaped the ${currentMonster.name}, but lost ${runHealthPenalty} health in the process.`;
                showMessage(runMessage, 3000);
                endMonsterEncounter();
            } else {
                healthCount = Math.max(0, healthCount - monsterHitHealthLoss); // Ensure health doesn't go below 0
                goldCount = Math.max(0, goldCount - monsterHitGoldLoss); // Ensure gold doesn't go below 0
                updateHealthCounter();
                updateGoldCounter();
                runMessage = `You failed to escape the ${currentMonster.name} and took ${monsterHitHealthLoss} health damage and lost ${monsterHitGoldLoss} gold!`;
                showMessage(runMessage, 3000);
                if (healthCount <= 0) { // Only health leads to game over now
                    gameOverReason.textContent = "You ran out of health trying to escape the monster!";
                    gameOver();
                }
                endMonsterEncounter(); // End encounter regardless of success/failure
            }
        }

        /**
         * Ends the monster encounter and returns to map.
         */
        function endMonsterEncounter() {
            isMonsterEncounterActive = false;
            currentMonster = null;
            monsterEncounterScreen.style.display = 'none';
            enableGameInput();
            drawMap(); // Redraw map to reflect any changes
        }

        /**
         * Updates the displayed health amount and gold cost based on the healing slider's value.
         */
        function updateHealSliderDisplay() {
            const healthToHeal = parseInt(healthHealSlider.value);
            const goldCost = healthToHeal / healthPerGoldUnitHeal;

            healHealthButton.textContent = `Heal ${healthToHeal} Health for ${goldCost} Gold`;

            // Disable heal button if cost is too high or healthToHeal is 0 or health is full
            if (healthToHeal === 0 || goldCount < goldCost || healthCount >= maxHealthCapacity) {
                healHealthButton.disabled = true;
                healHealthButton.classList.add('opacity-50', 'cursor-not-allowed');
                healHealthButton.classList.remove('hover:bg-red-700', 'transform', 'hover:scale-105');
            } else {
                healHealthButton.disabled = false;
                healHealthButton.classList.remove('opacity-50', 'cursor-not-allowed');
                healHealthButton.classList.add('hover:bg-red-700', 'transform', 'hover:scale-105');
            }
        }

        /**
         * Handles healing health in the town.
         */
        function healHealth() {
            const healthToHeal = parseInt(healthHealSlider.value);
            const goldCost = healthToHeal / healthPerGoldUnitHeal;

            if (healthToHeal === 0) {
                showMessage("Please select an amount of health to heal.", 2000);
                return;
            }

            if (goldCount >= goldCost) {
                goldCount -= goldCost;
                healthCount += healthToHeal;
                // Cap healthCount at maxHealthCapacity
                healthCount = Math.min(healthCount, maxHealthCapacity);

                updateHealthCounter();
                updateGoldCounter();
                showMessage(`You healed ${healthToHeal} health for ${goldCost} gold!`, 2500);
                // Update slider max and display after purchase
                showTownScreen(townNames[`${playerX},${playerY}`]);
            } else {
                showMessage("Not enough gold to heal that much health!", 2500);
            }
        }

        /**
         * Updates the displayed food amount and gold cost based on the slider's value.
         */
        function updateSliderDisplay() {
            const foodToBuy = parseInt(foodBuySlider.value);
            const goldCost = foodToBuy / foodPerGoldUnit;

            buyFoodButton.textContent = `Buy ${foodToBuy} Food for ${goldCost} Gold`;
            // Disable buy button if cost is too high or foodToBuy is 0
            if (foodToBuy === 0 || goldCount < goldCost) {
                buyFoodButton.disabled = true;
                buyFoodButton.classList.add('opacity-50', 'cursor-not-allowed');
                buyFoodButton.classList.remove('hover:bg-green-700', 'transform', 'hover:scale-105');
            } else {
                buyFoodButton.disabled = false;
                buyFoodButton.classList.remove('opacity-50', 'cursor-not-allowed');
                buyFoodButton.classList.add('hover:bg-green-700', 'transform', 'hover:scale-105');
            }
        }

        /**
         * Displays the town interaction screen.
         * @param {string} name - The name of the town to display.
         */
        function showTownScreen(name) {
            // Check for victory condition first
            if (name === retirementGoal.townName && goldCount >= retirementGoal.goldAmount) {
                showVictoryScreen();
                return; // Stop processing and show victory screen instead
            }

            townNameDisplay.textContent = name;
            
            // Calculate max food player can buy based on current food and max capacity
            const maxBuyableFoodByCapacity = maxFoodCapacity - foodCount;
            // Calculate max food player can buy based on current gold
            const maxBuyableFoodByGold = Math.floor(goldCount * foodPerGoldUnit);

            // Set food slider max
            const sliderFoodMax = Math.max(0, Math.floor(Math.min(maxBuyableFoodByCapacity, maxBuyableFoodByGold) / 10) * 10);
            foodBuySlider.max = sliderFoodMax;
            foodBuySlider.value = 0; // Start slider at 0
            updateSliderDisplay(); // Update food slider display initially

            // Calculate max health player can heal based on current health and max capacity
            const maxHealableHealth = maxHealthCapacity - healthCount;
            // Calculate max health player can heal based on current gold
            const maxHealableHealthByGold = Math.floor(goldCount * healthPerGoldUnitHeal);

            // Set health slider max, ensuring it's a multiple of 2
            const sliderHealthMax = Math.max(0, Math.floor(Math.min(maxHealableHealth, maxHealableHealthByGold) / 2) * 2);
            healthHealSlider.max = sliderHealthMax;
            healthHealSlider.value = 0; // Start slider at 0
            updateHealSliderDisplay(); // Update health slider display initially

            // Generate and display available delivery quests
            generateDeliveryQuests();
            townScreen.style.display = 'flex';
            // Disable game input
            disableGameInput();
        }

        /**
         * Handles buying food in the town.
         */
        function buyFood() {
            const foodToBuy = parseInt(foodBuySlider.value);
            const goldCost = foodToBuy / foodPerGoldUnit;

            if (foodToBuy === 0) {
                showMessage("Please select an amount of food to buy.", 2000);
                return;
            }

            if (goldCount >= goldCost) {
                goldCount -= goldCost;
                foodCount += foodToBuy;
                // Cap foodCount at maxFoodCapacity
                foodCount = Math.min(foodCount, maxFoodCapacity);

                updateFoodCounter();
                updateGoldCounter();
                showMessage(`You bought ${foodToBuy} food for ${goldCost} gold!`, 2500);
                // Update slider max and display after purchase
                showTownScreen(townNames[`${playerX},${playerY}`]);
            } else {
                showMessage("Not enough gold to buy that much food!", 2500);
            }
        }

        /**
         * Closes the town interaction screen and re-enables game input.
         */
        function closeTownScreen() {
            townScreen.style.display = 'none';
            // Re-enable game input
            enableGameInput();
            drawMap(); // Redraw map to ensure player is visible
        }

        /**
         * Disables all game input listeners.
         */
        function disableGameInput() {
            window.removeEventListener('keydown', handleKeyDown);
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            canvas.removeEventListener('wheel', handleMouseWheel);
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
        }

        /**
         * Enables all game input listeners.
         */
        function enableGameInput() {
            window.addEventListener('keydown', handleKeyDown);
            canvas.addEventListener('mousedown', handleMouseDown);
            canvas.addEventListener('mousemove', handleMouseMove);
            canvas.addEventListener('mouseup', handleMouseUp);
            canvas.addEventListener('mouseleave', handleMouseLeave);
            canvas.addEventListener('wheel', handleMouseWheel);
            canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
            canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
            canvas.addEventListener('touchend', handleTouchEnd);
        }

        /**
         * Restarts the game, resetting food/gold, regenerating the map, and re-enabling input.
         */
        function restartGame() {
            victoryScreen.style.display = 'none'; // Hide victory screen
            gameOverScreen.style.display = 'none'; //hide game over screen
            townScreen.style.display = 'none'; // Hide town screen if open
            monsterEncounterScreen.style.display = 'none'; // Hide monster screen if open
            activeQuests = []; // Clear any active quests
            updateActiveQuestDisplay(); // Hide quest display
            turnsInHazardousTerrain = 0; // Reset monster encounter counter
            enableGameInput(); //re-enable input

            dayCount = 0; // Reset day count
            foodCount = 100; //reset food
            goldCount = 10; // Reset gold
            healthCount = 100; // Reset health
            updateDayCounter();
            updateHealthCounter(); // Update health display
            updateFoodCounter();
            updateGoldCounter();
            generateMap();
            setupRetirementGoal(); // Set a new retirement goal
            initializePlayer();
            resizeCanvas(); // Ensure canvas is correctly sized and map drawn
            drawMap();
            showTownScreen(retirementGoal.townName); // Show the starting town screen
        }

        /**
         * Handles keyboard input for player movement.
         * @param {KeyboardEvent} event - The keyboard event.
         */
        function handleKeyDown(event) {
            switch (event.key) {
                case 'ArrowUp':
                case 'w':
                    movePlayer(0, -1);
                    break;
                case 'ArrowDown':
                case 's':
                    movePlayer(0, 1);
                    break;
                case 'ArrowLeft':
                case 'a':
                    movePlayer(-1, 0);
                    break;
                case 'ArrowRight':
                case 'd':
                    movePlayer(1, 0);
                    break;
            }
        }

        /**
         * Attempts to move the player by the given delta coordinates.
         * Handles terrain interactions, food/gold consumption, and game over conditions.
         * @param {number} dx - Change in X coordinate.
         * @param {number} dy - Change in Y coordinate.
         */
        function movePlayer(dx, dy) {
            // Prevent movement if an encounter is active
            if (isMonsterEncounterActive) {
                showMessage("You must deal with the monster first!", 1500);
                return;
            }

            const newX = playerX + dx;
            const newY = playerY + dy;

            // Check boundaries
            if (newX < 0 || newX >= mapWidth || newY < 0 || newY >= mapHeight) {
                showMessage("You can't go off the map!", 1500);
                return; // Cannot move off map
            }

            const targetTileType = mapData[newY][newX];
            let movementCost = 1; // Base food cost for moving
            let canMove = true;
            let message = "";

            // Check for quest completion first
            const completedQuests = activeQuests.filter(quest => newX === quest.targetX && newY === quest.targetY);

            if (completedQuests.length > 0) {
                let totalReward = 0;
                const completedTownName = completedQuests[0].targetTownName; // All quests will be for the same town

                completedQuests.forEach(quest => {
                    totalReward += quest.reward;
                });

                goldCount += totalReward;
                const completionMessage = completedQuests.length > 1
                    ? `${completedQuests.length} deliveries to ${completedTownName} complete! You earned a total of ${totalReward} gold.`
                    : `Delivery to ${completedTownName} complete! You earned ${totalReward} gold.`;
                
                showMessage(completionMessage, 4000);

                // Remove completed quests from the main list
                activeQuests = activeQuests.filter(quest => !completedQuests.includes(quest));

                updateGoldCounter();
                updateActiveQuestDisplay();

                // Move player and show town screen since a delivery is always to a town
                playerX = newX;
                playerY = newY;
                showTownScreen(townNames[`${newX},${newY}`]); // Show town screen
                turnsInHazardousTerrain = 0; // Reset counter when entering town
                return; // Exit movePlayer, as town screen handles further actions
            }

            switch (targetTileType) {
                case 1: // Mountain
                    canMove = false;
                    message = "Mountains are impassable!";
                    break;
                case 3: // Lake
                    canMove = false;
                    message = "Lakes are too deep to cross!";
                    break;
                case 2: // Forest
                    movementCost = 2; // More food
                    message = "You trek through the dense forest.";
                    // Removed gold finding in forests
                    break;
                case 4: // Town (if not a quest target)
                    playerX = newX; // Update player position before showing town screen
                    playerY = newY;
                    showTownScreen(townNames[`${newX},${newY}`]); // Call new function
                    turnsInHazardousTerrain = 0; // Reset counter when entering town
                    return; // Exit movePlayer, as town screen handles further actions
                case 5: // Swamp
                    movementCost = 3; // Even more food
                    message = "The murky swamp slows you down.";
                    break;
                case 0: // Open Space
                default:
                    movementCost = 1;
                    message = "You traverse the open plains.";
                    break;
            }

            if (!canMove) {
                showMessage(message, 1500);
                return;
            }

            // Apply movement cost
            foodCount = Math.max(0, foodCount - movementCost); // Ensure food doesn't go below 0
            dayCount += movementCost; // Each unit of food consumed is a "day"
            updateFoodCounter();
            updateGoldCounter();
            updateDayCounter();
            updateQuestTimers(movementCost); // Update quest timers based on days passed

            // New: Health penalty if food is 0
            if (foodCount <= 0) {
                healthCount = Math.max(0, healthCount - noFoodHealthPenalty); // Ensure health doesn't go below 0
                updateHealthCounter();
                showMessage(`You have no food! You lose ${noFoodHealthPenalty} health!`, 2500);
            }

            // Check for game over conditions (only health now)
            if (healthCount <= 0) {
                gameOverReason.textContent = "You have run out of health!";
                gameOver();
                return;
            }

            playerX = newX;
            playerY = newY;
            showMessage(message, 2500); // Show message after successful move

            // Check for monster encounter after movement and message
            if (targetTileType === 2 || targetTileType === 5) { // Forest or Swamp
                turnsInHazardousTerrain++;
                let encounterChance = baseEncounterChance + (turnsInHazardousTerrain * chanceIncreasePerTurn);
                encounterChance = Math.min(encounterChance, maxEncounterChance); // Cap the chance

                if (Math.random() < encounterChance) {
                    startMonsterEncounter();
                    return; // Stop further movement processing until encounter is resolved
                }
            } else {
                turnsInHazardousTerrain = 0; // Reset counter if not in hazardous terrain
            }

            // Recenter view if player goes off-screen (with a buffer)
            const playerScreenX = playerX * gridSize - viewOffsetX / zoomLevel;
            const playerScreenY = playerY * gridSize - viewOffsetY / zoomLevel;

            const screenBuffer = 0.2; // 20% buffer
            const screenWidth = canvas.width / zoomLevel;
            const screenHeight = canvas.height / zoomLevel;

            if (playerScreenX < screenWidth * screenBuffer || playerScreenX > screenWidth * (1 - screenBuffer) ||
                playerScreenY < screenHeight * screenBuffer || playerScreenY > screenHeight * (1 - screenBuffer)) {
                viewOffsetX = playerX * gridSize - canvas.width / (2 * zoomLevel);
                viewOffsetY = playerY * gridSize - canvas.height / (2 * zoomLevel);
            }
            drawMap();
        }

        /**
         * Handles mouse down events for dragging the map.
         * @param {MouseEvent} event - The mouse event.
         */
        function handleMouseDown(event) {
            isDragging = true;
            dragStartX = event.clientX;
            dragStartY = event.clientY;
            canvas.style.cursor = 'grabbing';
        }

        /**
         * Handles mouse move events for dragging the map.
         * @param {MouseEvent} event - The mouse event.
         */
        function handleMouseMove(event) {
            if (!isDragging) return;
            const deltaX = event.clientX - dragStartX;
            const deltaY = event.clientY - dragStartY;
            viewOffsetX -= deltaX / zoomLevel;
            viewOffsetY -= deltaY / zoomLevel;
            dragStartX = event.clientX;
            dragStartY = event.clientY;
            drawMap();
        }

        /**
         * Handles mouse up events, ending the dragging state.
         */
        function handleMouseUp() {
            isDragging = false;
            canvas.style.cursor = 'grab';
        }

        /**
         * Handles mouse leave events, ending the dragging state if the mouse leaves the canvas.
         */
        function handleMouseLeave() {
            isDragging = false;
            canvas.style.cursor = 'grab';
        }

        /**
         * Handles mouse wheel events for zooming in and out.
         * @param {WheelEvent} event - The wheel event.
         */
        function handleMouseWheel(event) {
            event.preventDefault(); // Prevent page scroll

            const oldZoomLevel = zoomLevel;
            if (event.deltaY < 0) { // Scrolling up, zoom in
                zoomLevel = Math.min(maxZoom, zoomLevel + zoomSpeed);
            } else if (event.deltaY > 0) { // Scrolling down, zoom out
                zoomLevel = Math.max(minZoom, zoomLevel - zoomSpeed);
            }

            // Adjust view offset to zoom towards the mouse cursor
            const mouseX = event.clientX;
            const mouseY = event.clientY;

            viewOffsetX += (mouseX / oldZoomLevel) - (mouseX / zoomLevel);
            viewOffsetY += (mouseY / oldZoomLevel) - (mouseY / zoomLevel);

            drawMap();
        }

        let touchStartX, touchStartY;
        let lastTouchX, lastTouchY; // For continuous panning on touchmove

        /**
         * Handles touch start events for panning and preparing for swipe movement.
         * @param {TouchEvent} event - The touch event.
         */
        function handleTouchStart(event) {
            event.preventDefault(); // Prevent scrolling
            isDragging = true;
            touchStartX = event.touches[0].clientX;
            touchStartY = event.touches[0].clientY;
            lastTouchX = touchStartX; // Initialize for panning
            lastTouchY = touchStartY; // Initialize for panning
            canvas.style.cursor = 'grabbing';
        }

        /**
         * Handles touch move events for panning the map.
         * @param {TouchEvent} event - The touch event.
         */
        function handleTouchMove(event) {
            event.preventDefault(); // Prevent scrolling
            if (!isDragging) return;
            const currentX = event.touches[0].clientX;
            const currentY = event.touches[0].clientY;
            const deltaX = currentX - lastTouchX;
            const deltaY = currentY - lastTouchY;
            viewOffsetX -= deltaX / zoomLevel;
            viewOffsetY -= deltaY / zoomLevel;
            lastTouchX = currentX;
            lastTouchY = currentY;
            drawMap();
        }

        /**
         * Handles touch end events for determining swipe gestures for player movement.
         * @param {TouchEvent} event - The touch event.
         */
        function handleTouchEnd(event) {
            isDragging = false;
            canvas.style.cursor = 'grab';

            // Implement swipe for movement if not a significant drag
            if (event.changedTouches.length > 0) {
                const endX = event.changedTouches[0].clientX;
                const endY = event.changedTouches[0].clientY;

                const swipeThreshold = 30; // Minimum distance for a swipe

                const deltaX = endX - touchStartX;
                const deltaY = endY - touchStartY;

                // Check if it was primarily a swipe, not just a tap or small drag
                if (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) {
                    if (Math.abs(deltaX) > Math.abs(deltaY)) {
                        // Horizontal swipe
                        if (deltaX > 0) {
                            movePlayer(1, 0); // Right
                        } else {
                            movePlayer(-1, 0); // Left
                        }
                    } else {
                        // Vertical swipe
                        if (deltaY > 0) {
                            movePlayer(0, 1); // Down
                        } else {
                            movePlayer(0, -1); // Up
                        }
                    }
                }
            }
        }

        // Event Listeners
        restartButton.addEventListener('click', restartGame);
        restartButtonVictory.addEventListener('click', restartGame);
        buyFoodButton.addEventListener('click', buyFood);
        closeTownButton.addEventListener('click', closeTownScreen);
        foodBuySlider.addEventListener('input', updateSliderDisplay); // Listen for food slider changes

        // New event listeners for health healing
        healthHealSlider.addEventListener('input', updateHealSliderDisplay);
        healHealthButton.addEventListener('click', healHealth);

        // Removed noDeliveryButton.addEventListener('click', closeTownButton);

        // Add event listeners for delivery options
        deliveryOptionButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                if (availableQuests[index]) { // Ensure a quest exists at this index
                    takeDeliveryQuest(index);
                }
            });
        });

        // Monster encounter buttons
        fightButton.addEventListener('click', fightMonster);
        runButton.addEventListener('click', runFromMonster);

        // Initial input setup
        enableGameInput();

        // Initial setup when the window loads
        window.addEventListener('load', () => {

            generateMap();
            setupRetirementGoal(); // Set the initial retirement goal so player can start there
            initializePlayer();
            resizeCanvas(); // Set canvas size and draw map
            updateDayCounter(); // Update day display
            updateHealthCounter(); // Update health display
            updateFoodCounter();
            updateGoldCounter();
            updateActiveQuestDisplay(); // Initialize quest display
            showTownScreen(retirementGoal.townName); // Show the starting town screen
        });

        // Handle window resize events
        window.addEventListener('resize', () => {
            resizeCanvas(); // Handle resizes
        });
