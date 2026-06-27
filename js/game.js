import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import CutsceneScene from './scenes/CutsceneScene.js';
import GameScene from './scenes/GameScene.js';

// Setup screen resolution
const width = 960;
const height = 540;

const config = {
    type: Phaser.AUTO,
    width: width,
    height: height,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false // Can be toggled in-game with Tab key
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true
    },
    scene: [BootScene, MenuScene, CutsceneScene, GameScene]
};

// Global Game State to share settings and data between scenes
window.gameState = {
    currentChapter: 1,
    maxUnlockedChapter: 1,
    soundEnabled: true,
    audioInitialized: false,
    score: 0,
    cheatsEnabled: false
};

// Event listener for the initialization button (Web Audio unlock)
document.addEventListener('DOMContentLoaded', () => {
    const btnInit = document.getElementById('btn-initialize');
    const bootOverlay = document.getElementById('boot-overlay');

    if (btnInit && bootOverlay) {
        btnInit.addEventListener('click', () => {
            // Initialize game and sound context
            window.gameState.audioInitialized = true;
            
            // Start Phaser game instance
            new Phaser.Game(config);
            
            // Fade out overlay
            bootOverlay.style.transition = 'opacity 0.8s ease';
            bootOverlay.style.opacity = '0';
            setTimeout(() => {
                bootOverlay.style.display = 'none';
            }, 800);
        });
    }
});
