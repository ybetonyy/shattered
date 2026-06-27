export default class MapLoader {
    static getMapLayout(chapterNum) {
        switch (chapterNum) {
            case 1:
                // Cidade destruída: simple streets, tutorial area
                // Grid: 34 columns x 20 rows
                // W: Wall, P: Player, e: Pistol, m: Melee, x: Exit (Door), p: Pistol pickup on floor
                return [
                    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
                    "W                                W",
                    "W  P        e                 m  W",
                    "W                                W",
                    "W     WWWWWWWW      WWWWWWWWW    W",
                    "W     W      W      W       W    W",
                    "W     W  p   W      W       W    W",
                    "W     W      W      W   e   W    W",
                    "W     WW  WWWW      WWWWWW  W    W",
                    "W                                W",
                    "W                                W",
                    "W         m             e        W",
                    "W     WWWWWWWW      WWWWWWWWWW   W",
                    "W     W      W      W        W   W",
                    "W     W  e   W      W   m    W   W",
                    "W     W      W      W        W   W",
                    "W     WWWWWWWW      WWWWWWWWWW   W",
                    "W   m                        e   W",
                    "W                 e              W",
                    "WWWWWWWWWWWWWWWWWWWWWxWWWWWWWWWWWW"
                ];

            case 2:
                // Hospital Militar: tight clinical wards, hallways, hallucinations (H)
                // Grid: 34 columns x 20 rows
                // H: Hallucination, s: Shotgun, e: Pistol
                return [
                    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
                    "W         W              W       W",
                    "W   P     W   H      H   W   s   W",
                    "W         W              W       W",
                    "W   WW  WWWWWWWWWW    WWWWWWWW   W",
                    "W   W        W               W   W",
                    "W   W   e    W               W   W",
                    "W   W        W               W   W",
                    "W   WWWWWWWWWWWWWW    WWWWWWWW   W",
                    "W                             W  W",
                    "W   WWWWWWWWWWWWWW    WWWW    W  W",
                    "W   W        W           W    W  W",
                    "W   W   H    W    H      W    W  W",
                    "W   W        W           W    W  W",
                    "W   WWWWWWWWWWWWWWWWWWWWWW    W  W",
                    "W                             W  W",
                    "W   WWWWWWWWWWWWWWWWWWWWWWWWWWW  W",
                    "W   W       H        s           W",
                    "W   W                                W",
                    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWxWWW"
                ];

            case 3:
                // Metrô Abandonado: long horizontal railway corridors, pillars (W)
                // Grid: 34 columns x 20 rows
                // r: Rifle, s: Shotgun, e: Pistol, m: Melee, a: Axe pickup
                return [
                    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
                    "W  P                                 W",
                    "W        m               r       W",
                    "W                                W",
                    "W   W    W    W    W    W    W   W",
                    "W   W    W    W    W    W    W   W",
                    "W   W    W    W    W    W    W   W",
                    "W   W    W    W    W    W    W   W",
                    "W                                W",
                    "W        s          e            W",
                    "W                                W",
                    "W   W    W    W    W    W    W   W",
                    "W   W    W    W    W    W    W   W",
                    "W   W    W    W    W    W    W   W",
                    "W   W    W    W    W    W    W   W",
                    "W                                W",
                    "W        r        s        a     W",
                    "W                                W",
                    "W                                W",
                    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWxWWW"
                ];

            case 4:
                // Favela: shacks, open sniper lines (S), rifle soldiers
                // Grid: 34 columns x 20 rows
                // S: Sniper, r: Rifle, s: Shotgun, m: Melee
                return [
                    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
                    "W  P                             W",
                    "W          WWWW                  W",
                    "W          W  W      S           W",
                    "W   r      WWWW                  W",
                    "W                                W",
                    "W    WWWW            WWWWWW      W",
                    "W    W  W            W    W   r  W",
                    "W    WWWW            W s  W      W",
                    "W                    WWWWWW      W",
                    "W                                W",
                    "W   WWWWWW                       W",
                    "W   W    W         S             W",
                    "W   W m  W                       W",
                    "W   WWWWWW      WWWW             W",
                    "W               W  W             W",
                    "W   S           WWWW      r      W",
                    "W                                W",
                    "W                                W",
                    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWxWWW"
                ];

            case 5:
                // Base Militar: concrete defense structures, General Commander Boss (B)
                // Grid: 34 columns x 20 rows
                // B: Boss, r: Rifle, s: Shotgun
                return [
                    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
                    "W  P                             W",
                    "W                                W",
                    "W   WWWWW   WWWWWWWWWW   WWWWW   W",
                    "W   W   W   W        W   W   W   W",
                    "W   W r W   W        W   W r W   W",
                    "W   WWWWW   W        W   WWWWW   W",
                    "W           W        W           W",
                    "W           W    B   W           W",
                    "W     s     W        W     s     W",
                    "W           W        W           W",
                    "W   WWWWW   W        W   WWWWW   W",
                    "W   W   W   W        W   W   W   W",
                    "W   W r W   WWWW  WWWW   W r W   W",
                    "W   WWWWW                WWWWW   W",
                    "W                                W",
                    "W         r            r         W",
                    "W                                W",
                    "W                                W",
                    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWxWWW"
                ];

            case 6:
                // A Casa: Elias's psychological destination. No enemies. Quiet wood floor.
                // Grid: 34 columns x 20 rows
                // P: Player, x: Final memory trigger spot (living room mirror)
                return [
                    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
                    "W                                W",
                    "W   P                            W",
                    "W                                W",
                    "W   WWWWWWWWWWWWWWWWWWWWWWWWWW   W",
                    "W   W                        W   W",
                    "W   W                        W   W",
                    "W   W                        W   W",
                    "W   WW  WWWWWWWWWWWWWWWWWWWWWW   W",
                    "W   W                        W   W",
                    "W   W                        W   W",
                    "W   W                        W   W",
                    "W   WWWWWWWWWWWWWWWWWWWWWW  WW   W",
                    "W   W                        W   W",
                    "W   W                        W   W",
                    "W   W                        W   W",
                    "W   W        WWWWWWWW        W   W",
                    "W   W        W  x   W        W   W",
                    "W            W      W            W",
                    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW"
                ];

            default:
                return [];
        }
    }

    static getTileKeysForChapter(chapterNum) {
        switch (chapterNum) {
            case 1: return { wall: 'tile_wall_city', floor: 'tile_floor_city' };
            case 2: return { wall: 'tile_wall_hospital', floor: 'tile_floor_hospital' };
            case 3: return { wall: 'tile_wall_metro', floor: 'tile_floor_metro' };
            case 4: return { wall: 'tile_wall_favela', floor: 'tile_floor_favela' };
            case 5: return { wall: 'tile_wall_military', floor: 'tile_floor_military' };
            case 6: return { wall: 'tile_wall_home', floor: 'tile_floor_home' };
            default: return { wall: 'tile_wall_city', floor: 'tile_floor_city' };
        }
    }

    static loadMap(scene, chapterNum) {
        const layout = this.getMapLayout(chapterNum);
        const keys = this.getTileKeysForChapter(chapterNum);
        
        let startX = 100;
        let startY = 100;
        let exitSpot = null;
        let enemySpawnCount = 0;

        // Loop grid
        for (let row = 0; row < layout.length; row++) {
            const line = layout[row];
            for (let col = 0; col < line.length; col++) {
                const char = line[col];
                const tx = col * 32 + 16;
                const ty = row * 32 + 16;

                // 1. Draw floor sprite below walls/entities (depth 0)
                const floor = scene.add.sprite(tx, ty, keys.floor);
                floor.setDepth(0);

                if (char === 'W') {
                    // Spawn Static Wall
                    const wall = scene.walls.create(tx, ty, keys.wall);
                    wall.setImmovable(true);
                    wall.body.allowGravity = false;
                    wall.setDepth(2);
                } 
                else if (char === 'P') {
                    // Save player start coordinate
                    startX = tx;
                    startY = ty;
                } 
                else if (char === 'x') {
                    // Spawn exit door/portal zone (only for Chapters 1-5)
                    if (chapterNum !== 6) {
                        exitSpot = scene.physics.add.sprite(tx, ty, 'pickup_knife');
                        exitSpot.setAlpha(0.2); // semi transparent
                        exitSpot.setDepth(1);
                        exitSpot.setTint(0x3bbf3b);
                        
                        // Simple glowing circle around exit
                        scene.add.circle(tx, ty, 16, 0x3bbf3b, 0.15).setDepth(1);
                        
                        scene.physics.add.overlap(scene.player, exitSpot, () => {
                            scene.handleExitReached();
                        });
                    } else {
                        // In Chapter 6, draw a symbolic nursery rug/mirror area instead of exit portal
                        scene.add.circle(tx, ty, 16, 0x8b0000, 0.25).setDepth(1);
                    }
                } 
                // Spawn Weapon pickups
                else if (char === 'p') {
                    scene.spawnDroppedWeapon(tx, ty, 'pistol');
                } 
                else if (char === 'o') {
                    scene.spawnDroppedWeapon(tx, ty, 'revolver');
                } 
                else if (char === 'g') {
                    scene.spawnDroppedWeapon(tx, ty, 'shotgun');
                } 
                else if (char === 'k') {
                    scene.spawnDroppedWeapon(tx, ty, 'rifle');
                } 
                else if (char === 'a') {
                    scene.spawnDroppedWeapon(tx, ty, 'axe');
                } 
                // Spawn Enemies
                else if (char === 'e') {
                    scene.spawnEnemy(tx, ty, 'pistol');
                    enemySpawnCount++;
                } 
                else if (char === 's') {
                    scene.spawnEnemy(tx, ty, 'shotgun');
                    enemySpawnCount++;
                } 
                else if (char === 'r') {
                    scene.spawnEnemy(tx, ty, 'rifle');
                    enemySpawnCount++;
                } 
                else if (char === 'm') {
                    scene.spawnEnemy(tx, ty, 'melee');
                    enemySpawnCount++;
                } 
                else if (char === 'S') {
                    scene.spawnEnemy(tx, ty, 'sniper');
                    enemySpawnCount++;
                } 
                else if (char === 'B') {
                    scene.spawnEnemy(tx, ty, 'boss');
                    enemySpawnCount++;
                } 
                else if (char === 'H') {
                    // Hallucination enemy
                    scene.spawnEnemy(tx, ty, 'melee', true); // melee hallucination
                    enemySpawnCount++;
                }
            }
        }

        return { startX, startY, enemyCount: enemySpawnCount };
    }
}
