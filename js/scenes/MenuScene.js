import { soundSynth } from '../audio/SoundSynth.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Start Ambient Music (Molchat Doma synth wave loop)
        if (window.gameState.audioInitialized) {
            soundSynth.init();
            soundSynth.startMusic('game');
        }

        // Draw background elements: dark gradient and streetlamp glow
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x050606, 0x050606, 0x0f1110, 0x0f1110, 1);
        bg.fillRect(0, 0, width, height);

        // Procedural Rain in Menu
        this.rainParticles = this.add.particles(0, 0, 'rain_drop', {
            x: { min: 0, max: width },
            y: -10,
            lifespan: 1200,
            speedY: { min: 400, max: 700 },
            speedX: { min: -100, max: -50 },
            scaleY: { min: 0.6, max: 1.2 },
            alpha: { min: 0.15, max: 0.35 },
            quantity: 3
        });

        // Streetlamp Light Mask cone
        const streetLampGlow = this.add.image(width / 2, -20, 'flashlight_cone');
        streetLampGlow.setRotation(Math.PI / 2); // pointing straight down
        streetLampGlow.setScale(4.5, 3.5);
        streetLampGlow.setAlpha(0.22);
        streetLampGlow.setTint(0xffd7a8); // warm orange streetlight

        // Glitchy Title
        this.title = this.add.text(width / 2, 100, 'S H A T T E R E D', {
            fontFamily: 'Special Elite, Courier New, monospace',
            fontSize: '52px',
            color: '#8b0000',
            stroke: '#000',
            strokeThickness: 5
        }).setOrigin(0.5);

        this.slogan = this.add.text(width / 2, 150, '"Sometimes the enemy isn\'t waiting for you... it\'s following you."', {
            fontFamily: 'Courier Prime, Courier, monospace',
            fontSize: '11px',
            color: '#666',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Menu container layout
        this.menuContainer = this.add.container(width / 2, height / 2 + 50);

        this.createMainMenu();

        // Screen glitch effect timer
        this.time.addEvent({
            delay: 2000,
            callback: this.triggerTitleGlitch,
            callbackScope: this,
            loop: true
        });

        // Red vignette flash timer
        this.time.addEvent({
            delay: 4500,
            callback: () => {
                this.cameras.main.flash(40, 40, 0, 0, 0.05);
            },
            callbackScope: this,
            loop: true
        });
    }

    createMainMenu() {
        this.menuContainer.removeAll(true);

        const options = ['START STRUGGLE', 'CHAPTER SELECTION', 'SETTINGS', 'CREDITS'];
        options.forEach((opt, idx) => {
            const btn = this.add.text(0, idx * 36 - 40, opt, {
                fontFamily: 'Courier Prime, Courier, monospace',
                fontSize: '16px',
                color: '#888'
            }).setOrigin(0.5).setInteractive();

            btn.on('pointerover', () => {
                btn.setColor('#8b0000');
                btn.setText(`> ${opt} <`);
                this.playMenuTick();
            });

            btn.on('pointerout', () => {
                btn.setColor('#888');
                btn.setText(opt);
            });

            btn.on('pointerdown', () => {
                this.handleMenuSelection(opt);
            });

            this.menuContainer.add(btn);
        });
    }

    createChapterMenu() {
        this.menuContainer.removeAll(true);

        const chapters = [
            { id: 1, name: 'Ch.1 - Cidade Destruída' },
            { id: 2, name: 'Ch.2 - Hospital Militar' },
            { id: 3, name: 'Ch.3 - Metrô Abandonado' },
            { id: 4, name: 'Ch.4 - Favela sob Fogo' },
            { id: 5, name: 'Ch.5 - Base Militar' },
            { id: 6, name: 'Ch.6 - A Casa' }
        ];

        chapters.forEach((ch, idx) => {
            const isUnlocked = ch.id <= window.gameState.maxUnlockedChapter || window.gameState.cheatsEnabled;
            const displayName = isUnlocked ? ch.name : 'Locked [???]';
            const color = isUnlocked ? '#888' : '#333';

            const btn = this.add.text(0, idx * 28 - 70, displayName, {
                fontFamily: 'Courier Prime, Courier, monospace',
                fontSize: '13px',
                color: color
            }).setOrigin(0.5).setInteractive();

            if (isUnlocked) {
                btn.on('pointerover', () => {
                    btn.setColor('#3bbf3b');
                    btn.setText(`> ${ch.name} <`);
                    this.playMenuTick();
                });
                btn.on('pointerout', () => {
                    btn.setColor('#888');
                    btn.setText(ch.name);
                });
                btn.on('pointerdown', () => {
                    window.gameState.currentChapter = ch.id;
                    this.playMenuConfirm();
                    this.scene.start('CutsceneScene');
                });
            }

            this.menuContainer.add(btn);
        });

        // Back button
        const backBtn = this.add.text(0, 110, 'BACK TO MAIN MENU', {
            fontFamily: 'Courier Prime, Courier, monospace',
            fontSize: '13px',
            color: '#666'
        }).setOrigin(0.5).setInteractive();

        backBtn.on('pointerover', () => {
            backBtn.setColor('#fff');
            this.playMenuTick();
        });
        backBtn.on('pointerout', () => backBtn.setColor('#666'));
        backBtn.on('pointerdown', () => {
            this.playMenuConfirm();
            this.createMainMenu();
        });
        this.menuContainer.add(backBtn);
    }

    createSettingsMenu() {
        this.menuContainer.removeAll(true);

        // Sound Toggle
        const soundText = `SOUND SYST: ${window.gameState.soundEnabled ? 'ON' : 'OFF'}`;
        const soundBtn = this.add.text(0, -30, soundText, {
            fontFamily: 'Courier Prime, Courier, monospace',
            fontSize: '14px',
            color: '#888'
        }).setOrigin(0.5).setInteractive();

        soundBtn.on('pointerover', () => {
            soundBtn.setColor('#8b0000');
            this.playMenuTick();
        });
        soundBtn.on('pointerout', () => soundBtn.setColor('#888'));
        soundBtn.on('pointerdown', () => {
            window.gameState.soundEnabled = !window.gameState.soundEnabled;
            if (window.gameState.soundEnabled) {
                soundSynth.masterVolume.gain.value = 0.8;
                soundSynth.startMusic('game');
            } else {
                soundSynth.masterVolume.gain.value = 0.0;
                soundSynth.stopMusic();
            }
            soundBtn.setText(`SOUND SYST: ${window.gameState.soundEnabled ? 'ON' : 'OFF'}`);
            this.playMenuConfirm();
        });
        this.menuContainer.add(soundBtn);

        // Dev/God Mode Toggle
        const cheatText = `DEBUG MODE: ${window.gameState.cheatsEnabled ? 'ACTIVE' : 'DEACTIVE'}`;
        const cheatBtn = this.add.text(0, 10, cheatText, {
            fontFamily: 'Courier Prime, Courier, monospace',
            fontSize: '14px',
            color: '#888'
        }).setOrigin(0.5).setInteractive();

        cheatBtn.on('pointerover', () => {
            cheatBtn.setColor('#8b0000');
            this.playMenuTick();
        });
        cheatBtn.on('pointerout', () => cheatBtn.setColor('#888'));
        cheatBtn.on('pointerdown', () => {
            window.gameState.cheatsEnabled = !window.gameState.cheatsEnabled;
            cheatBtn.setText(`DEBUG MODE: ${window.gameState.cheatsEnabled ? 'ACTIVE' : 'DEACTIVE'}`);
            this.playMenuConfirm();
        });
        this.menuContainer.add(cheatBtn);

        // Back button
        const backBtn = this.add.text(0, 60, 'BACK TO MAIN MENU', {
            fontFamily: 'Courier Prime, Courier, monospace',
            fontSize: '13px',
            color: '#666'
        }).setOrigin(0.5).setInteractive();

        backBtn.on('pointerover', () => {
            backBtn.setColor('#fff');
            this.playMenuTick();
        });
        backBtn.on('pointerout', () => backBtn.setColor('#666'));
        backBtn.on('pointerdown', () => {
            this.playMenuConfirm();
            this.createMainMenu();
        });
        this.menuContainer.add(backBtn);
    }

    createCreditsMenu() {
        this.menuContainer.removeAll(true);

        const credits = [
            'SHATTERED - A Psych-Horror Experiment',
            'Slogan: Sometimes the enemy isn\'t waiting for you...',
            'Logic, Code & Sound Engine: ANTIGRAVITY AI',
            'Style: Inspired by Cry of Fear & Hotline Miami',
            'Engine: Phaser 3 & Web Audio Synthesizer'
        ];

        credits.forEach((txt, idx) => {
            this.menuContainer.add(
                this.add.text(0, idx * 22 - 60, txt, {
                    fontFamily: 'Courier Prime, Courier, monospace',
                    fontSize: '11px',
                    color: '#777'
                }).setOrigin(0.5)
            );
        });

        const backBtn = this.add.text(0, 70, 'BACK TO MAIN MENU', {
            fontFamily: 'Courier Prime, Courier, monospace',
            fontSize: '13px',
            color: '#666'
        }).setOrigin(0.5).setInteractive();

        backBtn.on('pointerover', () => {
            backBtn.setColor('#fff');
            this.playMenuTick();
        });
        backBtn.on('pointerout', () => backBtn.setColor('#666'));
        backBtn.on('pointerdown', () => {
            this.playMenuConfirm();
            this.createMainMenu();
        });
        this.menuContainer.add(backBtn);
    }

    handleMenuSelection(opt) {
        this.playMenuConfirm();
        if (opt === 'START STRUGGLE') {
            window.gameState.currentChapter = 1;
            this.scene.start('CutsceneScene');
        } else if (opt === 'CHAPTER SELECTION') {
            this.createChapterMenu();
        } else if (opt === 'SETTINGS') {
            this.createSettingsMenu();
        } else if (opt === 'CREDITS') {
            this.createCreditsMenu();
        }
    }

    triggerTitleGlitch() {
        if (!this.title) return;
        const colorOrigin = '#8b0000';
        const colorGlitch = Math.random() < 0.5 ? '#137a13' : '#a3841a';

        this.title.setColor(colorGlitch);
        this.title.setX(this.cameras.main.width / 2 + (Math.random() * 8 - 4));
        
        this.time.delayedCall(80, () => {
            this.title.setColor(colorOrigin);
            this.title.setX(this.cameras.main.width / 2);
        });
    }

    // Interactive audio helpers
    playMenuTick() {
        if (!window.gameState.audioInitialized || !window.gameState.soundEnabled) return;
        try {
            const time = soundSynth.ctx.currentTime;
            const osc = soundSynth.ctx.createOscillator();
            const gain = soundSynth.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, time);
            gain.gain.setValueAtTime(0.08, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
            osc.connect(gain);
            gain.connect(soundSynth.sfxVolume);
            osc.start(time);
            osc.stop(time + 0.03);
        } catch (e) {}
    }

    playMenuConfirm() {
        if (!window.gameState.audioInitialized || !window.gameState.soundEnabled) return;
        try {
            const time = soundSynth.ctx.currentTime;
            const osc = soundSynth.ctx.createOscillator();
            const gain = soundSynth.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, time);
            osc.frequency.linearRampToValueAtTime(100, time + 0.15);
            gain.gain.setValueAtTime(0.15, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
            osc.connect(gain);
            gain.connect(soundSynth.sfxVolume);
            osc.start(time);
            osc.stop(time + 0.15);
        } catch (e) {}
    }
}
