export default class TextureGenerator {
    static generateAll(game) {
        // Generate player textures
        this.createTopDownHuman(game, 'player_pistol', '#2e4a3e', '#1c2e26', '#d1cfcd', 'pistol');
        this.createTopDownHuman(game, 'player_shotgun', '#2e4a3e', '#1c2e26', '#d1cfcd', 'shotgun');
        this.createTopDownHuman(game, 'player_rifle', '#2e4a3e', '#1c2e26', '#d1cfcd', 'rifle');
        this.createTopDownHuman(game, 'player_melee', '#2e4a3e', '#1c2e26', '#d1cfcd', 'melee');
        this.createTopDownHuman(game, 'player_unarmed', '#2e4a3e', '#1c2e26', '#d1cfcd', 'unarmed');
        this.createRollTexture(game, 'player_roll', '#1c2e26');

        // Generate enemy textures
        this.createTopDownHuman(game, 'enemy_pistol', '#524335', '#332920', '#ebd5c1', 'pistol');
        this.createTopDownHuman(game, 'enemy_shotgun', '#524335', '#332920', '#ebd5c1', 'shotgun');
        this.createTopDownHuman(game, 'enemy_rifle', '#524335', '#332920', '#ebd5c1', 'rifle');
        this.createTopDownHuman(game, 'enemy_melee', '#524335', '#332920', '#ebd5c1', 'melee');
        this.createTopDownHuman(game, 'enemy_unarmed', '#524335', '#332920', '#ebd5c1', 'unarmed');

        // Generate hallucination (Shadowy figure with glowing red eyes)
        this.createHallucinationTexture(game, 'hallucination');

        // Boss (General Ward / commander)
        this.createBossTexture(game, 'enemy_boss');

        // Weapons pickups (ground items)
        this.createWeaponPickup(game, 'pickup_pistol', 'pistol');
        this.createWeaponPickup(game, 'pickup_revolver', 'revolver');
        this.createWeaponPickup(game, 'pickup_shotgun', 'shotgun');
        this.createWeaponPickup(game, 'pickup_rifle', 'rifle');
        this.createWeaponPickup(game, 'pickup_knife', 'knife');
        this.createWeaponPickup(game, 'pickup_axe', 'axe');

        // Projectiles / Items
        this.createBulletTexture(game, 'bullet');
        this.createGrenadeTexture(game, 'grenade');

        // VFX / Particles
        this.createBloodSplatterTextures(game);
        this.createExplosionTexture(game);
        this.createFlashlightTexture(game);
        this.createRainTexture(game);
        this.createGlassShardTexture(game);

        // Tiles
        this.createTileTexture(game, 'tile_wall_city', '#1f2421', '#111412', 'brick');
        this.createTileTexture(game, 'tile_floor_city', '#282d2a', '#1e211f', 'concrete');
        
        this.createTileTexture(game, 'tile_wall_hospital', '#2f3b37', '#1a2220', 'hospital_brick');
        this.createTileTexture(game, 'tile_floor_hospital', '#4e5b56', '#3e4a45', 'tiles');
        
        this.createTileTexture(game, 'tile_wall_metro', '#38302e', '#231e1c', 'metro_tiles');
        this.createTileTexture(game, 'tile_floor_metro', '#1a1918', '#0f0f0e', 'concrete_dark');

        this.createTileTexture(game, 'tile_wall_favela', '#4c2e05', '#2a1a03', 'wood_walls');
        this.createTileTexture(game, 'tile_floor_favela', '#443c31', '#2f2921', 'dirt');

        this.createTileTexture(game, 'tile_wall_military', '#1b261b', '#0f170f', 'steel');
        this.createTileTexture(game, 'tile_floor_military', '#2c332c', '#1b201b', 'grid');

        this.createTileTexture(game, 'tile_wall_home', '#5c3a21', '#382213', 'house_wood');
        this.createTileTexture(game, 'tile_floor_home', '#7c5335', '#573a24', 'parquet');
    }

    // Helper: Top-down human facing RIGHT (0 degrees)
    static createTopDownHuman(game, key, shirtColor, pantsColor, skinColor, weaponType) {
        const canvas = game.textures.createCanvas(key, 32, 32);
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.clearRect(0, 0, 32, 32);

        // 1. Draw Pants/Shoulders/Body (Top-Down view)
        // Torso base
        ctx.fillStyle = shirtColor;
        ctx.beginPath();
        ctx.arc(13, 16, 8, 0, Math.PI * 2);
        ctx.fill();

        // Shading on jacket
        ctx.fillStyle = pantsColor;
        ctx.beginPath();
        ctx.arc(11, 16, 7, 0.5 * Math.PI, 1.5 * Math.PI);
        ctx.fill();

        // Shoulders (drawn horizontally since head is looking right, shoulders span y-axis)
        ctx.fillStyle = shirtColor;
        ctx.fillRect(8, 8, 8, 16);

        // 2. Head (placed slightly forward/right)
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(14, 16, 5, 0, Math.PI * 2);
        ctx.fill();

        // Hair or Helmet / Mask
        if (key.includes('player')) {
            // Elias wears a dark gas mask (tactical survivor)
            ctx.fillStyle = '#1c1d1d';
            ctx.beginPath();
            ctx.arc(15, 16, 4.5, -Math.PI/2, Math.PI/2);
            ctx.fill();
            // Goggles/Filters (glowing light grey/reddish)
            ctx.fillStyle = '#8b0000';
            ctx.fillRect(17, 13, 2, 2);
            ctx.fillRect(17, 17, 2, 2);
            ctx.fillStyle = '#3a3d3d';
            ctx.beginPath();
            ctx.arc(18, 16, 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Enemy helmet
            ctx.fillStyle = '#2c3531';
            ctx.beginPath();
            ctx.arc(14, 16, 5, 0.5 * Math.PI, 1.5 * Math.PI);
            ctx.fill();
            // Face skin details
            ctx.fillStyle = skinColor;
            ctx.fillRect(15, 13, 2, 6);
        }

        // 3. Hands & Weapon (facing right)
        ctx.fillStyle = skinColor;
        if (weaponType === 'unarmed') {
            // Fists extended forward
            ctx.beginPath();
            ctx.arc(18, 11, 2, 0, Math.PI * 2);
            ctx.arc(18, 21, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (weaponType === 'pistol') {
            // Holding a pistol with both hands meeting forward
            ctx.beginPath();
            ctx.arc(20, 15, 2.5, 0, Math.PI * 2);
            ctx.fill();
            // Pistol barrel
            ctx.fillStyle = '#222';
            ctx.fillRect(20, 14, 8, 2);
        } else if (weaponType === 'shotgun') {
            // Holding a heavy shotgun forward
            ctx.beginPath();
            ctx.arc(18, 13, 2.5, 0, Math.PI * 2);
            ctx.arc(22, 16, 2.5, 0, Math.PI * 2);
            ctx.fill();
            // Shotgun stock & double barrel
            ctx.fillStyle = '#5c3a21'; // Wood stock
            ctx.fillRect(14, 14, 6, 3);
            ctx.fillStyle = '#444'; // Steel barrel
            ctx.fillRect(20, 14, 12, 3);
        } else if (weaponType === 'rifle') {
            // Holding rifle
            ctx.beginPath();
            ctx.arc(18, 12, 2.5, 0, Math.PI * 2);
            ctx.arc(24, 16, 2.5, 0, Math.PI * 2);
            ctx.fill();
            // Rifle design
            ctx.fillStyle = '#1c1c1c';
            ctx.fillRect(15, 14, 17, 3.5);
            // Scope detail
            ctx.fillStyle = '#333';
            ctx.fillRect(20, 12, 6, 2);
        } else if (weaponType === 'melee') {
            // Axe or Knife extended
            ctx.beginPath();
            ctx.arc(18, 11, 2.5, 0, Math.PI * 2);
            ctx.arc(20, 18, 2.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Blade
            ctx.fillStyle = '#8a9597';
            ctx.fillRect(20, 10, 8, 2);
        }

        // Refresh texture for Phaser
        canvas.refresh();
    }

    // Dodge Roll texture (circular spin blur)
    static createRollTexture(game, key, rollColor) {
        const canvas = game.textures.createCanvas(key, 32, 32);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 32, 32);

        // Circular smudge representation of a rolling character
        const grad = ctx.createRadialGradient(16, 16, 2, 16, 16, 14);
        grad.addColorStop(0, rollColor);
        grad.addColorStop(0.6, 'rgba(46, 74, 62, 0.6)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, Math.PI*2);
        ctx.fill();

        canvas.refresh();
    }

    // Hallucination (shadowy silhouette with glowing red eyes)
    static createHallucinationTexture(game, key) {
        const canvas = game.textures.createCanvas(key, 32, 32);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 32, 32);

        // Semi-transparent black outline body
        ctx.fillStyle = 'rgba(10, 10, 10, 0.85)';
        ctx.beginPath();
        ctx.arc(13, 16, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(7, 8, 9, 16);

        // Glowing glitchy red eyes
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 6;
        ctx.fillRect(16, 13, 3, 2);
        ctx.fillRect(16, 17, 3, 2);
        ctx.shadowBlur = 0; // reset

        // Some grey static details on the body
        ctx.fillStyle = '#333';
        ctx.fillRect(10, 12, 2, 8);

        canvas.refresh();
    }

    // Boss (General Elias fights, dark armor, heavy cap)
    static createBossTexture(game, key) {
        const canvas = game.textures.createCanvas(key, 40, 40); // slightly bigger
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 40, 40);

        // Torso heavy armor
        ctx.fillStyle = '#1c1c24';
        ctx.beginPath();
        ctx.arc(17, 20, 11, 0, Math.PI * 2);
        ctx.fill();

        // Shading/Camouflage
        ctx.fillStyle = '#2d2e38';
        ctx.fillRect(10, 10, 14, 20);

        // Golden epaulets on shoulders
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(11, 8, 3, 4);
        ctx.fillRect(11, 28, 3, 4);

        // Head with General/Officer Cap
        ctx.fillStyle = '#ebd5c1';
        ctx.beginPath();
        ctx.arc(19, 20, 6, 0, Math.PI * 2);
        ctx.fill();

        // Captain/Officer visor cap
        ctx.fillStyle = '#0a0a0d';
        ctx.fillRect(18, 14, 6, 12); // top cap
        ctx.fillStyle = '#d4af37'; // golden emblem
        ctx.fillRect(23, 19, 2, 2);

        // Big machine gun forward
        ctx.fillStyle = '#0a0a0d';
        ctx.fillRect(24, 18, 14, 4);
        ctx.fillStyle = '#555';
        ctx.fillRect(28, 16, 4, 8); // heavy drum magazine

        canvas.refresh();
    }

    // Weapon items on ground
    static createWeaponPickup(game, key, type) {
        const canvas = game.textures.createCanvas(key, 24, 24);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 24, 24);

        // Shadow circle
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(12, 12, 8, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = '#aaa';
        if (type === 'pistol') {
            ctx.fillStyle = '#444';
            ctx.fillRect(8, 11, 8, 3);
            ctx.fillRect(8, 14, 2, 4);
        } else if (type === 'revolver') {
            ctx.fillStyle = '#666';
            ctx.fillRect(6, 10, 10, 3.5);
            ctx.fillRect(6, 13.5, 2, 3);
            ctx.fillStyle = '#8b0000'; // red handle grip
            ctx.fillRect(6, 16.5, 2, 2);
        } else if (type === 'shotgun') {
            ctx.fillStyle = '#5c3a21'; // brown stock
            ctx.fillRect(4, 11, 6, 3);
            ctx.fillStyle = '#333'; // grey barrels
            ctx.fillRect(10, 11, 11, 2.5);
        } else if (type === 'rifle') {
            ctx.fillStyle = '#1c1c1c';
            ctx.fillRect(3, 10.5, 18, 3);
            ctx.fillStyle = '#444'; // magazine
            ctx.fillRect(10, 13.5, 2.5, 3.5);
        } else if (type === 'knife') {
            ctx.fillStyle = '#8a9597';
            ctx.fillRect(6, 11, 10, 2);
            ctx.fillStyle = '#5c3a21'; // handle
            ctx.fillRect(16, 11, 3, 2);
        } else if (type === 'axe') {
            ctx.fillStyle = '#5c3a21'; // handle
            ctx.fillRect(4, 11, 14, 2);
            ctx.fillStyle = '#8a9597'; // blade
            ctx.fillRect(15, 7, 3, 10);
            ctx.fillStyle = '#a0a0a0'; // blade tip
            ctx.fillRect(18, 9, 2, 6);
        }

        canvas.refresh();
    }

    // Bullet projectile
    static createBulletTexture(game, key) {
        const canvas = game.textures.createCanvas(key, 8, 4);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 8, 4);

        const grad = ctx.createLinearGradient(0, 0, 8, 0);
        grad.addColorStop(0, 'rgba(255, 255, 200, 0)');
        grad.addColorStop(0.5, '#ffa500');
        grad.addColorStop(1, '#ffffff');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 1, 8, 2);

        canvas.refresh();
    }

    // Grenade
    static createGrenadeTexture(game, key) {
        const canvas = game.textures.createCanvas(key, 12, 12);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 12, 12);

        // Body
        ctx.fillStyle = '#2d3b25';
        ctx.beginPath();
        ctx.arc(6, 6, 4, 0, Math.PI*2);
        ctx.fill();

        // Pin details
        ctx.fillStyle = '#6c7a72';
        ctx.fillRect(5, 0, 2, 2);
        ctx.beginPath();
        ctx.arc(6, 1, 2, 0, Math.PI*2);
        ctx.stroke();

        canvas.refresh();
    }

    // Blood splatters (various shapes)
    static createBloodSplatterTextures(game) {
        for (let i = 1; i <= 4; i++) {
            const canvas = game.textures.createCanvas(`blood_${i}`, 16, 16);
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, 16, 16);

            ctx.fillStyle = '#8b0000'; // Dark crimson blood

            if (i === 1) {
                // Large splash
                ctx.beginPath();
                ctx.arc(8, 8, 5, 0, Math.PI*2);
                ctx.fill();
                ctx.fillRect(3, 8, 10, 2);
                ctx.fillRect(8, 3, 2, 10);
            } else if (i === 2) {
                // Streak
                ctx.fillRect(2, 6, 12, 3);
                ctx.fillRect(4, 9, 3, 2);
                ctx.fillRect(10, 4, 2, 2);
            } else if (i === 3) {
                // Dotted cluster
                ctx.fillRect(4, 4, 3, 3);
                ctx.fillRect(10, 5, 2, 2);
                ctx.fillRect(7, 9, 4, 3);
            } else {
                // Pool
                ctx.beginPath();
                ctx.arc(8, 8, 6, 0, Math.PI*2);
                ctx.fill();
            }

            canvas.refresh();
        }
    }

    // Explosion animation sheet
    static createExplosionTexture(game, key) {
        const canvas = game.textures.createCanvas('explosion_sheet', 64, 16);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 64, 16);

        // 4 frames of explosion (16x16 each)
        // Frame 1: Small spark
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(8, 8, 4, 0, Math.PI*2);
        ctx.fill();

        // Frame 2: Fire expansion
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(24, 8, 7, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#ff3300';
        ctx.beginPath();
        ctx.arc(24, 8, 4, 0, Math.PI*2);
        ctx.fill();

        // Frame 3: Heavy smoke & embers
        ctx.fillStyle = '#ff5500';
        ctx.beginPath();
        ctx.arc(40, 8, 8, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#555555';
        ctx.beginPath();
        ctx.arc(40, 8, 6, 0, Math.PI*2);
        ctx.fill();

        // Frame 4: Dispersing smoke
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.arc(56, 8, 7, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(56, 8, 4, 0, Math.PI*2);
        ctx.fill();

        canvas.refresh();
    }

    // Light Mask / Flashlight cone
    static createFlashlightTexture(game, key) {
        const canvas = game.textures.createCanvas('flashlight_cone', 128, 128);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 128, 128);

        // Flashlight beam mask: cone from center-left (0, 64) radiating out to the right (128, 64)
        const grad = ctx.createRadialGradient(0, 64, 5, 64, 64, 80);
        grad.addColorStop(0, 'rgba(255, 255, 230, 0.35)');
        grad.addColorStop(0.3, 'rgba(255, 255, 230, 0.18)');
        grad.addColorStop(1, 'rgba(255, 255, 230, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, 60);
        ctx.lineTo(128, 10);
        ctx.lineTo(128, 118);
        ctx.lineTo(0, 68);
        ctx.closePath();
        ctx.fill();

        canvas.refresh();
    }

    // Rain drop texture
    static createRainTexture(game) {
        const canvas = game.textures.createCanvas('rain_drop', 2, 16);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 2, 16);

        const grad = ctx.createLinearGradient(0, 0, 0, 16);
        grad.addColorStop(0, 'rgba(174, 219, 240, 0.05)');
        grad.addColorStop(1, 'rgba(174, 219, 240, 0.35)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 2, 16);

        canvas.refresh();
    }

    // Glass shard
    static createGlassShardTexture(game) {
        const canvas = game.textures.createCanvas('glass_shard', 6, 6);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 6, 6);

        ctx.fillStyle = 'rgba(230, 245, 255, 0.85)';
        ctx.beginPath();
        ctx.moveTo(3, 0);
        ctx.lineTo(6, 3);
        ctx.lineTo(3, 6);
        ctx.lineTo(0, 3);
        ctx.closePath();
        ctx.fill();

        canvas.refresh();
    }

    // Map Floor/Wall Tiles (32x32)
    static createTileTexture(game, key, color1, color2, style) {
        const canvas = game.textures.createCanvas(key, 32, 32);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 32, 32);

        ctx.fillStyle = color1;
        ctx.fillRect(0, 0, 32, 32);

        ctx.fillStyle = color2;
        if (style === 'brick') {
            // Draw brick grid
            ctx.fillRect(0, 0, 32, 1);
            ctx.fillRect(0, 8, 32, 1);
            ctx.fillRect(0, 16, 32, 1);
            ctx.fillRect(0, 24, 32, 1);
            
            ctx.fillRect(0, 0, 1, 8);
            ctx.fillRect(16, 0, 1, 8);
            
            ctx.fillRect(8, 8, 1, 8);
            ctx.fillRect(24, 8, 1, 8);
            
            ctx.fillRect(0, 16, 1, 8);
            ctx.fillRect(16, 16, 1, 8);

            ctx.fillRect(8, 24, 1, 8);
            ctx.fillRect(24, 24, 1, 8);
        } else if (style === 'concrete') {
            // Draw cracks and dirt dots
            ctx.fillRect(4, 4, 2, 2);
            ctx.fillRect(20, 18, 3, 2);
            ctx.fillRect(12, 14, 2, 1);
            // border crack
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(15, 6);
            ctx.lineTo(12, 12);
            ctx.strokeStyle = color2;
            ctx.lineWidth = 1;
            ctx.stroke();
        } else if (style === 'hospital_brick') {
            // Tiled dark brick wall
            ctx.fillRect(0, 0, 32, 2);
            ctx.fillRect(0, 16, 32, 2);
            ctx.fillRect(0, 0, 2, 32);
            ctx.fillRect(16, 0, 2, 32);
        } else if (style === 'tiles') {
            // Square ceramic tiles
            ctx.fillRect(0, 0, 32, 1);
            ctx.fillRect(0, 16, 32, 1);
            ctx.fillRect(16, 0, 1, 32);
            // Dirt on hospital floor
            ctx.fillStyle = 'rgba(139, 0, 0, 0.08)'; // dried blood tint
            ctx.fillRect(2, 6, 8, 8);
        } else if (style === 'metro_tiles') {
            // Subway dirty tiles
            ctx.fillRect(0, 0, 32, 1);
            ctx.fillRect(0, 10, 32, 1);
            ctx.fillRect(0, 20, 32, 1);
            ctx.fillRect(0, 30, 32, 1);
            ctx.fillRect(8, 0, 1, 10);
            ctx.fillRect(24, 0, 1, 10);
            ctx.fillRect(16, 10, 1, 10);
            ctx.fillRect(4, 20, 1, 10);
            ctx.fillRect(20, 20, 1, 10);
        } else if (style === 'concrete_dark') {
            // Dark concrete with lines
            ctx.fillRect(0, 0, 32, 1);
            ctx.fillRect(0, 0, 1, 32);
            ctx.fillRect(8, 8, 2, 2);
            ctx.fillRect(24, 20, 2, 2);
        } else if (style === 'wood_walls') {
            // Vertical planks
            ctx.fillRect(0, 0, 2, 32);
            ctx.fillRect(8, 0, 2, 32);
            ctx.fillRect(16, 0, 2, 32);
            ctx.fillRect(24, 0, 2, 32);
        } else if (style === 'dirt') {
            // Grungy dirt
            for (let d = 0; d < 8; d++) {
                let rx = Math.floor(Math.random() * 28);
                let ry = Math.floor(Math.random() * 28);
                ctx.fillRect(rx, ry, 2, 2);
            }
        } else if (style === 'steel') {
            // Steel plates with bolts
            ctx.fillRect(0, 0, 32, 1);
            ctx.fillRect(0, 0, 1, 32);
            ctx.fillStyle = '#666'; // bolt heads
            ctx.fillRect(3, 3, 2, 2);
            ctx.fillRect(27, 3, 2, 2);
            ctx.fillRect(3, 27, 2, 2);
            ctx.fillRect(27, 27, 2, 2);
        } else if (style === 'grid') {
            // Gridded military floor
            ctx.fillRect(0, 0, 32, 2);
            ctx.fillRect(0, 0, 2, 32);
            ctx.fillRect(0, 8, 32, 1);
            ctx.fillRect(8, 0, 1, 32);
            ctx.fillRect(0, 16, 32, 1);
            ctx.fillRect(16, 0, 1, 32);
            ctx.fillRect(0, 24, 32, 1);
            ctx.fillRect(24, 0, 1, 32);
        } else if (style === 'house_wood') {
            // Clean horizontal planks
            ctx.fillRect(0, 0, 32, 1);
            ctx.fillRect(0, 16, 32, 1);
            ctx.fillRect(10, 0, 1, 16);
            ctx.fillRect(22, 16, 1, 16);
        } else if (style === 'parquet') {
            // Parquet flooring
            ctx.fillRect(0, 0, 32, 1);
            ctx.fillRect(0, 8, 32, 1);
            ctx.fillRect(0, 16, 32, 1);
            ctx.fillRect(0, 24, 32, 1);
            for (let y = 0; y < 32; y += 8) {
                let shift = (y / 8) % 2 === 0 ? 0 : 8;
                ctx.fillRect(8 + shift, y, 1, 8);
                ctx.fillRect(24 + shift, y, 1, 8);
            }
        }

        canvas.refresh();
    }
}
