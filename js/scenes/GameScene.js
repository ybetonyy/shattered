import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import MapLoader from '../systems/MapLoader.js';
import { soundSynth } from '../audio/SoundSynth.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        // Reset scene variables
        this.enemiesRemaining = 0;
        this.exitUnlocked = false;
        this.endingTriggered = false;

        // Custom render groups
        this.bloodDecals = this.add.group();
        this.walls = this.physics.add.staticGroup();
        this.enemies = this.add.group();
        this.bullets = this.physics.add.group();
        this.pickups = this.physics.add.group();
        this.lasersGraphics = this.add.graphics();
        this.lasersGraphics.setDepth(3);

        // HUD Elements reference
        this.hudVitals = document.getElementById('hud-vitals');
        if (this.hudVitals) this.hudVitals.style.display = 'flex';

        // 1. Spawn Player (temp coordinates, MapLoader corrects it)
        this.player = new Player(this, 100, 100);
        this.player.setDepth(4);

        // 2. Load Chapter Map
        const mapInfo = MapLoader.loadMap(this, window.gameState.currentChapter);
        this.player.setPosition(mapInfo.startX, mapInfo.startY);
        this.enemiesRemaining = mapInfo.enemyCount;

        // Set World boundaries
        this.physics.world.setBounds(0, 0, 34 * 32, 20 * 32);
        this.cameras.main.setBounds(0, 0, 34 * 32, 20 * 32);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.4); // slightly zoomed-in hotline-miami feel

        // 3. Collisions & Overlaps
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.collider(this.enemies, this.enemies);
        this.physics.add.collider(this.player, this.enemies); // push bodies

        // Bullet vs Walls / Entities
        this.physics.add.collider(this.bullets, this.walls, this.handleBulletWallCollide, null, this);
        this.physics.add.overlap(this.bullets, this.enemies, this.handleBulletEnemyOverlap, null, this);
        this.physics.add.overlap(this.bullets, this.player, this.handleBulletPlayerOverlap, null, this);

        // Pickup Overlap
        this.physics.add.overlap(this.player, this.pickups, this.handlePlayerPickupOverlap, null, this);

        // Ambient lighting layers (Dynamic Lighting simulation)
        this.createLightOverlay();

        // Weather effects (Rain/Fog)
        this.createWeatherEffects();

        // Visual on-screen HUD text
        this.createInGameHUDText();

        // Music Trigger
        if (window.gameState.audioInitialized) {
            // Chapter 6 plays special arpeggio track later, but starts silent
            if (window.gameState.currentChapter === 6) {
                soundSynth.stopMusic();
            } else {
                soundSynth.startMusic('game');
            }
        }

        // Action Keys
        this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        
        // Setup blood screen flash overlay
        this.bloodFlash = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x8b0000, 0);
        this.bloodFlash.setScrollFactor(0);
        this.bloodFlash.setDepth(99);

        // Developer Debug toggle (Tab)
        this.keyDebug = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
        this.input.keyboard.on('keydown-TAB', () => {
            window.gameState.cheatsEnabled = !window.gameState.cheatsEnabled;
            this.showDebugPrompt();
        });
    }

    update(time, delta) {
        this.player.update(time, delta);

        // Update all active enemies
        this.enemies.getChildren().forEach(enemy => {
            enemy.update(time, delta, this.player);
        });

        // Update lighting overlay coordinates (follows player's flashlight cone)
        this.updateFlashlightCone();

        // Clear dynamic graphics (like sniper lasers) before next draw
        this.lasersGraphics.clear();

        // Action Button check for Executions
        if (Phaser.Input.Keyboard.JustDown(this.keyF)) {
            this.tryExecution();
        }

        // Keep rain particles following player camera
        if (this.rainEmitter) {
            this.rainEmitter.setPosition(this.player.x - 300, this.player.y - 300);
        }

        // HUD updates
        this.updateHUDText();

        // Special check for Chapter 6 destination
        if (window.gameState.currentChapter === 6 && !this.endingTriggered) {
            const distToExit = Phaser.Math.Distance.Between(this.player.x, this.player.y, 16 * 32 + 16, 17 * 32 + 16);
            if (distToExit < 40) {
                this.triggerEndingSequence();
            }
        }
    }

    // --- GAMEPLAY TRIGGERS ---

    spawnEnemy(x, y, type, isHallucination = false) {
        const enemy = new Enemy(this, x, y, type, isHallucination);
        enemy.setDepth(4);
        this.enemies.add(enemy);
    }

    spawnBullet(x, y, angle, damage, isFriendly) {
        // Bullet starts slightly ahead of shooter
        const startX = x + Math.cos(angle) * 16;
        const startY = y + Math.sin(angle) * 16;

        const bullet = this.physics.add.sprite(startX, startY, 'bullet');
        bullet.setDepth(3);
        bullet.setRotation(angle);

        // Physics properties
        const speed = 750;
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        bullet.body.setSize(4, 4);

        bullet.isFriendly = isFriendly;
        bullet.damage = damage;

        // Auto destroy bullet after 1.8 seconds to avoid leakage
        this.time.delayedCall(1800, () => {
            if (bullet.active) bullet.destroy();
        });
        
        this.bullets.add(bullet);
    }

    spawnMuzzleFlash(x, y, angle) {
        // Quick visual orange circle
        const flashX = x + Math.cos(angle) * 20;
        const flashY = y + Math.sin(angle) * 20;
        const flash = this.add.circle(flashX, flashY, 14, 0xffaa00, 0.85);
        flash.setDepth(5);
        this.tweens.add({
            targets: flash,
            scale: 0.1,
            alpha: 0,
            duration: 50,
            onComplete: () => flash.destroy()
        });
    }

    spawnDroppedWeapon(x, y, type) {
        const pickup = this.pickups.create(x, y, `pickup_${type}`);
        pickup.setDepth(1);
        pickup.weaponType = type;
        
        // Simple rotation spin
        pickup.setRotation(Math.random() * Math.PI);
        
        // Small pulse tween on floor items
        this.tweens.add({
            targets: pickup,
            scale: 1.15,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }

    spawnBloodDecal(x, y, density = 4) {
        for (let i = 0; i < density; i++) {
            const rx = x + Phaser.Math.FloatBetween(-16, 16);
            const ry = y + Phaser.Math.FloatBetween(-16, 16);
            const size = Phaser.Math.Between(1, 4);
            const decalKey = `blood_${size}`;
            
            const b = this.add.sprite(rx, ry, decalKey);
            b.setDepth(1);
            b.setRotation(Math.random() * Math.PI * 2);
            
            // Random scales
            b.setScale(Phaser.Math.FloatBetween(0.6, 1.4));
            
            this.bloodDecals.add(b);
        }
    }

    spawnSmokeParticles(x, y) {
        // Explode grey rings
        for (let i = 0; i < 12; i++) {
            const circle = this.add.circle(x, y, 6, 0x555555, 0.45);
            circle.setDepth(3);
            const angle = Math.random() * Math.PI * 2;
            const speed = 20 + Math.random() * 40;
            
            this.tweens.add({
                targets: circle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                scale: 0.1,
                alpha: 0,
                duration: 600,
                onComplete: () => circle.destroy()
            });
        }
    }

    spawnGrenade(startX, startY, targetX, targetY) {
        const nade = this.physics.add.sprite(startX, startY, 'grenade');
        nade.setDepth(4);
        
        const dist = Phaser.Math.Distance.Between(startX, startY, targetX, targetY);
        const duration = Math.min(600, dist * 1.5); // fly time
        
        // Arching throw tween
        this.tweens.add({
            targets: nade,
            x: targetX,
            y: targetY,
            rotation: Math.PI * 4,
            duration: duration,
            ease: 'Quad.easeOut',
            onComplete: () => {
                // Flash red before explosion
                this.tweens.add({
                    targets: nade,
                    tint: 0xff0000,
                    duration: 100,
                    yoyo: true,
                    repeat: 2,
                    onComplete: () => {
                        this.triggerExplosion(targetX, targetY);
                        nade.destroy();
                    }
                });
            }
        });
    }

    triggerExplosion(x, y) {
        // Play audio
        if (window.gameState.soundEnabled) {
            soundSynth.playExplosion();
        }

        // Camera heavy shake
        this.cameras.main.shake(300, 0.02);

        // Spawn explosion animation particle/decal
        const exp = this.add.sprite(x, y, 'explosion_sheet');
        exp.setDepth(5);
        exp.setScale(3);

        // Setup custom sequence frame anim
        let frame = 0;
        const animTimer = this.time.addEvent({
            delay: 75,
            repeat: 3,
            callback: () => {
                exp.setFrame(frame);
                frame++;
                if (frame > 3) {
                    exp.destroy();
                }
            }
        });

        // Damage entities in radius (96 pixels)
        const radius = 96;
        
        // Damage player
        const distToPlayer = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
        if (distToPlayer <= radius) {
            const factor = 1 - (distToPlayer / radius);
            this.player.takeDamage(Math.floor(75 * factor));
        }

        // Damage enemies
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.isDead) {
                const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
                if (dist <= radius) {
                    const factor = 1 - (dist / radius);
                    enemy.takeDamage(Math.floor(150 * factor), this.player);
                }
            }
        });

        // Add blood decals and debris
        this.spawnBloodDecal(x, y, 4);

        // Spawn glass shards particles
        for (let i = 0; i < 15; i++) {
            const shard = this.add.sprite(x, y, 'glass_shard');
            shard.setDepth(3);
            const ang = Math.random() * Math.PI * 2;
            const sp = 50 + Math.random() * 120;
            this.tweens.add({
                targets: shard,
                x: x + Math.cos(ang) * sp,
                y: y + Math.sin(ang) * sp,
                rotation: Math.random() * 6,
                alpha: 0,
                duration: 800,
                onComplete: () => shard.destroy()
            });
        }
    }

    // --- PHYSICS COLLISIONS ---

    handleBulletWallCollide(bullet, wall) {
        // Spawn tiny sparkles
        for (let i = 0; i < 3; i++) {
            const spark = this.add.circle(bullet.x, bullet.y, 2, 0xffffff, 0.85);
            spark.setDepth(3);
            const sp = 20 + Math.random() * 40;
            const ang = bullet.rotation + Math.PI + Phaser.Math.FloatBetween(-0.5, 0.5);
            
            this.tweens.add({
                targets: spark,
                x: bullet.x + Math.cos(ang) * sp,
                y: bullet.y + Math.sin(ang) * sp,
                scale: 0.1,
                alpha: 0,
                duration: 200,
                onComplete: () => spark.destroy()
            });
        }

        // Soft drywall bullet hit sound
        if (window.gameState.soundEnabled && Math.random() < 0.1) {
            soundSynth.playGlassBreak(); // small click/shatter
        }

        bullet.destroy();
    }

    handleBulletEnemyOverlap(enemy, bullet) {
        if (!bullet.active || !enemy.active || enemy.isDead) return;
        if (!bullet.isFriendly) return; // avoid friendly fire on same group

        // Damage enemy
        enemy.takeDamage(bullet.damage, this.player);
        bullet.destroy();
    }

    handleBulletPlayerOverlap(player, bullet) {
        if (!bullet.active || !player.active || player.isDead) return;
        if (bullet.isFriendly) return; // ignore player's own bullets

        // Damage player
        player.takeDamage(bullet.damage);
        bullet.destroy();
    }

    handlePlayerPickupOverlap(player, pickup) {
        if (!pickup.active || !player.active || player.isDead) return;
        const wIdx = player.weaponsList.findIndex(w => w.type === pickup.weaponType);
        if (wIdx !== -1) {
            player.unlockWeapon(wIdx);
            
            // Replenish ammo to max
            player.weaponsList[wIdx].ammo = player.weaponsList[wIdx].ammoMax;

            // Flash screen green slightly for visual pickup confirmation
            this.cameras.main.flash(40, 59, 191, 59, 0.08);

            // Spawn audio click
            if (window.gameState.soundEnabled) {
                soundSynth.playReload();
            }

            pickup.destroy();
        }
    }

    checkMeleeHit(attacker, weapon) {
        // Simple radius hit check
        const range = weapon.type === 'axe' ? 55 : 42;
        const forwardAngle = attacker.rotation;
        
        // Loop active enemies
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.isDead) {
                const dist = Phaser.Math.Distance.Between(attacker.x, attacker.y, enemy.x, enemy.y);
                if (dist <= range) {
                    // Check if enemy is in front cone of attacker (approx 90 degrees wide)
                    const angleToEnemy = Phaser.Math.Angle.Between(attacker.x, attacker.y, enemy.x, enemy.y);
                    const diff = Phaser.Math.Angle.Wrap(angleToEnemy - forwardAngle);
                    
                    if (Math.abs(diff) < Math.PI / 3) {
                        enemy.takeDamage(weapon.damage, attacker);
                        
                        // play blood slash audio
                        if (window.gameState.soundEnabled) {
                            if (weapon.type === 'axe') soundSynth.playAxe();
                            else soundSynth.playSlash();
                        }
                    }
                }
            }
        });
    }

    // --- SENSORY & AI RAYCASTING ---

    checkLineOfSight(enemy, target, range) {
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y);
        if (dist > range) return false;

        // Trace ray: sample points along line from enemy to target
        const steps = Math.floor(dist / 14); // check every 14 pixels
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
        const wallsAtPoint = this.walls.getChildren();

        for (let i = 1; i < steps; i++) {
            const checkX = enemy.x + Math.cos(angle) * (i * 14);
            const checkY = enemy.y + Math.sin(angle) * (i * 14);

            // Check if coordinates overlap any static wall
            for (let w = 0; w < wallsAtPoint.length; w++) {
                const wall = wallsAtPoint[w];
                const dx = wall.x - checkX;
                const dy = wall.y - checkY;
                
                // Square distance filter: only check AABB collision if wall is close to the sample point (dx^2 + dy^2 <= 40^2)
                if (dx * dx + dy * dy > 1600) continue;

                if (checkX >= wall.body.left && checkX <= wall.body.right && 
                    checkY >= wall.body.top && checkY <= wall.body.bottom) {
                    return false; // ray hit wall: blocked!
                }
            }
        }
        return true; // clear line of sight
    }

    broadcastNoise(x, y, radius, isShot) {
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.isDead) {
                const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
                if (dist <= radius) {
                    enemy.hearNoise(x, y, isShot);
                }
            }
        });
    }

    drawLaser(ex, ey, px, py, progress) {
        // Red sniper aiming guide
        this.lasersGraphics.lineStyle(1, 0xff0000, 0.12 + (progress * 0.4)); // gets darker/wider as it locks
        this.lasersGraphics.beginPath();
        this.lasersGraphics.moveTo(ex, ey);
        this.lasersGraphics.lineTo(px, py);
        this.lasersGraphics.closePath();
        this.lasersGraphics.strokePath();

        // Draw dot on player body
        this.lasersGraphics.fillStyle(0xff0000, 0.45 + (progress * 0.5));
        this.lasersGraphics.fillCircle(px, py, 3);
    }

    // --- STEALTH & EXECUTIONS (Part 6) ---

    tryExecution() {
        if (this.player.isExecuting || this.player.isDead) return;

        let closestEnemy = null;
        let minDist = 40; // close range trigger

        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.isDead) {
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                if (dist <= minDist) {
                    minDist = dist;
                    closestEnemy = enemy;
                }
            }
        });

        if (closestEnemy) {
            this.executeEnemy(closestEnemy);
        }
    }

    executeEnemy(enemy) {
        this.player.isExecuting = true;
        enemy.aiState = 'DEAD';
        enemy.setVelocity(0);
        this.player.setVelocity(0);

        // Check if player is behind the enemy (Stealth throat cut)
        const angleDiff = Phaser.Math.Angle.Wrap(this.player.rotation - enemy.rotation);
        const isStealth = Math.abs(angleDiff) < Math.PI / 2.5;

        // Visual screen flash & zoom in
        this.cameras.main.zoomTo(1.7, 300);
        this.cameras.main.flash(80, 139, 0, 0, 0.15);

        // Lock player position to enemy
        const targetX = enemy.x - Math.cos(enemy.rotation) * 8;
        const targetY = enemy.y - Math.sin(enemy.rotation) * 8;
        this.player.setPosition(targetX, targetY);

        // Run execution animation timer sequence (Blood fountains)
        let sliceCount = 0;
        const sliceTimer = this.time.addEvent({
            delay: 100,
            repeat: 4,
            callback: () => {
                sliceCount++;
                this.spawnBloodDecal(enemy.x, enemy.y, 3);
                this.cameras.main.shake(50, 0.005);
                
                // Sound swing clicks
                if (window.gameState.soundEnabled) {
                    soundSynth.playSlash();
                }
            }
        });

        this.time.delayedCall(600, () => {
            // Final heavy strike
            enemy.die();
            this.player.isExecuting = false;
            this.cameras.main.zoomTo(1.4, 300);

            // Heavy blood spray
            this.spawnBloodDecal(enemy.x, enemy.y, 14);

            if (window.gameState.soundEnabled) {
                // If axe is selected or front attack: blast impact
                if (this.player.getCurrentWeapon().type === 'axe') {
                    soundSynth.playAxe();
                } else if (this.player.getCurrentWeapon().type === 'shotgun') {
                    soundSynth.playShoot('shotgun');
                } else {
                    soundSynth.playScream();
                }
            }
        });
    }

    // --- LIGHTING & SHADER SIMULATION ---

    createLightOverlay() {
        // We will simulate dynamic lighting by drawing a semi-transparent black overlay mask,
        // and carving out the player's flashlight cone and street lamp circles.
        // Phaser uses RenderTexture or Graphics masks for this.
        // A simple, very performant retro trick: draw a black graphics layer with multiply blend mode!
        // We will create a full map size overlay.
        this.lightOverlay = this.add.graphics();
        this.lightOverlay.setDepth(10); // draws on top of sprites, below HUD text
        this.lightOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
    }

    updateFlashlightCone() {
        if (!this.lightOverlay) return;

        this.lightOverlay.clear();

        // 1. Draw solid dark ambient layer (Darkness index depends on chapter)
        let ambientDarkness = 0.95; // hospital and subways are very dark
        if (window.gameState.currentChapter === 1) ambientDarkness = 0.8;  // city street (streetlamps)
        if (window.gameState.currentChapter === 4) ambientDarkness = 0.75; // favela mist
        if (window.gameState.currentChapter === 6) ambientDarkness = 0.15; // house starts bright (Elias's safe place)

        this.lightOverlay.fillStyle(0x0e1111, ambientDarkness);
        this.lightOverlay.fillRect(0, 0, 34 * 32, 20 * 32);

        // 2. Cutout player's flashlight: draw a glowing circle/cone
        // In phaser dynamic multiply blend: drawing white (0xffffff) leaves it fully visible (bright)
        // drawing orange/yellow colors tints the light warm
        
        // Draw player personal halo (radial light around body)
        const radGrad = this.lightOverlay.createRadialGradient(
            this.player.x, this.player.y, 5,
            this.player.x, this.player.y, 45
        );
        radGrad.addColorStop(0, 'rgba(255, 245, 220, 1.0)');
        radGrad.addColorStop(1, 'rgba(14, 17, 17, 0.0)');
        this.lightOverlay.fillStyle(radGrad);
        this.lightOverlay.beginPath();
        this.lightOverlay.arc(this.player.x, this.player.y, 45, 0, Math.PI*2);
        this.lightOverlay.fill();

        // Draw Player Flashlight Cone: extended triangle facing player's rotation angle
        if (window.gameState.currentChapter !== 6) {
            const coneAngle = 0.45; // angle spread
            const maxRange = 240;
            const rot = this.player.rotation;
            
            const px1 = this.player.x + Math.cos(rot - coneAngle) * maxRange;
            const py1 = this.player.y + Math.sin(rot - coneAngle) * maxRange;
            const px2 = this.player.x + Math.cos(rot + coneAngle) * maxRange;
            const py2 = this.player.y + Math.sin(rot + coneAngle) * maxRange;

            // Flashlight gradient
            const flashGrad = this.lightOverlay.createRadialGradient(
                this.player.x, this.player.y, 20,
                this.player.x + Math.cos(rot) * maxRange * 0.7, this.player.y + Math.sin(rot) * maxRange * 0.7, maxRange
            );
            flashGrad.addColorStop(0, 'rgba(255, 255, 230, 0.9)');
            flashGrad.addColorStop(0.5, 'rgba(255, 255, 230, 0.35)');
            flashGrad.addColorStop(1, 'rgba(14, 17, 17, 0.0)');

            this.lightOverlay.fillStyle(flashGrad);
            this.lightOverlay.beginPath();
            this.lightOverlay.moveTo(this.player.x, this.player.y);
            this.lightOverlay.lineTo(px1, py1);
            this.lightOverlay.lineTo(px2, py2);
            this.lightOverlay.closePath();
            this.lightOverlay.fill();
        }

        // Draw streetlights / static lamps (e.g. Chapter 1 city lamp)
        if (window.gameState.currentChapter === 1) {
            // Draw static streetlight halo at a few spots
            const lamps = [[15*32, 10*32], [28*32, 5*32]];
            lamps.forEach(lp => {
                const lampGrad = this.lightOverlay.createRadialGradient(lp[0], lp[1], 10, lp[0], lp[1], 120);
                lampGrad.addColorStop(0, 'rgba(255, 220, 180, 0.85)');
                lampGrad.addColorStop(1, 'rgba(14, 17, 17, 0.0)');
                this.lightOverlay.fillStyle(lampGrad);
                this.lightOverlay.beginPath();
                this.lightOverlay.arc(lp[0], lp[1], 120, 0, Math.PI*2);
                this.lightOverlay.fill();
            });
        }

        // Flickering effects: Hospital/Subway lights toggle
        if ((window.gameState.currentChapter === 2 || window.gameState.currentChapter === 3) && Math.random() < 0.97) {
            const hLamps = [[5*32, 5*32], [18*32, 8*32], [29*32, 14*32]];
            hLamps.forEach(hl => {
                // Flickers out on certain random cycles
                if (this.time.now % 1000 > 120) {
                    const lampGrad = this.lightOverlay.createRadialGradient(hl[0], hl[1], 5, hl[0], hl[1], 80);
                    lampGrad.addColorStop(0, 'rgba(230, 245, 255, 0.7)');
                    lampGrad.addColorStop(1, 'rgba(14, 17, 17, 0.0)');
                    this.lightOverlay.fillStyle(lampGrad);
                    this.lightOverlay.beginPath();
                    this.lightOverlay.arc(hl[0], hl[1], 80, 0, Math.PI*2);
                    this.lightOverlay.fill();
                }
            });
        }
    }

    // --- WEATHER & PARTICLE ENGINES ---

    createWeatherEffects() {
        // Rain particles follows Elias in Chapters 1, 2, 4, 5
        const ch = window.gameState.currentChapter;
        if (ch === 1 || ch === 2 || ch === 4 || ch === 5) {
            this.rainEmitter = this.add.particles(0, 0, 'rain_drop', {
                x: { min: -100, max: 1000 },
                y: -10,
                lifespan: 1500,
                speedY: { min: 500, max: 800 },
                speedX: { min: -80, max: -30 },
                scaleY: { min: 0.8, max: 1.5 },
                alpha: { min: 0.12, max: 0.25 },
                quantity: 4,
                frequency: 10
            });
            this.rainEmitter.setDepth(3); // below flashlight multiplier, above players
        }

        // Lightning strike simulator
        if (ch === 1 || ch === 4 || ch === 5) {
            this.time.addEvent({
                delay: 7000,
                callback: () => {
                    if (Math.random() < 0.6 && !this.endingTriggered) {
                        // Flash camera white quickly
                        this.cameras.main.flash(200, 255, 255, 255, 0.35);
                        
                        // Play distant thunder rumble
                        if (window.gameState.soundEnabled) {
                            try {
                                const time = soundSynth.ctx.currentTime;
                                const noise = soundSynth.ctx.createBufferSource();
                                noise.buffer = soundSynth.createNoiseBuffer();
                                const filter = soundSynth.ctx.createBiquadFilter();
                                filter.type = 'lowpass';
                                filter.frequency.setValueAtTime(120, time);
                                filter.frequency.exponentialRampToValueAtTime(10, time + 2.0);
                                const gain = soundSynth.ctx.createGain();
                                gain.gain.setValueAtTime(0.18, time);
                                gain.gain.exponentialRampToValueAtTime(0.001, time + 2.0);
                                noise.connect(filter);
                                filter.connect(gain);
                                gain.connect(soundSynth.sfxVolume);
                                noise.start(time);
                                noise.stop(time + 2.0);
                            } catch (e) {}
                        }
                    }
                },
                callbackScope: this,
                loop: true
            });
        }
    }

    // --- UI HUD DRAWING ---

    createInGameHUDText() {
        const width = this.cameras.main.width;
        
        this.objectiveText = this.add.text(15, 15, '', {
            fontFamily: 'Courier Prime, Courier, monospace',
            fontSize: '11px',
            color: '#3bbf3b',
            stroke: '#000',
            strokeThickness: 3
        });
        this.objectiveText.setScrollFactor(0);
        this.objectiveText.setDepth(20);

        this.weaponHUDText = this.add.text(15, 32, '', {
            fontFamily: 'Courier Prime, Courier, monospace',
            fontSize: '11px',
            color: '#8b0000',
            stroke: '#000',
            strokeThickness: 3
        });
        this.weaponHUDText.setScrollFactor(0);
        this.weaponHUDText.setDepth(20);
    }

    updateHUDText() {
        if (this.player.isDead) return;

        const weapon = this.player.getCurrentWeapon();
        const ammoStr = weapon.isMelee ? 'INF' : `${weapon.ammo}/${weapon.ammoMax}`;
        const slowmoPct = Math.floor(this.player.slowMoMeter);

        this.weaponHUDText.setText(
            `EQP: [${weapon.name}] | BULLETS: ${ammoStr} [R] | GRANADAS: ${this.player.grenadesCount} [G]\n` +
            `HP: ${this.player.health}% | NEURAL RAGE: ${slowmoPct}% [Q]`
        );

        if (window.gameState.currentChapter === 6) {
            this.objectiveText.setText('OBJECTIVE: WALK AROUND. ENTER THE FINAL HOUSE.');
            return;
        }

        if (this.enemiesRemaining > 0) {
            this.objectiveText.setText(`OBJECTIVE: ELIMINATE THE TARGETS (${this.enemiesRemaining} REMAINING)`);
        } else {
            this.exitUnlocked = true;
            this.objectiveText.setText('OBJECTIVE: PATH CLEAR. FIND AND REACH THE EXIT POINT.');
            
            // Pulse color
            if (this.time.now % 1000 < 500) {
                this.objectiveText.setColor('#3bbf3b');
            } else {
                this.objectiveText.setColor('#ffffff');
            }
        }
    }

    checkLevelCompletion() {
        // Scan active non-dead enemies
        let count = 0;
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.isDead && !enemy.isHallucination) count++;
        });

        this.enemiesRemaining = count;

        if (count === 0 && !this.exitUnlocked) {
            this.exitUnlocked = true;
            // Play confirm beep sound
            if (window.gameState.soundEnabled) {
                soundSynth.playReload();
            }
        }
    }

    handleExitReached() {
        if (!this.exitUnlocked && window.gameState.currentChapter !== 6) {
            // Cannot exit until targets cleared
            return;
        }

        // Advance Chapter
        window.gameState.currentChapter++;
        
        // Save chapter unlock
        if (window.gameState.currentChapter > window.gameState.maxUnlockedChapter) {
            window.gameState.maxUnlockedChapter = window.gameState.currentChapter;
        }

        // Fade out music and go back to Cutscene for next story text
        if (window.gameState.audioInitialized) {
            soundSynth.stopMusic();
        }

        // Screen flash transition
        this.cameras.main.flash(200, 0, 0, 0, 1.0);
        this.time.delayedCall(200, () => {
            if (window.gameState.currentChapter > 6) {
                // Should not reach here because Chapter 6 handles its own ending in the sequence
                this.scene.start('MenuScene');
            } else {
                this.scene.start('CutsceneScene');
            }
        });
    }

    handlePlayerDeath() {
        // Red vignette locks
        this.bloodFlash.setFillStyle(0x8b0000, 0.45);
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.text(width / 2, height / 2 - 40, 'Y O U  F E L L', {
            fontFamily: 'Special Elite, Courier New, monospace',
            fontSize: '32px',
            color: '#ff3333'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(21);

        this.add.text(width / 2, height / 2 + 10, '>>> PRESS ENTER TO RE-START MEMORY COGNITION LOOP', {
            fontFamily: 'Courier Prime, Courier, monospace',
            fontSize: '11px',
            color: '#888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(21);

        this.input.keyboard.once('keydown-ENTER', () => {
            // Restart current scene
            this.scene.restart();
        });
    }

    flashBloodOnCamera() {
        this.bloodFlash.setAlpha(0.35);
        this.tweens.add({
            targets: this.bloodFlash,
            alpha: 0,
            duration: 800
        });
    }

    activateSlowMotion(active) {
        if (active) {
            this.physics.world.timeScale = 2.5; // slow down physics updates
            this.cameras.main.setTint(0xff9999); // red tint screen
            
            // heartbeats slow and heavy
            if (window.gameState.soundEnabled) {
                soundSynth.updateHeartRate(45);
            }
        } else {
            this.physics.world.timeScale = 1.0;
            this.cameras.main.clearTint();
            
            // normal heart rate
            if (window.gameState.soundEnabled) {
                soundSynth.updateHeartRate(72);
            }
        }
    }

    showDebugPrompt() {
        const text = this.add.text(this.cameras.main.width / 2, 80, 
            `GOD MODE / CHEATS: ${window.gameState.cheatsEnabled ? 'ACTIVE' : 'INACTIVE'}`, {
            fontFamily: 'Courier Prime, monospace',
            fontSize: '13px',
            color: '#dfa010'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(30);

        // Auto destroy pickup notification
        this.time.delayedCall(1500, () => text.destroy());
    }

    // --- PSYCHOLOGICAL ENDING SEQUENCE (Chapter 6 Plot twist) ---

    triggerEndingSequence() {
        this.endingTriggered = true;
        this.player.isExecuting = true; // freeze controls
        this.player.setVelocity(0);

        // Slow camera fade out of colors (black and white filter)
        this.cameras.main.zoomTo(1.8, 6000);
        
        // Stop heartbeat sound
        if (window.gameState.soundEnabled) {
            soundSynth.stopHeartbeat();
        }

        // Start Pixies Where is My Mind arpeggio sequencer
        if (window.gameState.audioInitialized) {
            soundSynth.startMusic('ending');
        }

        // Display typewriter monologue overlay on screen (credits-like sequence)
        const finalLines = [
            "ELIAS ENTRA NO QUARTO. O BERÇO ESTÁ COBERTO DE POEIRA DE CINCO ANOS.",
            "NÃO HÁ CLAIRE. NÃO HÁ FILHA.",
            "AS PAREDES SÃO APENAS RUÍNAS QUEIMADAS DO DIA DO BOMBARDEIO...",
            "A VOZ NO RÁDIO FALA UMA ÚLTIMA VEZ... MAS É A SUA PRÓPRIA VOZ.",
            "ELIAS: 'Elas nunca estiveram lá... Estiveram?'",
            "SISTEMA COGNITIVO: 'Integridade da Memória Restabelecida. A guerra acabou, Elias.'",
            "'Você é o único sobrevivente de sua própria mente.'",
            "S H A T T E R E D"
        ];

        let lineIdx = 0;
        const displayNextFinalLine = () => {
            if (lineIdx >= finalLines.length) {
                this.fadeToEndingCredits();
                return;
            }

            const textObj = this.add.text(this.player.x, this.player.y - 70, finalLines[lineIdx], {
                fontFamily: 'Courier Prime, monospace',
                fontSize: '10px',
                color: '#fff',
                stroke: '#000',
                strokeThickness: 3,
                wordWrap: { width: 350 }
            }).setOrigin(0.5).setDepth(22).setAlpha(0);

            // Typewriter slide up
            this.tweens.add({
                targets: textObj,
                y: this.player.y - 95,
                alpha: 1,
                duration: 800,
                onComplete: () => {
                    this.time.delayedCall(3000, () => {
                        this.tweens.add({
                            targets: textObj,
                            alpha: 0,
                            duration: 800,
                            onComplete: () => {
                                textObj.destroy();
                                lineIdx++;
                                displayNextFinalLine();
                            }
                        });
                    });
                }
            });
        };

        this.time.delayedCall(1500, () => {
            displayNextFinalLine();
        });
    }

    fadeToEndingCredits() {
        // Fade to absolute black
        this.cameras.main.fade(3000, 0, 0, 0, false, (camera, progress) => {
            if (progress === 1) {
                // Show credits page
                const width = this.cameras.main.width;
                const height = this.cameras.main.height;

                // Stop game scene and clean HUD DOM elements
                if (this.hudVitals) this.hudVitals.style.display = 'none';

                const blackScreen = this.add.rectangle(this.player.x, this.player.y, width * 2, height * 2, 0x000000);
                blackScreen.setDepth(100);

                const finalTitle = this.add.text(this.player.x, this.player.y - 60, 'S H A T T E R E D', {
                    fontFamily: 'Special Elite, monospace',
                    fontSize: '36px',
                    color: '#8b0000'
                }).setOrigin(0.5).setDepth(101).setAlpha(0);

                const creditText = this.add.text(this.player.x, this.player.y + 10, 
                    "Slogan: 'Sometimes the enemy isn't waiting for you... it's following you.'\n\n" +
                    "A Tragic Psych-Horror browser experience.\n" +
                    "Developed completely programmatically in Phaser 3.\n\n" +
                    "Obrigado por jogar Elias Ward.", {
                    fontFamily: 'Courier Prime, monospace',
                    fontSize: '11px',
                    color: '#888',
                    align: 'center'
                }).setOrigin(0.5).setDepth(101).setAlpha(0);

                const returnBtn = this.add.text(this.player.x, this.player.y + 100, "RE-START GAME", {
                    fontFamily: 'Courier Prime, monospace',
                    fontSize: '12px',
                    color: '#3bbf3b'
                }).setOrigin(0.5).setDepth(101).setAlpha(0).setInteractive();

                this.tweens.add({
                    targets: finalTitle,
                    alpha: 1,
                    duration: 2000
                });

                this.tweens.add({
                    targets: creditText,
                    alpha: 1,
                    delay: 1500,
                    duration: 2000
                });

                this.tweens.add({
                    targets: returnBtn,
                    alpha: 1,
                    delay: 3500,
                    duration: 1000,
                    onComplete: () => {
                        returnBtn.on('pointerover', () => returnBtn.setColor('#fff'));
                        returnBtn.on('pointerout', () => returnBtn.setColor('#3bbf3b'));
                        returnBtn.on('pointerdown', () => {
                            // Stop Pixies and go back to Main Menu
                            soundSynth.stopMusic();
                            window.location.reload(); // full reload to reset variables
                        });
                    }
                });
            }
        });
    }
}
