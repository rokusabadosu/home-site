// ============================================================
// DOM REFERENCES
// ============================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const starCounterElement = document.getElementById('starCounter');
const timerDisplayElement = document.getElementById('timerDisplay');
const fuelDisplayElement = document.getElementById('fuelDisplay');
const fuelFillElement = document.getElementById('fuelFill');
const gameOverTitle = document.getElementById('gameOverTitle');
const gameOverText = document.getElementById('gameOverText');
const gameOverTime = document.getElementById('gameOverTime');
const bestTimeEasyElement = document.getElementById('bestTimeEasy');
const bestTimeMediumElement = document.getElementById('bestTimeMedium');
const bestTimeHardElement = document.getElementById('bestTimeHard');
const startScreen = document.getElementById('startScreen');
const pauseOverlay = document.getElementById('pauseOverlay');
const hudContainer = document.getElementById('hudContainer');
const easyButton = document.getElementById('easyButton');
const mediumButton = document.getElementById('mediumButton');
const hardButton = document.getElementById('hardButton');

// ============================================================
// CONSTANTS
// ============================================================
const GAME_SETTINGS = {
    NUM_STARS: 12,
    STAR_RADIUS: 6,
    NUM_BACKGROUND_STARS: 200,
    GRAVITY_CONSTANT: 0.05,
    GRAVITY_RADIUS: 50,
    EDGE_MARGIN: 50,
    TIME_MULTIPLIER: 100,
    MAX_FUEL: 1000,
};

const DIFFICULTY_LEVELS = {
    easy:   { startingFuel: 500, fuelPerVisit: 100 },
    medium: { startingFuel: 150, fuelPerVisit: 30  },
    hard:   { startingFuel: 50,  fuelPerVisit: 10  }
};

const MAX_SPEED      = 5;
const ACCELERATION   = 0.1;
const ROTATION_SPEED = 0.05;
const HALO_SIZE      = 10;

// ============================================================
// STATE
// ============================================================
let dimensions = { width: window.innerWidth, height: window.innerHeight };
canvas.width  = dimensions.width;
canvas.height = dimensions.height;

const spaceship = {
    x: dimensions.width / 2,
    y: dimensions.height / 2,
    angle: Math.PI / 2,
    speed: 0,
    fuel: 150,
    baseFuelConsumption: 1,
    collisionRadius: 10,
};

let stars            = [];
let backgroundStars  = [];
let particles        = [];   // thruster trail
let starBursts       = [];   // collection burst rings
let nebulaCanvas     = null; // pre-rendered offscreen nebula
let frameCount       = 0;
let currentDifficulty = 'medium';
let visitedStars     = new Set();
let gameOver         = false;
let paused           = false;
let animationFrameId = null;

// Timer state (performance.now() based — no setInterval)
let gameStartTime       = 0;
let totalPausedDuration = 0;
let pauseStartTime      = 0;
let finalElapsedSeconds = 0;

let bestTimes = { easy: null, medium: null, hard: null };

// ============================================================
// AUDIO (Web Audio API)
// ============================================================
let audioCtx    = null;
let thrustNode  = null;
let thrustGain  = null;

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    thrustGain = audioCtx.createGain();
    thrustGain.gain.value = 0;
    thrustGain.connect(audioCtx.destination);

    thrustNode = audioCtx.createOscillator();
    thrustNode.type = 'sawtooth';
    thrustNode.frequency.value = 80;
    thrustNode.connect(thrustGain);
    thrustNode.start();
}

function setThrustSound(active) {
    if (!audioCtx) return;
    thrustGain.gain.setTargetAtTime(active ? 0.08 : 0, audioCtx.currentTime, 0.05);
}

function playStarCollectSound() {
    if (!audioCtx) return;
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
}

function playGameOverSound(win) {
    if (!audioCtx) return;
    const freqs = win ? [262, 330, 392, 523] : [262, 220, 185];
    const step  = win ? 0.15 : 0.2;
    freqs.forEach((freq, i) => {
        const osc  = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        const t = audioCtx.currentTime + i * step;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.start(t);
        osc.stop(t + 0.5);
    });
}

// ============================================================
// PERSISTENCE
// ============================================================
function loadBestTimes() {
    const saved = localStorage.getItem('oumuamuaBestTimes');
    if (saved) bestTimes = JSON.parse(saved);
}

function saveBestTime(seconds) {
    if (bestTimes[currentDifficulty] === null || seconds < bestTimes[currentDifficulty]) {
        bestTimes[currentDifficulty] = seconds;
        localStorage.setItem('oumuamuaBestTimes', JSON.stringify(bestTimes));
        updateBestTimeDisplays();
    }
}

// ============================================================
// GENERATION
// ============================================================
function generateNebula() {
    nebulaCanvas = document.createElement('canvas');
    nebulaCanvas.width  = dimensions.width;
    nebulaCanvas.height = dimensions.height;
    const nc = nebulaCanvas.getContext('2d');

    // Soft coloured clouds layered on the black background
    const palette = [
        [30,  0,  80], // deep purple
        [ 0, 20,  90], // midnight blue
        [ 0, 60,  60], // teal
        [60,  0,  30], // dark crimson
        [10,  0,  60], // indigo
        [ 0, 40,  80], // ocean blue
    ];
    for (let i = 0; i < 8; i++) {
        const x = Math.random() * dimensions.width;
        const y = Math.random() * dimensions.height;
        const r = 180 + Math.random() * 320;
        const [cr, cg, cb] = palette[Math.floor(Math.random() * palette.length)];
        const alpha = 0.05 + Math.random() * 0.08;
        const grad = nc.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        nc.beginPath();
        nc.arc(x, y, r, 0, Math.PI * 2);
        nc.fillStyle = grad;
        nc.fill();
    }
}

function generateBackgroundStars() {
    backgroundStars = [];
    for (let i = 0; i < GAME_SETTINGS.NUM_BACKGROUND_STARS; i++) {
        backgroundStars.push({
            x: Math.random() * dimensions.width,
            y: Math.random() * dimensions.height,
            size: Math.random() * 2 + 0.5,
            parallaxSpeed: Math.random() * 0.2 + 0.05,
            twinkleOffset: Math.random() * Math.PI * 2,
        });
    }
}

function generateStars() {
    stars = [];
    const hudRect = hudContainer.getBoundingClientRect();
    const minX = Math.max(hudRect.right, GAME_SETTINGS.EDGE_MARGIN) + GAME_SETTINGS.EDGE_MARGIN;
    const minY = Math.max(hudRect.bottom, GAME_SETTINGS.EDGE_MARGIN) + GAME_SETTINGS.EDGE_MARGIN;
    const maxX = dimensions.width  - GAME_SETTINGS.EDGE_MARGIN;
    const maxY = dimensions.height - GAME_SETTINGS.EDGE_MARGIN;

    for (let i = 0; i < GAME_SETTINGS.NUM_STARS; i++) {
        const r = 150 + Math.floor(Math.random() * 106);
        const g = 150 + Math.floor(Math.random() * 106);
        const b = 150 + Math.floor(Math.random() * 106);
        stars.push({
            x: minX + Math.random() * (maxX - minX),
            y: minY + Math.random() * (maxY - minY),
            radius: GAME_SETTINGS.STAR_RADIUS,
            color: `rgb(${r},${g},${b})`,
            r, g, b,
            visited: false,
        });
    }
}

// ============================================================
// HELPERS
// ============================================================
function getDistance(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return { dx, dy, distance: Math.sqrt(dx * dx + dy * dy) };
}

function getElapsedSeconds() {
    if (gameStartTime === 0) return 0;
    const now = performance.now();
    const pausedOffset = paused ? (now - pauseStartTime) : 0;
    return (now - gameStartTime - totalPausedDuration - pausedOffset) / 1000;
}

// ============================================================
// PHYSICS
// ============================================================
function updateSpaceship() {
    if (gameOver || paused) return;

    // Rotation does NOT cost fuel
    if (keys['a'] || keys['ArrowLeft']  || keys['_touchLeft'])  spaceship.angle -= ROTATION_SPEED;
    if (keys['d'] || keys['ArrowRight'] || keys['_touchRight']) spaceship.angle += ROTATION_SPEED;

    // Thrust costs fuel
    let isThrusting = false;
    if (spaceship.fuel > 0) {
        if (keys['w'] || keys['ArrowUp']   || keys['_touchThrust']) {
            spaceship.speed += ACCELERATION;
            isThrusting = true;
        }
        if (keys['s'] || keys['ArrowDown'] || keys['_touchBrake']) {
            spaceship.speed -= ACCELERATION;
            isThrusting = true;
        }
        if (isThrusting) spaceship.fuel -= spaceship.baseFuelConsumption;
    }

    spaceship.speed = Math.max(Math.min(spaceship.speed, MAX_SPEED), 0);
    setThrustSound(isThrusting);

    // Gravity gently rotates the ship toward nearby stars
    let netForceX = 0;
    let netForceY = 0;
    stars.forEach(star => {
        const { dx, dy, distance } = getDistance(spaceship, star);
        if (distance > 0 && distance < GAME_SETTINGS.GRAVITY_RADIUS) {
            const force = ((GAME_SETTINGS.GRAVITY_RADIUS - distance) / GAME_SETTINGS.GRAVITY_RADIUS)
                          * GAME_SETTINGS.GRAVITY_CONSTANT;
            netForceX += (dx / distance) * force;
            netForceY += (dy / distance) * force;
        }
    });
    if (netForceX !== 0 || netForceY !== 0) {
        const targetAngle = Math.atan2(netForceY, netForceX);
        let diff = targetAngle - spaceship.angle;
        if (diff >  Math.PI) diff -= 2 * Math.PI;
        if (diff < -Math.PI) diff += 2 * Math.PI;
        spaceship.angle += diff * Math.sqrt(netForceX * netForceX + netForceY * netForceY);
    }

    // Move ship in the direction it faces
    const dx = spaceship.speed * Math.cos(spaceship.angle);
    const dy = spaceship.speed * Math.sin(spaceship.angle);
    spaceship.x += dx;
    spaceship.y += dy;

    // Torus wrapping
    if (spaceship.x > dimensions.width)  spaceship.x = 0;
    if (spaceship.x < 0)                 spaceship.x = dimensions.width;
    if (spaceship.y > dimensions.height) spaceship.y = 0;
    if (spaceship.y < 0)                 spaceship.y = dimensions.height;

    // Parallax background
    backgroundStars.forEach(bg => {
        bg.x -= dx * bg.parallaxSpeed;
        bg.y -= dy * bg.parallaxSpeed;
        if (bg.x < 0)                 bg.x += dimensions.width;
        if (bg.x > dimensions.width)  bg.x -= dimensions.width;
        if (bg.y < 0)                 bg.y += dimensions.height;
        if (bg.y > dimensions.height) bg.y -= dimensions.height;
    });

    // Spawn thruster particles when moving
    if (spaceship.speed > 0.3 && Math.random() < spaceship.speed / MAX_SPEED) {
        particles.push({
            x: spaceship.x - Math.cos(spaceship.angle) * 20 + (Math.random() - 0.5) * 5,
            y: spaceship.y - Math.sin(spaceship.angle) * 20 + (Math.random() - 0.5) * 5,
            vx: -Math.cos(spaceship.angle) * (Math.random() * 0.6),
            vy: -Math.sin(spaceship.angle) * (Math.random() * 0.6),
            life: 1.0,
            decay: 0.03 + Math.random() * 0.025,
            size: 1.2 + Math.random() * 1.8,
        });
    }

    // Star collection
    stars.forEach((star, index) => {
        if (star.visited) return;
        const { distance } = getDistance(spaceship, star);
        if (distance < star.radius + spaceship.collisionRadius) {
            star.visited = true;
            visitedStars.add(index);
            starCounterElement.querySelector('span').textContent = visitedStars.size;
            spaceship.fuel = Math.min(
                spaceship.fuel + DIFFICULTY_LEVELS[currentDifficulty].fuelPerVisit,
                GAME_SETTINGS.MAX_FUEL
            );
            playStarCollectSound();
            // Burst ring animation
            starBursts.push({ x: star.x, y: star.y, radius: star.radius, maxRadius: 55, life: 1.0, r: star.r, g: star.g, b: star.b });
        }
    });

    // HUD updates
    fuelDisplayElement.querySelector('span').textContent = Math.floor(Math.max(0, spaceship.fuel));
    const fuelPct = Math.max(0, spaceship.fuel) / GAME_SETTINGS.MAX_FUEL * 100;
    fuelFillElement.style.width = fuelPct + '%';
    // Green → amber → red as fuel depletes
    const red   = Math.round(255 * (1 - fuelPct / 100));
    const green = Math.round(200 * (fuelPct / 100));
    fuelFillElement.style.backgroundColor = `rgb(${red},${green},0)`;

    if (spaceship.fuel <= 0)                           endGame('fuel');
    if (visitedStars.size === GAME_SETTINGS.NUM_STARS) endGame('stars');
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x    += p.vx;
        p.y    += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function updateStarBursts() {
    for (let i = starBursts.length - 1; i >= 0; i--) {
        const b = starBursts[i];
        b.radius += (b.maxRadius - b.radius) * 0.12;
        b.life   -= 0.035;
        if (b.life <= 0) starBursts.splice(i, 1);
    }
}

// ============================================================
// RENDERING
// ============================================================
function drawBackground() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    if (nebulaCanvas) ctx.drawImage(nebulaCanvas, 0, 0);

    // Background stars — subtle twinkling
    backgroundStars.forEach(star => {
        const twinkle = Math.sin(frameCount * 0.03 + star.twinkleOffset) * 0.3 + 0.7;
        ctx.globalAlpha = twinkle * 0.6;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function drawGravityZones() {
    stars.forEach(star => {
        // Soft radial fill
        const grad = ctx.createRadialGradient(
            star.x, star.y, 0,
            star.x, star.y, GAME_SETTINGS.GRAVITY_RADIUS
        );
        grad.addColorStop(0, `rgba(${star.r},${star.g},${star.b},0.06)`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(star.x, star.y, GAME_SETTINGS.GRAVITY_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Dashed border in the star's own colour
        ctx.strokeStyle = `rgba(${star.r},${star.g},${star.b},0.2)`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 7]);
        ctx.stroke();
        ctx.setLineDash([]);
    });
}

function drawStarBursts() {
    starBursts.forEach(b => {
        ctx.save();
        ctx.globalAlpha = b.life * 0.7;
        ctx.shadowBlur  = 12;
        ctx.shadowColor = `rgb(${b.r},${b.g},${b.b})`;
        ctx.strokeStyle = `rgb(${b.r},${b.g},${b.b})`;
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    });
}

function drawStars() {
    stars.forEach((star, index) => {
        const twinkle      = Math.sin(frameCount * 0.05 + index * 0.5) * 0.2 + 0.9;
        const currentRadius = star.radius * twinkle;

        // Diffraction spikes (4 rays crossing the star)
        ctx.save();
        ctx.globalAlpha = 0.25 * twinkle;
        ctx.strokeStyle = star.color;
        ctx.lineWidth   = 0.8;
        const spikeLen  = currentRadius * 5;
        ctx.beginPath();
        ctx.moveTo(star.x - spikeLen, star.y); ctx.lineTo(star.x + spikeLen, star.y);
        ctx.moveTo(star.x, star.y - spikeLen); ctx.lineTo(star.x, star.y + spikeLen);
        ctx.stroke();
        ctx.restore();

        // Main glow
        ctx.shadowBlur  = 18;
        ctx.shadowColor = star.color;
        ctx.fillStyle   = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        // Visited halo
        if (star.visited) {
            ctx.shadowBlur  = 8;
            ctx.shadowColor = star.color;
            ctx.strokeStyle = star.color;
            ctx.lineWidth   = 1.5;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius + HALO_SIZE, 0, Math.PI * 2);
            ctx.stroke();
        }
    });
    ctx.shadowBlur = 0;
}

function drawParticles() {
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life * 0.85;
        ctx.shadowBlur  = 6;
        ctx.shadowColor = '#00FFFF';
        ctx.fillStyle   = p.life > 0.5 ? '#ffffff' : '#00FFFF';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function drawSpaceship() {
    const isThrusting = (keys['w'] || keys['ArrowUp'] || keys['_touchThrust']) && spaceship.fuel > 0;

    ctx.save();
    ctx.translate(spaceship.x, spaceship.y);
    ctx.rotate(spaceship.angle);

    // Thruster flame
    if (isThrusting) {
        const flameLength = 15 + Math.random() * 10;
        const flameWidth  = 4  + Math.random() * 2;
        const grad = ctx.createLinearGradient(-22, 0, -22 - flameLength, 0);
        grad.addColorStop(0,   'white');
        grad.addColorStop(0.5, '#00FFFF');
        grad.addColorStop(1,   'rgba(0,255,255,0)');
        ctx.shadowBlur  = 15;
        ctx.shadowColor = '#00FFFF';
        ctx.beginPath();
        ctx.moveTo(-22, 0);
        ctx.lineTo(-22 - flameLength,  flameWidth);
        ctx.lineTo(-22 - flameLength, -flameWidth);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
    }

    // Ship glow
    ctx.shadowBlur  = 12;
    ctx.shadowColor = 'rgba(0, 200, 255, 0.6)';

    // Asteroid body
    ctx.beginPath();
    ctx.moveTo( 25,  0);
    ctx.lineTo( 18, -3);
    ctx.lineTo(  5, -5);
    ctx.lineTo(-10, -4);
    ctx.lineTo(-20, -2);
    ctx.lineTo(-22,  0);
    ctx.lineTo(-20,  2);
    ctx.lineTo(-10,  4);
    ctx.lineTo(  5,  5);
    ctx.lineTo( 18,  3);
    ctx.closePath();
    ctx.fillStyle = '#595959';
    ctx.fill();

    ctx.shadowBlur = 0;

    // Lighter ridge
    ctx.beginPath();
    ctx.moveTo( 25,  0);
    ctx.lineTo( 15, -2);
    ctx.lineTo(-18, -1);
    ctx.lineTo(-20,  0);
    ctx.lineTo(-18,  1);
    ctx.lineTo( 15,  2);
    ctx.closePath();
    ctx.fillStyle = '#8C8C8C';
    ctx.fill();

    ctx.restore();
}

// ============================================================
// INPUT
// ============================================================
let keys = {};

document.addEventListener('keydown', (e) => {
    if (keys[e.key]) return;
    keys[e.key] = true;
    initAudio();

    if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') &&
        !gameOver && startScreen.style.display === 'none') {
        togglePause();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// ============================================================
// PAUSE
// ============================================================
function togglePause() {
    paused = !paused;
    if (paused) {
        pauseStartTime = performance.now();
        pauseOverlay.style.display = 'flex';
        setThrustSound(false);
    } else {
        totalPausedDuration += performance.now() - pauseStartTime;
        pauseOverlay.style.display = 'none';
    }
}

// ============================================================
// GAME LOOP
// ============================================================
function gameLoop() {
    if (gameOver) return;

    frameCount++;
    updateParticles();
    updateStarBursts();
    updateSpaceship();

    drawBackground();
    drawGravityZones();
    drawStarBursts();
    drawStars();
    drawParticles();
    drawSpaceship();

    if (!paused) {
        const secs = getElapsedSeconds();
        timerDisplayElement.querySelector('span').textContent =
            Math.floor(secs * GAME_SETTINGS.TIME_MULTIPLIER);
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

// ============================================================
// HUD
// ============================================================
function updateBestTimeDisplays() {
    const fmt = (t) => t !== null ? Math.floor(t * GAME_SETTINGS.TIME_MULTIPLIER) + ' Years' : '-';
    bestTimeEasyElement.querySelector('span').textContent   = fmt(bestTimes.easy);
    bestTimeMediumElement.querySelector('span').textContent = fmt(bestTimes.medium);
    bestTimeHardElement.querySelector('span').textContent   = fmt(bestTimes.hard);
}

// ============================================================
// GAME LIFECYCLE
// ============================================================
function endGame(reason) {
    gameOver = true;
    finalElapsedSeconds = getElapsedSeconds();
    setThrustSound(false);

    const years = Math.floor(finalElapsedSeconds * GAME_SETTINGS.TIME_MULTIPLIER);
    gameOverTime.textContent = `Elapsed Time: ${years} Years`;

    if (reason === 'fuel') {
        gameOverTitle.textContent = 'Game Over';
        gameOverText.textContent  = 'You ran out of fuel!';
        playGameOverSound(false);
    } else {
        gameOverTitle.textContent = 'Glorious Victory!';
        gameOverText.textContent  = 'You have mapped out the local stellar neighborhood and brought honour to your civilization!';
        playGameOverSound(true);
        saveBestTime(finalElapsedSeconds);
    }

    startScreen.style.display = 'flex';
}

function resetAndStartGame() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    gameOver = false;
    paused   = false;
    particles   = [];
    starBursts  = [];
    pauseOverlay.style.display = 'none';
    startScreen.style.display  = 'none';

    spaceship.x     = dimensions.width  / 2;
    spaceship.y     = dimensions.height / 2;
    spaceship.angle = Math.PI / 2;
    spaceship.speed = 0;
    spaceship.fuel  = DIFFICULTY_LEVELS[currentDifficulty].startingFuel;

    visitedStars.clear();
    frameCount           = 0;
    totalPausedDuration  = 0;
    finalElapsedSeconds  = 0;

    starCounterElement.querySelector('span').textContent  = '0';
    fuelDisplayElement.querySelector('span').textContent  = spaceship.fuel;
    timerDisplayElement.querySelector('span').textContent = '0';
    fuelFillElement.style.width = '100%';

    generateNebula();
    generateStars();
    generateBackgroundStars();

    gameStartTime = performance.now();
    gameLoop();
}

function selectDifficultyAndStart(difficulty) {
    currentDifficulty = difficulty;
    initAudio();
    resetAndStartGame();
}

easyButton.addEventListener('click',   () => selectDifficultyAndStart('easy'));
mediumButton.addEventListener('click', () => selectDifficultyAndStart('medium'));
hardButton.addEventListener('click',   () => selectDifficultyAndStart('hard'));

// ============================================================
// TOUCH CONTROLS
// ============================================================
(function setupTouchControls() {
    let activeTouchId = null;
    let originX = 0;
    let originY = 0;
    const DEADZONE = 20;

    function clearTouchKeys() {
        keys['_touchLeft'] = keys['_touchRight'] = keys['_touchThrust'] = keys['_touchBrake'] = false;
    }

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        initAudio();
        if (activeTouchId !== null) return;
        const t = e.changedTouches[0];
        activeTouchId = t.identifier;
        originX = t.clientX;
        originY = t.clientY;
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (const t of e.changedTouches) {
            if (t.identifier !== activeTouchId) continue;
            clearTouchKeys();
            const dx = t.clientX - originX;
            const dy = t.clientY - originY;
            if (Math.abs(dx) > DEADZONE) keys[dx < 0 ? '_touchLeft' : '_touchRight'] = true;
            if (Math.abs(dy) > DEADZONE) keys[dy < 0 ? '_touchThrust' : '_touchBrake'] = true;
        }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        for (const t of e.changedTouches) {
            if (t.identifier === activeTouchId) { activeTouchId = null; clearTouchKeys(); }
        }
    }, { passive: false });
})();

// ============================================================
// RESIZE (debounced)
// ============================================================
let resizeTimeout = null;
window.addEventListener('resize', () => {
    dimensions.width  = window.innerWidth;
    dimensions.height = window.innerHeight;
    canvas.width  = dimensions.width;
    canvas.height = dimensions.height;

    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        generateBackgroundStars();
        if (gameOver || startScreen.style.display !== 'none') generateStars();
    }, 200);
});

// ============================================================
// STARTUP
// ============================================================
loadBestTimes();
updateBestTimeDisplays();
