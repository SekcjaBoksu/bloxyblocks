// ============================================
// OX BLOXX - Gra w stylu City Bloxx
// ============================================

// Konfiguracja parametrów gry
const CONFIG = {
    // Parametry wahadła
    amplitude: 150,           // Amplituda wahania haka
    frequency: 0.8,           // Częstotliwość wahania
    
    // Fizyka
    gravity: 0.6,             // Siła grawitacji
    blockWidth: 60,           // Szerokość bloku
    blockHeight: 40,          // Wysokość bloku
    
    // Kolizje
    minOverlap: 0.5,          // Minimalne pokrycie (50%)
    
    // Cel gry
    targetBlocks: 20,         // Liczba bloków do osiągnięcia
    
    // Kamera
    cameraLerp: 0.1,          // Płynność ruchu kamery
    
    // Efekty
    enableShake: true,        // Włącz drżenie kamery
    shakeIntensity: 5,        // Intensywność drżenia
    enableParticles: true,    // Włącz cząsteczki pyłu
    enableParallax: true,    // Włącz efekt parallax
};

// Stany gry
const GAME_STATE = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER',
    VICTORY: 'VICTORY'
};

// Inicjalizacja canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;

// Skalowanie dla wysokiej rozdzielczości
const dpr = window.devicePixelRatio || 1;
let scale = 1;

// Stan gry
let gameState = GAME_STATE.MENU;
let gameTime = 0;

// Pozycja żurawia
const craneX = 0;
const craneY = 0;
const craneWidth = 100;
const craneHeight = 80;

// Pozycja haka i wahadło
let hookX = 0;
let hookY = 0;
const hookLength = 200;
const hookSize = 10;

// Blok na haku
let currentBlock = null;
let isBlockAttached = true;

// Stos bloków (wieżowiec)
let tower = [];
const foundation = {
    x: 0,
    y: 0,
    width: 0,
    height: 40
};

// Kamera
let cameraY = 0;
let cameraShake = { x: 0, y: 0 };
let shakeTimer = 0;

// Cząsteczki pyłu
let particles = [];

// Elementy UI
const menuScreen = document.getElementById('menuScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const victoryScreen = document.getElementById('victoryScreen');
const hud = document.getElementById('hud');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const victoryRestartButton = document.getElementById('victoryRestartButton');
const blockCountElement = document.getElementById('blockCount');
const targetBlocksElement = document.getElementById('targetBlocks');

// Inicjalizacja
function init() {
    resizeCanvas();
    setupEventListeners();
    setupUI();
    targetBlocksElement.textContent = CONFIG.targetBlocks;
    resetGame();
}

// Ustawienie rozmiaru canvas
function resizeCanvas() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    
    scale = dpr;
    ctx.scale(scale, scale);
    
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    
    // Pozycja żurawia na górze ekranu
    foundation.x = canvasWidth / 2 - 100;
    foundation.width = 200;
    foundation.y = canvasHeight - foundation.height;
}

// Obsługa zdarzeń
function setupEventListeners() {
    window.addEventListener('resize', resizeCanvas);
    
    // Kliknięcie/tap
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchend', handleClick);
    
    // Zapobieganie domyślnym zachowaniom touch
    canvas.addEventListener('touchstart', (e) => e.preventDefault());
    canvas.addEventListener('touchmove', (e) => e.preventDefault());
}

// Obsługa UI
function setupUI() {
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);
    victoryRestartButton.addEventListener('click', startGame);
}

// Reset gry
function resetGame() {
    gameTime = 0;
    tower = [];
    cameraY = 0;
    cameraShake = { x: 0, y: 0 };
    shakeTimer = 0;
    particles = [];
    isBlockAttached = true;
    
    // Pozycja startowa haka (środek ekranu)
    hookX = canvasWidth / 2;
    hookY = 100;
    
    // Utworzenie pierwszego bloku
    createNewBlock();
}

// Utworzenie nowego bloku
function createNewBlock() {
    currentBlock = {
        x: hookX - CONFIG.blockWidth / 2,
        y: hookY + hookLength,
        width: CONFIG.blockWidth,
        height: CONFIG.blockHeight,
        velocityY: 0,
        color: getRandomBlockColor(),
        attached: true
    };
}

// Losowy kolor bloku
function getRandomBlockColor() {
    const colors = ['#ff6b35', '#f7931e', '#c4c4c4', '#8b4513', '#cd853f'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Start gry
function startGame() {
    gameState = GAME_STATE.PLAYING;
    menuScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    victoryScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    resetGame();
}

// Obsługa kliknięcia
function handleClick(e) {
    if (gameState !== GAME_STATE.PLAYING) return;
    if (!isBlockAttached || !currentBlock) return;
    
    // Odczepienie bloku
    isBlockAttached = false;
    currentBlock.attached = false;
    currentBlock.velocityY = 0;
}

// Aktualizacja wahadła
function updatePendulum(dt) {
    gameTime += dt;
    
    // Ruch wahadłowy haka
    const centerX = canvasWidth / 2;
    hookX = centerX + CONFIG.amplitude * Math.sin(gameTime * CONFIG.frequency);
    
    // Aktualizacja pozycji bloku, jeśli jest podczepiony
    if (isBlockAttached && currentBlock) {
        currentBlock.x = hookX - CONFIG.blockWidth / 2;
        currentBlock.y = hookY + hookLength;
    }
}

// Aktualizacja fizyki spadającego bloku
function updateFallingBlock(dt) {
    if (!currentBlock || currentBlock.attached) return;
    
    // Grawitacja
    currentBlock.velocityY += CONFIG.gravity;
    currentBlock.y += currentBlock.velocityY;
    
    // Sprawdzenie kolizji z fundamentem lub wieżowcem
    const target = tower.length > 0 ? tower[tower.length - 1] : foundation;
    
    if (currentBlock.y + currentBlock.height >= target.y) {
        // Sprawdzenie, czy blok trafił w cel
        const overlap = calculateOverlap(currentBlock, target);
        
        if (overlap < CONFIG.minOverlap) {
            // Za małe pokrycie - przegrana
            gameOver('Blok spadł obok wieżowca!');
            return;
        }
        
        // Blok trafił - dodaj do wieżowca
        currentBlock.y = target.y - currentBlock.height;
        currentBlock.velocityY = 0;
        tower.push({
            x: currentBlock.x,
            y: currentBlock.y,
            width: currentBlock.width,
            height: currentBlock.height,
            color: currentBlock.color
        });
        
        // Efekt wstrząsu
        if (CONFIG.enableShake) {
            triggerShake();
        }
        
        // Cząsteczki pyłu
        if (CONFIG.enableParticles) {
            createLandingParticles(currentBlock.x + currentBlock.width / 2, currentBlock.y + currentBlock.height);
        }
        
        // Sprawdzenie zwycięstwa
        if (tower.length >= CONFIG.targetBlocks) {
            gameState = GAME_STATE.VICTORY;
            victoryScreen.classList.remove('hidden');
            hud.classList.add('hidden');
            return;
        }
        
        // Utworzenie nowego bloku
        isBlockAttached = true;
        createNewBlock();
    }
    
    // Sprawdzenie, czy blok spadł poza ekran (przegrana)
    if (currentBlock.y > canvasHeight + cameraY + 500) {
        gameOver('Blok spadł poza ekran!');
    }
}

// Obliczanie pokrycia między blokami
function calculateOverlap(block, target) {
    const blockLeft = block.x;
    const blockRight = block.x + block.width;
    const targetLeft = target.x;
    const targetRight = target.x + target.width;
    
    const overlapLeft = Math.max(blockLeft, targetLeft);
    const overlapRight = Math.min(blockRight, targetRight);
    const overlapWidth = Math.max(0, overlapRight - overlapLeft);
    
    return overlapWidth / block.width;
}

// Aktualizacja kamery
function updateCamera() {
    if (tower.length === 0) return;
    
    // Najwyższy blok
    const highestBlock = tower[tower.length - 1];
    const highestY = highestBlock.y;
    
    // Pozycja kamery powinna być wycentrowana na najwyższym bloku
    const targetCameraY = highestY - canvasHeight / 2 + 200;
    
    // Płynne przejście (lerp)
    cameraY += (targetCameraY - cameraY) * CONFIG.cameraLerp;
    
    // Upewnij się, że kamera nie idzie w dół
    cameraY = Math.min(cameraY, targetCameraY);
}

// Wstrząs kamery
function triggerShake() {
    shakeTimer = 10;
}

// Aktualizacja wstrząsu
function updateShake() {
    if (shakeTimer > 0) {
        cameraShake.x = (Math.random() - 0.5) * CONFIG.shakeIntensity;
        cameraShake.y = (Math.random() - 0.5) * CONFIG.shakeIntensity;
        shakeTimer--;
    } else {
        cameraShake.x = 0;
        cameraShake.y = 0;
    }
}

// Tworzenie cząsteczek pyłu
function createLandingParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4 - 2,
            life: 30,
            maxLife: 30,
            size: Math.random() * 4 + 2
        });
    }
}

// Aktualizacja cząsteczek
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // Grawitacja dla cząsteczek
        p.life--;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Koniec gry
function gameOver(message) {
    gameState = GAME_STATE.GAME_OVER;
    document.getElementById('gameOverMessage').textContent = message;
    gameOverScreen.classList.remove('hidden');
    hud.classList.add('hidden');
}

// Główna pętla aktualizacji
function update(dt) {
    if (gameState !== GAME_STATE.PLAYING) return;
    
    updatePendulum(dt);
    updateFallingBlock(dt);
    updateCamera();
    updateShake();
    updateParticles();
    
    // Aktualizacja HUD
    blockCountElement.textContent = tower.length;
}

// Renderowanie tła z efektem parallax
function renderBackground() {
    // Niebo - gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(0.5, '#98d8e8');
    gradient.addColorStop(1, '#b0e0e6');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Chmury (efekt parallax)
    if (CONFIG.enableParallax) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        const cloudOffset = cameraY * 0.1;
        
        // Chmura 1
        drawCloud(200 + cloudOffset * 0.3, 100 - cameraY * 0.2, 80);
        drawCloud(600 + cloudOffset * 0.5, 150 - cameraY * 0.15, 100);
        drawCloud(1000 + cloudOffset * 0.4, 80 - cameraY * 0.25, 70);
    }
}

// Rysowanie chmury
function drawCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y, size * 0.6, 0, Math.PI * 2);
    ctx.arc(x + size, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.3, y - size * 0.3, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.7, y - size * 0.3, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
}

// Renderowanie żurawia
function renderCrane() {
    ctx.save();
    ctx.translate(0, -cameraY + cameraShake.y);
    
    // Podstawa żurawia
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(craneX, craneY, craneWidth, craneHeight);
    
    // Wysięgnik żurawia
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(craneX + craneWidth - 20, craneY, 20, 30);
    
    // Trójkąt wspierający
    ctx.beginPath();
    ctx.moveTo(craneX + craneWidth, craneY);
    ctx.lineTo(craneX + craneWidth + 30, craneY + 40);
    ctx.lineTo(craneX + craneWidth, craneY + 40);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

// Renderowanie liny i haka
function renderHook() {
    ctx.save();
    ctx.translate(0, -cameraY + cameraShake.y);
    
    // Lina
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(canvasWidth / 2, craneY + craneHeight);
    ctx.lineTo(hookX, hookY);
    ctx.stroke();
    
    // Hak
    ctx.fillStyle = '#555';
    ctx.fillRect(hookX - hookSize / 2, hookY, hookSize, hookSize * 2);
    
    // Mały hak na dole
    ctx.beginPath();
    ctx.moveTo(hookX - hookSize / 2, hookY + hookSize * 2);
    ctx.lineTo(hookX - hookSize, hookY + hookSize * 2.5);
    ctx.lineTo(hookX + hookSize, hookY + hookSize * 2.5);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

// Renderowanie bloku
function renderBlock(block, isCurrent = false) {
    ctx.save();
    ctx.translate(0, -cameraY + cameraShake.y);
    
    // Cień (tylko dla spadającego bloku)
    if (isCurrent && !block.attached) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(block.x + 3, block.y + block.height + 5, block.width, 10);
    }
    
    // Blok
    ctx.fillStyle = block.color;
    ctx.fillRect(block.x, block.y, block.width, block.height);
    
    // Obramowanie
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(block.x, block.y, block.width, block.height);
    
    // Wewnętrzny detal
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(block.x + 5, block.y + 5, block.width - 10, 10);
    
    ctx.restore();
}

// Renderowanie wieżowca
function renderTower() {
    tower.forEach(block => {
        renderBlock(block);
    });
}

// Renderowanie fundamentu
function renderFoundation() {
    ctx.save();
    ctx.translate(0, -cameraY + cameraShake.y);
    
    ctx.fillStyle = '#654321';
    ctx.fillRect(foundation.x, foundation.y, foundation.width, foundation.height);
    
    // Obramowanie
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeRect(foundation.x, foundation.y, foundation.width, foundation.height);
    
    // Tekst "FUNDAMENT"
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('FUNDAMENT', foundation.x + foundation.width / 2, foundation.y + foundation.height / 2 + 5);
    
    ctx.restore();
}

// Renderowanie cząsteczek
function renderParticles() {
    ctx.save();
    ctx.translate(0, -cameraY + cameraShake.y);
    
    particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.fillStyle = `rgba(139, 69, 19, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.restore();
}

// Główna funkcja renderowania
function render() {
    // Czyszczenie canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Tło
    renderBackground();
    
    if (gameState === GAME_STATE.PLAYING) {
        // Fundament
        renderFoundation();
        
        // Wieżowiec
        renderTower();
        
        // Żuraw
        renderCrane();
        
        // Hak i lina
        renderHook();
        
        // Aktualny blok
        if (currentBlock) {
            renderBlock(currentBlock, true);
        }
        
        // Cząsteczki
        renderParticles();
    }
}

// Pętla gry
let lastTime = 0;
function gameLoop(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 16.67, 2); // Ograniczenie dt
    lastTime = currentTime;
    
    update(dt);
    render();
    
    requestAnimationFrame(gameLoop);
}

// Start gry
init();
requestAnimationFrame(gameLoop);
