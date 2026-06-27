import { soundSynth } from '../audio/SoundSynth.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player_pistol');
        
        // Add to scene and physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setCollideWorldBounds(true);
        this.setBodySize(20, 20);
        this.setCircle(10, 6, 6);

        // Core Player Stats
        this.maxHealth = 100;
        this.health = 100;
        this.baseSpeed = 160;
        this.rollSpeed = 340;
        this.isDead = false;
        
        // Weapons inventory
        this.weaponsList = [
            {
                name: 'Pistola M19',
                type: 'pistol',
                damage: 35,
                ammoMax: 15,
                ammo: 15,
                fireRate: 280, // ms
                reloadTime: 1000, // ms
                recoil: 3,
                spread: 0.05,
                texture: 'player_pistol'
            },
            {
                name: 'Revólver Colt',
                type: 'revolver',
                damage: 80,
                ammoMax: 6,
                ammo: 6,
                fireRate: 650,
                reloadTime: 1600,
                recoil: 8,
                spread: 0.02,
                texture: 'player_pistol' // uses pistol base sprite
            },
            {
                name: 'Shotgun Remington',
                type: 'shotgun',
                damage: 18, // per pellet (5 pellets)
                pellets: 6,
                ammoMax: 6,
                ammo: 6,
                fireRate: 800,
                reloadTime: 2000,
                recoil: 12,
                spread: 0.28,
                texture: 'player_shotgun'
            },
            {
                name: 'Rifle M4A1',
                type: 'rifle',
                damage: 45,
                ammoMax: 30,
                ammo: 30,
                fireRate: 110,
                reloadTime: 1800,
                recoil: 5,
                spread: 0.08,
                texture: 'player_rifle'
            },
            {
                name: 'Faca Militar',
                type: 'knife',
                damage: 45,
                ammoMax: 1, // melee doesn't consume ammo
                ammo: 1,
                fireRate: 300,
                reloadTime: 0,
                recoil: 0,
                spread: 0,
                texture: 'player_melee',
                isMelee: true
            },
            {
                name: 'Machado Tático',
                type: 'axe',
                damage: 130,
                ammoMax: 1,
                ammo: 1,
                fireRate: 850,
                reloadTime: 0,
                recoil: 0,
                spread: 0,
                texture: 'player_melee',
                isMelee: true
            }
        ];
        
        // Weapon management
        this.currentWeaponIdx = 0; // Starts with Pistol M19
        this.unlockedWeapons = [0, 4]; // Pistol and Knife unlocked by default

        // State Flags
        this.isRolling = false;
        this.isReloading = false;
        this.isExecuting = false;
        this.lastFired = 0;
        this.rollCooldown = 0;
        this.grenadesCount = 3;
        this.grenadeCooldown = 0;

        // Slow-Motion (Rage Mode)
        this.slowMoActive = false;
        this.slowMoMeter = 100; // max 100
        this.slowMoRate = 0.4;  // drain speed per frame
        this.slowMoRegen = 0.1; // regen speed per frame when idle

        // Input References
        this.keys = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            reload: Phaser.Input.Keyboard.KeyCodes.R,
            slowmo: Phaser.Input.Keyboard.KeyCodes.Q,
            grenade: Phaser.Input.Keyboard.KeyCodes.G,
            execute: Phaser.Input.Keyboard.KeyCodes.F,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            weapon1: Phaser.Input.Keyboard.KeyCodes.ONE,
            weapon2: Phaser.Input.Keyboard.KeyCodes.TWO,
            weapon3: Phaser.Input.Keyboard.KeyCodes.THREE,
            weapon4: Phaser.Input.Keyboard.KeyCodes.FOUR,
            weapon5: Phaser.Input.Keyboard.KeyCodes.FIVE,
            weapon6: Phaser.Input.Keyboard.KeyCodes.SIX
        });

        // Initialize heartbeat at start
        if (window.gameState.soundEnabled) {
            soundSynth.playHeartbeat(72);
        }
    }

    getCurrentWeapon() {
        return this.weaponsList[this.currentWeaponIdx];
    }

    update(time, delta) {
        if (this.isDead || this.isExecuting) {
            this.setVelocity(0);
            return;
        }

        this.handleMovement(time);
        this.handleAiming();
        this.handleShooting(time);
        this.handleWeaponSwitch();
        this.handleReload(time);
        this.handleGrenade(time);
        this.handleSlowMotion();
        
        // Cooldown decreases
        if (this.rollCooldown > 0) this.rollCooldown -= delta;
        if (this.grenadeCooldown > 0) this.grenadeCooldown -= delta;

        // Visual low health vignette pulse trigger
        this.checkVitals();
    }

    handleMovement(time) {
        if (this.isRolling) return;

        let vx = 0;
        let vy = 0;

        if (this.keys.up.isDown) vy = -1;
        if (this.keys.down.isDown) vy = 1;
        if (this.keys.left.isDown) vx = -1;
        if (this.keys.right.isDown) vx = 1;

        // Normalise vector
        if (vx !== 0 && vy !== 0) {
            vx *= 0.7071;
            vy *= 0.7071;
        }

        const currentSpeed = this.baseSpeed;
        this.setVelocity(vx * currentSpeed, vy * currentSpeed);

        // Sound representation: play footstep noise if moving fast (hear steps)
        if ((vx !== 0 || vy !== 0) && time % 350 < 30) {
            this.playFootstep();
        }

        // Trigger Dodge Roll
        const pointer = this.scene.input.activePointer;
        // Shift or Right Click
        const requestRoll = Phaser.Input.Keyboard.JustDown(this.keys.shift) || pointer.rightButtonDown();
        
        if (requestRoll && (vx !== 0 || vy !== 0) && this.rollCooldown <= 0 && !this.isReloading) {
            this.startRoll(vx, vy);
        }
    }

    startRoll(vx, vy) {
        this.isRolling = true;
        this.rollCooldown = 1200; // 1.2s cooldown
        this.setTexture('player_roll');
        
        // Temporarily adjust collision circle for roll
        this.setCircle(8, 8, 8);

        this.setVelocity(vx * this.rollSpeed, vy * this.rollSpeed);
        
        if (window.gameState.soundEnabled) {
            soundSynth.playSlash(); // swish sound for roll
        }

        // Fade trail effects during roll
        const trailTimer = this.scene.time.addEvent({
            delay: 60,
            repeat: 4,
            callback: () => {
                const trail = this.scene.add.sprite(this.x, this.y, 'player_roll');
                trail.setRotation(this.rotation);
                trail.setAlpha(0.4);
                this.scene.tweens.add({
                    targets: trail,
                    alpha: 0,
                    scale: 0.8,
                    duration: 250,
                    onComplete: () => trail.destroy()
                });
            }
        });

        // Roll duration
        this.scene.time.delayedCall(250, () => {
            this.isRolling = false;
            this.setTexture(this.getCurrentWeapon().texture);
            this.setCircle(10, 6, 6);
        });
    }

    handleAiming() {
        if (this.isRolling) return;

        // Face mouse pointer
        const pointer = this.scene.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.x + this.scene.cameras.main.scrollX, pointer.y + this.scene.cameras.main.scrollY);
        this.setRotation(angle);
    }

    handleShooting(time) {
        if (this.isRolling || this.isReloading) return;

        const pointer = this.scene.input.activePointer;
        const activeWeapon = this.getCurrentWeapon();

        if (pointer.leftButtonDown() && time > this.lastFired) {
            if (activeWeapon.isMelee) {
                this.performMeleeAttack(time, activeWeapon);
            } else {
                this.performRangedAttack(time, activeWeapon);
            }
        }
    }

    performMeleeAttack(time, weapon) {
        this.lastFired = time + weapon.fireRate;
        
        // Swing animations
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.15,
            duration: 80,
            yoyo: true,
            repeat: 0
        });

        if (window.gameState.soundEnabled) {
            if (weapon.type === 'axe') soundSynth.playAxe();
            else soundSynth.playSlash();
        }

        // Trigger scene hit scan check for melee range
        this.scene.checkMeleeHit(this, weapon);
    }

    performRangedAttack(time, weapon) {
        if (weapon.ammo <= 0) {
            this.startReload();
            return;
        }

        this.lastFired = time + weapon.fireRate;
        weapon.ammo--;

        // Weapon Sound
        if (window.gameState.soundEnabled) {
            soundSynth.playShoot(weapon.type);
        }

        // Recoil screen shake
        this.scene.cameras.main.shake(100, 0.001 * weapon.recoil);

        // Spawn Bullets
        const angle = this.rotation;
        const numProjectiles = weapon.pellets || 1;

        for (let i = 0; i < numProjectiles; i++) {
            const spreadAngle = angle + Phaser.Math.FloatBetween(-weapon.spread, weapon.spread);
            this.scene.spawnBullet(this.x, this.y, spreadAngle, weapon.damage, true);
        }

        // Muzzle flash visual
        this.scene.spawnMuzzleFlash(this.x, this.y, angle);

        // Broadcast noise event for enemies to hear
        this.scene.broadcastNoise(this.x, this.y, 450, true); // range 450 pixels
    }

    handleReload(time) {
        const weapon = this.getCurrentWeapon();
        if (weapon.isMelee) return;

        if (Phaser.Input.Keyboard.JustDown(this.keys.reload) && weapon.ammo < weapon.ammoMax && !this.isReloading && !this.isRolling) {
            this.startReload();
        }
    }

    startReload() {
        const weapon = this.getCurrentWeapon();
        this.isReloading = true;
        
        if (window.gameState.soundEnabled) {
            soundSynth.playReload();
        }

        // HUD update / Reload indicator
        const reloadProgressText = this.scene.add.text(this.x, this.y - 25, 'RELOADING...', {
            fontFamily: 'Courier Prime, monospace',
            fontSize: '9px',
            color: '#ff3333'
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: reloadProgressText,
            y: this.y - 35,
            alpha: 0.8,
            duration: weapon.reloadTime,
            onUpdate: () => {
                if (this.isDead) reloadProgressText.destroy();
                reloadProgressText.x = this.x;
                reloadProgressText.y = this.y - 25;
            },
            onComplete: () => {
                reloadProgressText.destroy();
                if (!this.isDead) {
                    weapon.ammo = weapon.ammoMax;
                    this.isReloading = false;
                }
            }
        });
    }

    handleWeaponSwitch() {
        const weaponKeys = [
            { key: this.keys.weapon1, idx: 0 },
            { key: this.keys.weapon2, idx: 1 },
            { key: this.keys.weapon3, idx: 2 },
            { key: this.keys.weapon4, idx: 3 },
            { key: this.keys.weapon5, idx: 4 },
            { key: this.keys.weapon6, idx: 5 }
        ];

        weaponKeys.forEach(wk => {
            if (Phaser.Input.Keyboard.JustDown(wk.key)) {
                if (this.unlockedWeapons.includes(wk.idx) && this.currentWeaponIdx !== wk.idx && !this.isRolling && !this.isReloading) {
                    this.currentWeaponIdx = wk.idx;
                    this.setTexture(this.getCurrentWeapon().texture);
                    if (window.gameState.soundEnabled) {
                        soundSynth.playSlash(); // small shuffle click
                    }
                }
            }
        });
    }

    unlockWeapon(idx) {
        if (!this.unlockedWeapons.includes(idx)) {
            this.unlockedWeapons.push(idx);
            // Auto switch to newly picked weapon
            this.currentWeaponIdx = idx;
            this.setTexture(this.getCurrentWeapon().texture);
        }
    }

    handleGrenade(time) {
        if (Phaser.Input.Keyboard.JustDown(this.keys.grenade) && this.grenadesCount > 0 && this.grenadeCooldown <= 0 && !this.isRolling) {
            this.grenadesCount--;
            this.grenadeCooldown = 1500; // 1.5s delay
            
            const pointer = this.scene.input.activePointer;
            const targetX = pointer.x + this.scene.cameras.main.scrollX;
            const targetY = pointer.y + this.scene.cameras.main.scrollY;
            
            this.scene.spawnGrenade(this.x, this.y, targetX, targetY);
        }
    }

    handleSlowMotion() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.slowmo) && !this.isRolling) {
            if (!this.slowMoActive && this.slowMoMeter > 15) {
                // Activate
                this.slowMoActive = true;
                this.scene.activateSlowMotion(true);
                
                // Breath effect
                if (window.gameState.soundEnabled) {
                    soundSynth.playBreath();
                }
            } else if (this.slowMoActive) {
                // Deactivate
                this.slowMoActive = false;
                this.scene.activateSlowMotion(false);
                if (window.gameState.soundEnabled) {
                    soundSynth.stopHeartbeat();
                    // resume normal heartbeat
                    soundSynth.playHeartbeat(this.health < 35 ? 120 : 72);
                }
            }
        }

        // Handle slowmo meter drain / regen
        if (this.slowMoActive) {
            this.slowMoMeter -= this.slowMoRate;
            if (this.slowMoMeter <= 0) {
                this.slowMoMeter = 0;
                this.slowMoActive = false;
                this.scene.activateSlowMotion(false);
                if (window.gameState.soundEnabled) {
                    soundSynth.stopHeartbeat();
                    soundSynth.playHeartbeat(this.health < 35 ? 120 : 72);
                }
            }
        } else {
            if (this.slowMoMeter < 100) {
                this.slowMoMeter += this.slowMoRegen;
                if (this.slowMoMeter > 100) this.slowMoMeter = 100;
            }
        }

        // Update HTML HUD
        const fill = document.getElementById('hud-rage-fill');
        if (fill) {
            fill.style.width = `${this.slowMoMeter}%`;
        }
    }

    takeDamage(amount) {
        if (this.isDead || this.isRolling || window.gameState.cheatsEnabled) return;

        this.health -= amount;
        
        // Heavy red camera flash
        this.scene.cameras.main.flash(120, 139, 0, 0, 0.25);
        this.scene.cameras.main.shake(150, 0.01);

        // Spawn blood spray on camera
        this.scene.flashBloodOnCamera();

        // Spawn floor blood droplets
        this.scene.spawnBloodDecal(this.x, this.y, 4);

        if (this.health <= 0) {
            this.health = 0;
            this.die();
        } else {
            // Accelerate heartbeat at low health
            if (this.health < 35 && window.gameState.soundEnabled) {
                soundSynth.updateHeartRate(124);
            }
        }
    }

    die() {
        this.isDead = true;
        this.setVelocity(0);
        this.setTexture('player_roll'); // circular puddle sprite representation
        this.setTint(0x555555);

        if (window.gameState.soundEnabled) {
            soundSynth.stopHeartbeat();
            soundSynth.playScream(); // death rattle sound
        }

        // Heavy blood decals
        this.scene.spawnBloodDecal(this.x, this.y, 12);
        
        // Spawn weapon pickup on floor
        this.scene.spawnDroppedWeapon(this.x, this.y, this.getCurrentWeapon().type);

        this.scene.handlePlayerDeath();
    }

    checkVitals() {
        const hrVal = document.getElementById('hud-hr-val');
        if (hrVal) {
            let hr = 72;
            if (this.health < 35) hr = 120 + Math.floor(Math.sin(this.scene.time.now / 100) * 8);
            else if (this.slowMoActive) hr = 140 + Math.floor(Math.sin(this.scene.time.now / 80) * 12);
            else if (this.body.speed > 0) hr = 88;
            hrVal.textContent = hr;
        }
    }

    playFootstep() {
        if (!window.gameState.audioInitialized || !window.gameState.soundEnabled) return;
        try {
            const time = soundSynth.ctx.currentTime;
            const osc = soundSynth.ctx.createOscillator();
            const gain = soundSynth.ctx.createGain();
            
            // soft step noise
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(45 + Math.random() * 15, time);
            
            gain.gain.setValueAtTime(0.04, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
            
            osc.connect(gain);
            gain.connect(soundSynth.sfxVolume);
            
            osc.start(time);
            osc.stop(time + 0.08);

            // Broad noise alert range for footsteps (when running/walking)
            // Range: 150 pixels hearing radius
            this.scene.broadcastNoise(this.x, this.y, 140, false);
        } catch (e) {}
    }
}
