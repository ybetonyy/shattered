import { soundSynth } from '../audio/SoundSynth.js';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type = 'pistol', isHallucination = false) {
        // Hallucination has a special sprite texture
        const texture = isHallucination ? 'hallucination' : `enemy_${type === 'boss' ? 'boss' : type}`;
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setBodySize(22, 22);
        this.setCircle(11, 5, 5);

        // Core Attributes
        this.type = type; // 'pistol', 'shotgun', 'rifle', 'melee', 'sniper', 'boss'
        this.isHallucination = isHallucination;
        this.isDead = false;
        
        // Stats based on type
        this.maxHealth = this.getStatsByType().health;
        this.health = this.maxHealth;
        this.speed = this.getStatsByType().speed;
        this.damage = this.getStatsByType().damage;
        this.fireRate = this.getStatsByType().fireRate;
        this.visionRange = this.getStatsByType().visionRange;
        this.attackRange = this.getStatsByType().attackRange;
        
        this.lastFired = 0;
        this.alerted = false;

        // AI FSM States: 'PATROL', 'CHASE', 'ATTACK', 'INVESTIGATE', 'FLANK', 'FLEE', 'DEAD'
        this.aiState = 'PATROL';
        this.targetX = x;
        this.targetY = y;
        this.investigateTimer = 0;
        
        // Patrol nodes
        this.patrolAngle = Math.random() * Math.PI * 2;
        this.patrolTimer = 0;

        // Sniping aim timer
        this.aimProgress = 0; // used for sniper units
        
        // Flank direction
        this.flankDir = Math.random() < 0.5 ? 1 : -1;
    }

    getStatsByType() {
        switch (this.type) {
            case 'melee':
                return { health: 50, speed: 180, damage: 35, fireRate: 600, visionRange: 260, attackRange: 45 };
            case 'pistol':
                return { health: 60, speed: 120, damage: 20, fireRate: 800, visionRange: 350, attackRange: 220 };
            case 'shotgun':
                return { health: 80, speed: 100, damage: 12, fireRate: 1200, visionRange: 280, attackRange: 140 }; // multi-pellet
            case 'rifle':
                return { health: 70, speed: 130, damage: 15, fireRate: 200, visionRange: 400, attackRange: 300 };
            case 'sniper':
                return { health: 50, speed: 60, damage: 60, fireRate: 2500, visionRange: 600, attackRange: 550 };
            case 'boss':
                return { health: 320, speed: 80, damage: 25, fireRate: 600, visionRange: 500, attackRange: 350 };
            default:
                return { health: 60, speed: 110, damage: 15, fireRate: 800, visionRange: 300, attackRange: 150 };
        }
    }

    update(time, delta, player) {
        if (this.isDead || player.isDead) {
            this.setVelocity(0);
            return;
        }

        // Run Behavior Machine
        this.runBehaviorTree(time, delta, player);

        // Face Target Direction
        if (this.body.velocity.x !== 0 || this.body.velocity.y !== 0) {
            this.setRotation(Math.atan2(this.body.velocity.y, this.body.velocity.x));
        }
    }

    runBehaviorTree(time, delta, player) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        
        // Raycast Line of Sight
        const hasLineOfSight = this.scene.checkLineOfSight(this, player, this.visionRange);

        // Flee Check (if low health and not a boss or melee specialist)
        if (this.health < this.maxHealth * 0.3 && this.type !== 'boss' && this.type !== 'melee' && Math.random() < 0.05) {
            this.aiState = 'FLEE';
        }

        switch (this.aiState) {
            case 'PATROL':
                this.executePatrol(time, delta);
                if (hasLineOfSight) {
                    this.alertAllies(player.x, player.y);
                    this.aiState = 'CHASE';
                }
                break;

            case 'CHASE':
                if (!hasLineOfSight) {
                    this.targetX = player.x;
                    this.targetY = player.y;
                    this.investigateTimer = 3000; // 3 seconds search
                    this.aiState = 'INVESTIGATE';
                } else {
                    if (dist <= this.attackRange) {
                        this.aiState = 'ATTACK';
                    } else if (dist > this.attackRange * 1.3 && Math.random() < 0.02 && this.type !== 'melee') {
                        // Flanking maneuver chance
                        this.aiState = 'FLANK';
                    } else {
                        // Move directly towards player
                        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                        this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
                    }
                }
                break;

            case 'FLANK':
                if (!hasLineOfSight) {
                    this.aiState = 'CHASE';
                } else if (dist <= this.attackRange) {
                    this.aiState = 'ATTACK';
                } else {
                    // Circle orbit movement around player
                    const toPlayer = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                    const flankAngle = toPlayer + (Math.PI / 2 * this.flankDir);
                    
                    // combination of orbiting and getting closer
                    const vx = Math.cos(flankAngle) * 0.8 + Math.cos(toPlayer) * 0.2;
                    const vy = Math.sin(flankAngle) * 0.8 + Math.sin(toPlayer) * 0.2;
                    this.setVelocity(vx * this.speed, vy * this.speed);

                    // Chance to reverse orbit direction
                    if (Math.random() < 0.01) this.flankDir *= -1;
                }
                break;

            case 'ATTACK':
                if (!hasLineOfSight || dist > this.attackRange * 1.2) {
                    this.aiState = 'CHASE';
                    this.aimProgress = 0; // reset sniper
                } else {
                    // Turn to face player
                    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                    this.setRotation(angle);

                    // Melee specific attacks
                    if (this.type === 'melee') {
                        this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
                        if (dist <= this.attackRange && time > this.lastFired) {
                            this.meleeStrike(time, player);
                        }
                    } 
                    // Sniper aiming mechanic
                    else if (this.type === 'sniper') {
                        this.setVelocity(0);
                        this.aimProgress += delta;
                        
                        // Draw aiming laser in scene
                        this.scene.drawLaser(this.x, this.y, player.x, player.y, this.aimProgress / this.fireRate);

                        if (this.aimProgress >= this.fireRate) {
                            this.fireSniper(time, player);
                        }
                    }
                    // Standard firearm shoot
                    else {
                        this.setVelocity(0); // stand still to shoot
                        if (time > this.lastFired) {
                            this.fireWeapon(time, player);
                        }
                    }
                }
                break;

            case 'INVESTIGATE':
                const distToTarget = Phaser.Math.Distance.Between(this.x, this.y, this.targetX, this.targetY);
                if (hasLineOfSight) {
                    this.aiState = 'CHASE';
                } else if (distToTarget <= 20) {
                    // Look around
                    this.setVelocity(0);
                    this.investigateTimer -= delta;
                    this.setRotation(this.rotation + 0.05); // slowly spin
                    
                    if (this.investigateTimer <= 0) {
                        this.aiState = 'PATROL';
                    }
                } else {
                    // Navigate to investigation point
                    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.targetX, this.targetY);
                    this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
                }
                break;

            case 'FLEE':
                // Run in opposite direction of player
                const escapeAngle = Phaser.Math.Angle.Between(player.x, player.y, this.x, this.y) + Phaser.Math.FloatBetween(-0.3, 0.3);
                this.setVelocity(Math.cos(escapeAngle) * (this.speed * 1.2), Math.sin(escapeAngle) * (this.speed * 1.2));
                
                // Seek new patrol state if line of sight is broken for a while
                if (!hasLineOfSight && Math.random() < 0.03) {
                    this.aiState = 'PATROL';
                }
                break;
        }
    }

    executePatrol(time, delta) {
        this.patrolTimer -= delta;
        if (this.patrolTimer <= 0) {
            // Pick a new random angle to walk
            this.patrolAngle = Math.random() * Math.PI * 2;
            this.patrolTimer = 1500 + Math.random() * 2000;
        }

        // Slowly walk
        this.setVelocity(Math.cos(this.patrolAngle) * (this.speed * 0.45), Math.sin(this.patrolAngle) * (this.speed * 0.45));
    }

    meleeStrike(time, player) {
        this.lastFired = time + this.fireRate;
        
        // Attack twitch forward
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.2,
            duration: 100,
            yoyo: true
        });

        // Slash audio
        if (window.gameState.soundEnabled) {
            soundSynth.playSlash();
        }

        // Apply damage to player
        player.takeDamage(this.damage);
    }

    fireWeapon(time, player) {
        this.lastFired = time + this.fireRate;
        
        // Sound FX
        if (window.gameState.soundEnabled) {
            soundSynth.playShoot(this.type);
        }

        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        const spread = this.type === 'shotgun' ? 0.35 : 0.12;

        if (this.type === 'shotgun') {
            // Multi pellet spread blast
            for (let i = 0; i < 5; i++) {
                const spAngle = angle + Phaser.Math.FloatBetween(-spread, spread);
                this.scene.spawnBullet(this.x, this.y, spAngle, this.damage, false);
            }
            this.scene.spawnMuzzleFlash(this.x, this.y, angle);
        } else {
            // Single shot
            const spAngle = angle + Phaser.Math.FloatBetween(-spread, spread);
            this.scene.spawnBullet(this.x, this.y, spAngle, this.damage, false);
            this.scene.spawnMuzzleFlash(this.x, this.y, angle);
        }

        // Recoil twitch back
        this.scene.tweens.add({
            targets: this,
            x: this.x - Math.cos(angle) * 4,
            y: this.y - Math.sin(angle) * 4,
            duration: 50,
            yoyo: true
        });
    }

    fireSniper(time, player) {
        this.aimProgress = 0; // reset
        this.lastFired = time + this.fireRate;
        
        if (window.gameState.soundEnabled) {
            soundSynth.playShoot('revolver'); // heavy bang for sniper
        }

        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        // Extremely accurate sniper shot
        this.scene.spawnBullet(this.x, this.y, angle, this.damage, false);
        this.scene.spawnMuzzleFlash(this.x, this.y, angle);
    }

    alertAllies(px, py) {
        if (this.alerted) return;
        this.alerted = true;

        // Call out: broadcast to all other enemies nearby within 240 units
        this.scene.enemies.getChildren().forEach(other => {
            if (other !== this && !other.isDead && other.aiState === 'PATROL') {
                const dist = Phaser.Math.Distance.Between(this.x, this.y, other.x, other.y);
                if (dist <= 240) {
                    other.targetX = px;
                    other.targetY = py;
                    other.investigateTimer = 4000;
                    other.aiState = 'INVESTIGATE';
                }
            }
        });

        // Set cooldown on alerting again
        this.scene.time.delayedCall(5000, () => {
            this.alerted = false;
        });
    }

    hearNoise(nx, ny, isShot = false) {
        if (this.isDead || this.aiState === 'CHASE' || this.aiState === 'ATTACK') return;

        // Go investigate noise
        this.targetX = nx + Phaser.Math.FloatBetween(-30, 30);
        this.targetY = ny + Phaser.Math.FloatBetween(-30, 30);
        this.investigateTimer = isShot ? 4500 : 2500;
        this.aiState = 'INVESTIGATE';
    }

    takeDamage(amount, player) {
        if (this.isDead) return;

        this.health -= amount;

        // Flash white visual feedback
        this.setTint(0xffffff);
        this.scene.time.delayedCall(60, () => {
            if (!this.isDead) this.clearTint();
        });

        // Splatter blood particles
        this.scene.spawnBloodDecal(this.x, this.y, 3);
        
        // Alert to player position instantly on hits
        this.targetX = player.x;
        this.targetY = player.y;
        this.aiState = 'CHASE';

        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    die() {
        this.isDead = true;
        this.aiState = 'DEAD';
        this.setVelocity(0);
        this.setTint(0x554444);
        
        // Clear sniper lasers
        this.aimProgress = 0;

        // Heavy splatter
        this.scene.spawnBloodDecal(this.x, this.y, 8);

        // Sound scream
        if (window.gameState.soundEnabled && Math.random() < 0.75) {
            soundSynth.playScream();
        }

        // Drop weapons (Hotline Miami styling!)
        if (this.type !== 'melee' && this.type !== 'boss') {
            this.scene.spawnDroppedWeapon(this.x, this.y, this.type);
        }

        // Remove physics body collision
        this.body.setEnable(false);

        // In Chapter 2 (Hospital), hallucinations dissolve
        if (this.isHallucination) {
            this.scene.spawnSmokeParticles(this.x, this.y);
            this.destroy(); // disappears completely!
        } else {
            // Put body in bottom rendering depth group
            this.setDepth(1);
            
            // Check if level clears
            this.scene.checkLevelCompletion();
        }
    }
}
