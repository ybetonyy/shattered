import TextureGenerator from '../assets/TextureGenerator.js';
import { soundSynth } from '../audio/SoundSynth.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        // Initialize Synthesizer immediately if audio is allowed by browser
        if (window.gameState.audioInitialized) {
            soundSynth.init();
        }

        // Create title text
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Visual design elements
        this.add.text(width / 2, height / 2 - 60, 'S H A T T E R E D', {
            fontFamily: 'Special Elite, Courier New, monospace',
            fontSize: '36px',
            color: '#8b0000'
        }).setOrigin(0.5);

        const loadingText = this.add.text(width / 2, height / 2, '>>> DE-COMPRESSING MEMORIES...', {
            fontFamily: 'Courier Prime, Courier, monospace',
            fontSize: '14px',
            color: '#3bbf3b'
        }).setOrigin(0.5);

        // Progress bar container
        const progressBg = this.add.rectangle(width / 2, height / 2 + 40, 300, 16, 0x111412).setStrokeStyle(1, 0x3bbf3b);
        const progressBar = this.add.rectangle(width / 2 - 146, height / 2 + 40, 0, 10, 0x3bbf3b);

        // Procedurally generate all canvas textures at runtime
        // We will simulate a loading time to play synth clicking and look authentic
        let progress = 0;
        const timer = this.time.addEvent({
            delay: 30,
            callback: () => {
                progress += 0.02;
                if (progress <= 1) {
                    progressBar.width = 292 * progress;
                    
                    // Synthesize soft computer beep clicking
                    if (window.gameState.audioInitialized && Math.random() < 0.15) {
                        try {
                            const time = soundSynth.ctx.currentTime;
                            const osc = soundSynth.ctx.createOscillator();
                            const gain = soundSynth.ctx.createGain();
                            osc.type = 'sine';
                            osc.frequency.setValueAtTime(800 + Math.random() * 400, time);
                            gain.gain.setValueAtTime(0.02, time);
                            gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
                            osc.connect(gain);
                            gain.connect(soundSynth.sfxVolume);
                            osc.start(time);
                            osc.stop(time + 0.04);
                        } catch (e) {
                            // Audio not fully operational yet
                        }
                    }
                } else {
                    timer.remove();
                    loadingText.setText('>>> SYSTEM DE-SYNCHRONIZED. PRESS ENTER.');
                    
                    this.input.keyboard.once('keydown-ENTER', () => {
                        // Initialize Synthesizer
                        if (window.gameState.audioInitialized) {
                            soundSynth.init();
                        }
                        
                        this.scene.start('MenuScene');
                    });
                }
            },
            callbackScope: this,
            loop: true
        });

        // Trigger texture compilation
        TextureGenerator.generateAll(this);
    }
}
