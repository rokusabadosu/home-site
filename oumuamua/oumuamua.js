const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const starCounterElement = document.getElementById('starCounter');
const timerDisplayElement = document.getElementById('timerDisplay');
const fuelDisplayElement = document.getElementById('fuelDisplay');
const gameOverTitle = document.getElementById('gameOverTitle');
const gameOverText = document.getElementById('gameOverText');
const gameOverTime = document.getElementById('gameOverTime');
const bestTimeEasyElement = document.getElementById('bestTimeEasy');
const bestTimeMediumElement = document.getElementById('bestTimeMedium');
const bestTimeHardElement = document.getElementById('bestTimeHard');
const startScreen = document.getElementById('startScreen');
const easyButton = document.getElementById('easyButton');
const mediumButton = document.getElementById('mediumButton');
const hardButton = document.getElementById('hardButton');

let dimensions = { width: window.innerWidth, height: window.innerHeight };

canvas.width = dimensions.width;
canvas.height = dimensions.height;

const spaceship = {
    x: dimensions.width / 2,
    y: dimensions.height / 2,
    angle: Math.PI / 2,
    speed: 0,
    rotationSpeed: 0.05,
    acceleration: 0.1,
    maxSpeed: 5,
    color: '#00FFFF', // Oumuamua is reddish, but this is more visible
    fuel: 150, // Default to medium
    baseFuelConsumption: 1,
    collisionRadius: 10
};

let stars = [];
let backgroundStars = [];
let frameCount = 0;

const GAME_SETTINGS = {
    NUM_STARS: 12,
    STAR_RADIUS: 6,
    NUM_BACKGROUND_STARS: 200,
    GRAVITY_CONSTANT: 0.1,
    GRAVITY_RADIUS: 50,
    EDGE_MARGIN: 50,
    TIME_MULTIPLIER: 100, // Each second is 100 years
    MAX_FUEL: 1000,
};

const DIFFICULTY_LEVELS = {
    easy: { startingFuel: 500, fuelPerVisit: 100 },
    medium: { startingFuel: 150, fuelPerVisit: 30 },
    hard: { startingFuel: 50, fuelPerVisit: 10 }
};

let currentDifficulty = 'medium';

let visitedStars = new Set();
let visitedStarCount = 0;
let elapsedTime = 0;
let timerInterval;
let gameOver = false;
const haloSize = 10;
const counterWidth = 150;
const counterHeight = 80;
let bestTimes = {
    easy: null,
    medium: null,
    hard: null
};

function loadBestTimes() {
    const savedTimes = localStorage.getItem('oumuamuaBestTimes');
    if (savedTimes) {
        bestTimes = JSON.parse(savedTimes);
    }
}

function generateBackgroundStars() {
    backgroundStars = [];
    for (let i = 0; i < GAME_SETTINGS.NUM_BACKGROUND_STARS; i++) {
        backgroundStars.push({
            x: Math.random() * dimensions.width,
            y: Math.random() * dimensions.height,
            size: Math.random() * 2 + 0.5, // Varying sizes
            // Slower stars are "further away"
            parallaxSpeed: Math.random() * 0.2 + 0.05
        });
    }
}

function generateStars() {
    stars = [];
    for (let i = 0; i < GAME_SETTINGS.NUM_STARS; i++) {
        // Generate random bright colors for the stars
        const r = 150 + Math.floor(Math.random() * 106);
        const g = 150 + Math.floor(Math.random() * 106);
        const b = 150 + Math.floor(Math.random() * 106);
        const randomColor = `rgb(${r},${g},${b})`;

        // Ensure stars are not generated near the edges or behind the counters
        const minX = Math.max(GAME_SETTINGS.EDGE_MARGIN, counterWidth + GAME_SETTINGS.EDGE_MARGIN);
        const maxX = dimensions.width - GAME_SETTINGS.EDGE_MARGIN;
        const minY = Math.max(GAME_SETTINGS.EDGE_MARGIN, counterHeight + GAME_SETTINGS.EDGE_MARGIN);
        const maxY = dimensions.height - GAME_SETTINGS.EDGE_MARGIN;

        stars.push({
            x: minX + Math.random() * (maxX - minX),
            y: minY + Math.random() * (maxY - minY),
            radius: GAME_SETTINGS.STAR_RADIUS,
            color: randomColor,
            visited: false,
            initialColor: randomColor,
        });
    }
}

function drawStars() {
    stars.forEach((star, index) => {
        // Twinkling effect
        const twinkleFactor = Math.sin(frameCount * 0.05 + index * 0.5) * 0.2 + 0.9; // sin wave for gentle pulse
        const currentRadius = star.radius * twinkleFactor;

        ctx.beginPath();
        ctx.arc(star.x, star.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.shadowBlur = 10; // Add a glow to the main stars
        ctx.shadowColor = star.color;
        ctx.fill();
        ctx.closePath();

        if (star.visited) {
            // Draw the halo
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius + haloSize, 0, Math.PI * 2);
            ctx.strokeStyle = star.color;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.closePath();
        }
        ctx.shadowBlur = 0; // Reset shadow blur for other elements
    });
}

function drawSpaceship() {
    ctx.save();
    ctx.translate(spaceship.x, spaceship.y);
    ctx.rotate(spaceship.angle);

    // Draw thruster flame if accelerating and has fuel
    if ((keys['w'] || keys['ArrowUp']) && spaceship.fuel > 0) {
        ctx.beginPath();
        // Make the flame flicker
        const flameLength = 15 + Math.random() * 10;
        const flameWidth = 4 + Math.random() * 2;
        ctx.moveTo(-22, 0); // Back of the ship (adjusted for new shape)
        ctx.lineTo(-22 - flameLength, flameWidth);
        ctx.lineTo(-22 - flameLength, -flameWidth);
        ctx.closePath();

        // Gradient for the flame
        const gradient = ctx.createLinearGradient(-22, 0, -22 - flameLength, 0);
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(0.7, '#00FFFF');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)'); // Fades out
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    // Reset shadows for the ship body to keep edges crisp
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // Asteroid main body (darker base for 3D effect)
    ctx.beginPath();
    ctx.moveTo(25, 0);   // Nose
    ctx.lineTo(18, -3);
    ctx.lineTo(5, -5);
    ctx.lineTo(-10, -4);
    ctx.lineTo(-20, -2);
    ctx.lineTo(-22, 0);  // Back-center
    ctx.lineTo(-20, 2);
    ctx.lineTo(-10, 4);
    ctx.lineTo(5, 5);
    ctx.lineTo(18, 3);
    ctx.closePath();
    ctx.fillStyle = '#595959'; // Dark grey rock
    ctx.fill();

    // Lighter central ridge for 3D effect
    ctx.beginPath();
    ctx.moveTo(25, 0);   // Nose
    ctx.lineTo(15, -2);
    ctx.lineTo(-18, -1);
    ctx.lineTo(-20, 0);
    ctx.lineTo(-18, 1);
    ctx.lineTo(15, 2);
    ctx.closePath();
    ctx.fillStyle = '#8C8C8C'; // Lighter grey rock
    ctx.fill();

    ctx.restore();
}

let keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function updateSpaceship() {
    if (gameOver) return;

    let isManeuvering = false;
    if (keys['w'] || keys['ArrowUp']) {
        spaceship.speed += spaceship.acceleration;
        isManeuvering = true;
    }
    if (keys['s'] || keys['ArrowDown']) {
        spaceship.speed -= spaceship.acceleration;
        isManeuvering = true;
    }
    if (keys['a'] || keys['ArrowLeft']) {
        spaceship.angle -= spaceship.rotationSpeed;
        isManeuvering = true;
    }
    if (keys['d'] || keys['ArrowRight']) {
        spaceship.angle += spaceship.rotationSpeed;
        isManeuvering = true;
    }

    if (isManeuvering) spaceship.fuel -= spaceship.baseFuelConsumption;

    spaceship.speed = Math.max(Math.min(spaceship.speed, spaceship.maxSpeed), 0);

    let netForceX = 0;
    let netForceY = 0;

    // Apply gravity from stars
    stars.forEach(star => {
        const { dx, dy, distance } = getDistance(spaceship, star);
        if (distance > 0 && distance < GAME_SETTINGS.GRAVITY_RADIUS) {
            const forceMagnitude = GAME_SETTINGS.GRAVITY_CONSTANT / distance;
            // Add the force vector components for this star to the net force
            netForceX += (dx / distance) * forceMagnitude;
            netForceY += (dy / distance) * forceMagnitude;
        }
    });

    // If there's a net gravitational force, adjust the spaceship's angle
    if (netForceX !== 0 || netForceY !== 0) {
        const targetAngle = Math.atan2(netForceY, netForceX);
        let angleDifference = targetAngle - spaceship.angle;

        // Normalize the angle difference to the shortest path
        if (angleDifference > Math.PI) angleDifference -= 2 * Math.PI;
        if (angleDifference < -Math.PI) angleDifference += 2 * Math.PI;

        const netForceMagnitude = Math.sqrt(netForceX * netForceX + netForceY * netForceY);
        spaceship.angle += angleDifference * netForceMagnitude;
    }

    const dx = spaceship.speed * Math.cos(spaceship.angle);
    const dy = spaceship.speed * Math.sin(spaceship.angle);

    spaceship.x += dx;
    spaceship.y += dy;

    if (spaceship.x > dimensions.width) spaceship.x = 0;
    if (spaceship.x < 0) spaceship.x = dimensions.width;
    if (spaceship.y > dimensions.height) spaceship.y = 0;
    if (spaceship.y < 0) spaceship.y = dimensions.height;

    // Update background stars for parallax effect
    backgroundStars.forEach(star => {
        star.x -= dx * star.parallaxSpeed;
        star.y -= dy * star.parallaxSpeed;

        // Wrap around the screen
        if (star.x < 0) star.x += dimensions.width;
        if (star.x > dimensions.width) star.x -= dimensions.width;
        if (star.y < 0) star.y += dimensions.height;
        if (star.y > dimensions.height) star.y -= dimensions.height;
    });

    stars.forEach((star, index) => {
        const { distance } = getDistance(spaceship, star);

        if (distance < star.radius + spaceship.collisionRadius && !star.visited) {
            star.visited = true;
            visitedStars.add(index);
            visitedStarCount = visitedStars.size;
            starCounterElement.querySelector('span').textContent = visitedStarCount;

            spaceship.fuel = Math.min(spaceship.fuel + DIFFICULTY_LEVELS[currentDifficulty].fuelPerVisit, GAME_SETTINGS.MAX_FUEL);
        }
    });

    fuelDisplayElement.querySelector('span').textContent = Math.floor(Math.max(0, spaceship.fuel));

    if (spaceship.fuel <= 0) {
        endGame("fuel");
    }

    if (visitedStars.size === GAME_SETTINGS.NUM_STARS) {
        endGame("stars");
    }
}

function getDistance(obj1, obj2) {
    const dx = obj2.x - obj1.x;
    const dy = obj2.y - obj1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return { dx, dy, distance };
}

function updateTimer() {
    elapsedTime += 1;
    timerDisplayElement.querySelector('span').textContent = elapsedTime * GAME_SETTINGS.TIME_MULTIPLIER;
}

function endGame(reason) {
    gameOver = true;
    clearInterval(timerInterval);
    gameOverTime.textContent = `Elapsed Time: ${elapsedTime * GAME_SETTINGS.TIME_MULTIPLIER} Years`;

    switch (reason) {
        case "fuel":
            gameOverTitle.textContent = "Game Over";
            gameOverText.textContent = "You ran out of fuel!";
            break;
        case "stars":
            gameOverTitle.textContent = "Well done Captain!";
            gameOverText.textContent = "You have fulfilled your mission by mapping out the local star system!";
            if (bestTimes[currentDifficulty] === null || elapsedTime < bestTimes[currentDifficulty]) {
                bestTimes[currentDifficulty] = elapsedTime;
                localStorage.setItem('oumuamuaBestTimes', JSON.stringify(bestTimes));
                updateBestTimeDisplays();
            }
            break;
    }

    startScreen.style.display = "flex";
}

function updateBestTimeDisplays() {
    bestTimeEasyElement.querySelector('span').textContent = bestTimes.easy !== null ? (bestTimes.easy * GAME_SETTINGS.TIME_MULTIPLIER) + ' Years' : '-';
    bestTimeMediumElement.querySelector('span').textContent = bestTimes.medium !== null ? (bestTimes.medium * GAME_SETTINGS.TIME_MULTIPLIER) + ' Years' : '-';
    bestTimeHardElement.querySelector('span').textContent = bestTimes.hard !== null ? (bestTimes.hard * GAME_SETTINGS.TIME_MULTIPLIER) + ' Years' : '-';
}

function resetAndStartGame() {
    gameOver = false;
    startScreen.style.display = "none";
    spaceship.x = dimensions.width / 2;
    spaceship.y = dimensions.height / 2;
    spaceship.angle = Math.PI / 2;
    spaceship.speed = 0;
    spaceship.fuel = DIFFICULTY_LEVELS[currentDifficulty].startingFuel;
    visitedStars.clear();
    visitedStarCount = 0;
    elapsedTime = 0;
    starCounterElement.querySelector('span').textContent = visitedStarCount;
    fuelDisplayElement.querySelector('span').textContent = spaceship.fuel;
    timerDisplayElement.querySelector('span').textContent = '0';
    timerInterval = setInterval(updateTimer, 1000);
    generateStars();
    generateBackgroundStars();
    gameLoop();
}

function drawBackground() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    backgroundStars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
    });
}

function gameLoop() {
    if (!gameOver) {
        frameCount++;
        updateSpaceship();
        drawBackground();
        drawStars();
        drawSpaceship();
        requestAnimationFrame(gameLoop);
    }
}

function selectDifficultyAndStart(difficulty) {
    currentDifficulty = difficulty;
    resetAndStartGame();
}

easyButton.addEventListener('click', () => selectDifficultyAndStart('easy'));
mediumButton.addEventListener('click', () => selectDifficultyAndStart('medium'));
hardButton.addEventListener('click', () => selectDifficultyAndStart('hard'));

loadBestTimes();
updateBestTimeDisplays();

window.addEventListener('resize', () => {
    dimensions = { width: window.innerWidth, height: window.innerHeight };
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    // Regenerate stars to fit the new screen size
    generateStars();
    generateBackgroundStars();
});