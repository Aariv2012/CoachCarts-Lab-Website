/**
 * CoachCartsLab - Interactive 3D Chessboard
 * Powered by Three.js & GSAP
 * Programmatically generated assets with premium hover & tactile effects.
 */

// Global App Config
const CONFIG = {
    tileSize: 1.5,
    boardHeight: 0.15,
    pieceScale: 0.9,
    baseOpacity: 0.85,
    theme: 'cyber', // cyber | obsidian | glass
};

// Theme configurations
const THEMES = {
    cyber: {
        bg: 0x080810,
        fog: 0x080810,
        fogDensity: 0.02,
        lightTile: { color: 0x1e293b, emissive: 0x0f172a, roughness: 0.2, metalness: 0.8, opacity: 0.8 },
        darkTile: { color: 0x020617, emissive: 0x000000, roughness: 0.3, metalness: 0.9, opacity: 0.9 },
        whitePiece: { color: 0x00ffff, emissive: 0x0055ff, emissiveIntensity: 0.55, roughness: 0.15, metalness: 0.45, opacity: 0.95 },
        blackPiece: { color: 0xff00ff, emissive: 0xaa00aa, emissiveIntensity: 0.55, roughness: 0.15, metalness: 0.45, opacity: 0.95 },
        particles: 0x6366f1,
        indicator: 0x10b981,
        ambient: 0x2e2e4f,
        spotlight: 0xffffff
    },
    obsidian: {
        bg: 0x0c0a06,
        fog: 0x0c0a06,
        fogDensity: 0.025,
        lightTile: { color: 0xd97706, emissive: 0x78350f, roughness: 0.1, metalness: 0.9, opacity: 0.9 }, // Gold
        darkTile: { color: 0x111111, emissive: 0x050505, roughness: 0.05, metalness: 0.95, opacity: 0.95 }, // Obsidian
        whitePiece: { color: 0xfef08a, emissive: 0xb45309, emissiveIntensity: 0.35, roughness: 0.08, metalness: 0.95, opacity: 0.98 }, // Warm Gold
        blackPiece: { color: 0xe2e8f0, emissive: 0x334155, emissiveIntensity: 0.15, roughness: 0.04, metalness: 0.98, opacity: 0.98 }, // Chrome/Silver
        particles: 0xf59e0b,
        indicator: 0xef4444,
        ambient: 0x221e1a,
        spotlight: 0xfff9e6
    },
    glass: {
        bg: 0x0b131a,
        fog: 0x0b131a,
        fogDensity: 0.015,
        lightTile: { color: 0xe0f2fe, emissive: 0xbae6fd, roughness: 0.1, metalness: 0.1, opacity: 0.65 },
        darkTile: { color: 0x0c4a6e, emissive: 0x075985, roughness: 0.2, metalness: 0.2, opacity: 0.75 },
        whitePiece: { color: 0x99f6e4, emissive: 0x0d9488, emissiveIntensity: 0.45, roughness: 0.05, metalness: 0.15, opacity: 0.9 }, // Teal glass
        blackPiece: { color: 0x86efac, emissive: 0x166534, emissiveIntensity: 0.35, roughness: 0.05, metalness: 0.15, opacity: 0.9 }, // Emerald glass
        particles: 0x38bdf8,
        indicator: 0xeab308,
        ambient: 0x1a2e3b,
        spotlight: 0xe0f7fa
    }
};

class Chess3D {
    constructor() {
        this.container = document.getElementById('canvas-container');
        if (!this.container) return;

        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        this.pieces = []; // Active 3D chess pieces
        this.tiles = [];  // Grid square objects
        this.indicatorPool = []; // Glowing move helper rings
        this.particleSystems = [];
        this.hoveredPiece = null;
        this.selectedPiece = null;
        this.mouse = new THREE.Vector2();
        this.targetMouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.gameState = Array(8).fill(null).map(() => Array(8).fill(null)); // 8x8 tracking board

        this.initThree();
        this.initLights();
        this.initBoard();
        this.initPieces();
        this.initMoveIndicators();
        this.initParticles();
        this.initEvents();
        this.animate();

        // Trigger resize once to lay out correctly
        this.onWindowResize();
    }

    initThree() {
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.container.appendChild(this.renderer.domElement);

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(THEMES[CONFIG.theme].bg);
        this.scene.fog = new THREE.FogExp2(THEMES[CONFIG.theme].fog, THEMES[CONFIG.theme].fogDensity);

        // Camera
        this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 0.1, 100);
        this.camera.position.set(0, 10, 13);
        this.camera.lookAt(0, 0, 0);

        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2.1; // Don't go below the floor
        this.controls.minDistance = 6;
        this.controls.maxDistance = 25;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.5;
        this.controls.enablePan = false;
    }

    initLights() {
        // Ambient Light - lower to enhance contrast
        this.ambientLight = new THREE.AmbientLight(THEMES[CONFIG.theme].ambient, 0.7);
        this.scene.add(this.ambientLight);

        // Main SpotLight from above-center
        this.spotLight = new THREE.SpotLight(THEMES[CONFIG.theme].spotlight, 3.5);
        this.spotLight.position.set(0, 15, 2);
        this.spotLight.angle = Math.PI / 3.5;
        this.spotLight.penumbra = 0.9;
        this.spotLight.castShadow = true;
        this.spotLight.shadow.mapSize.width = 2048; // Increase shadow resolution for sharper details!
        this.spotLight.shadow.mapSize.height = 2048;
        this.spotLight.shadow.camera.near = 5;
        this.spotLight.shadow.camera.far = 25;
        this.spotLight.shadow.bias = -0.0005;
        this.scene.add(this.spotLight);

        // Key Front Light (shining on the pieces facing the camera)
        this.frontLight = new THREE.DirectionalLight(0xffffff, 2.2);
        this.frontLight.position.set(3, 10, 10);
        this.frontLight.castShadow = true;
        this.frontLight.shadow.mapSize.width = 1024;
        this.frontLight.shadow.mapSize.height = 1024;
        this.frontLight.shadow.bias = -0.0005;
        this.scene.add(this.frontLight);

        // Soft fill light from the back-left
        this.fillLight = new THREE.DirectionalLight(0x818cf8, 1.0);
        this.fillLight.position.set(-6, 5, -5);
        this.scene.add(this.fillLight);
    }

    // Geometry Generation Helper
    getPieceGeometry(type) {
        let geom;
        const segments = 24;

        // Base profile shared by all pieces except knight base
        const getBasePoints = (width) => [
            new THREE.Vector2(0, 0),
            new THREE.Vector2(width, 0),
            new THREE.Vector2(width, 0.08),
            new THREE.Vector2(width * 0.9, 0.12),
            new THREE.Vector2(width * 0.78, 0.15)
        ];

        switch (type) {
            case 'pawn': {
                const pts = [
                    ...getBasePoints(0.42),
                    new THREE.Vector2(0.24, 0.15),
                    new THREE.Vector2(0.18, 0.35),
                    new THREE.Vector2(0.15, 0.55),
                    new THREE.Vector2(0.23, 0.58),
                    new THREE.Vector2(0.23, 0.62),
                    new THREE.Vector2(0.15, 0.65),
                    new THREE.Vector2(0.15, 0.70),
                    new THREE.Vector2(0.24, 0.78),
                    new THREE.Vector2(0.24, 0.88),
                    new THREE.Vector2(0.15, 0.96),
                    new THREE.Vector2(0, 1.0)
                ];
                geom = new THREE.LatheGeometry(pts, segments);
                break;
            }
            case 'rook': {
                const pts = [
                    ...getBasePoints(0.46),
                    new THREE.Vector2(0.28, 0.15),
                    new THREE.Vector2(0.28, 0.75),
                    new THREE.Vector2(0.38, 0.82),
                    new THREE.Vector2(0.40, 1.05),
                    new THREE.Vector2(0.26, 1.05),
                    new THREE.Vector2(0.26, 0.85),
                    new THREE.Vector2(0, 0.85)
                ];
                geom = new THREE.LatheGeometry(pts, segments);
                break;
            }
            case 'bishop': {
                const pts = [
                    ...getBasePoints(0.45),
                    new THREE.Vector2(0.25, 0.15),
                    new THREE.Vector2(0.20, 0.45),
                    new THREE.Vector2(0.28, 0.48),
                    new THREE.Vector2(0.28, 0.52),
                    new THREE.Vector2(0.18, 0.55),
                    new THREE.Vector2(0.18, 0.60),
                    new THREE.Vector2(0.30, 0.82),
                    new THREE.Vector2(0.30, 1.05),
                    new THREE.Vector2(0.15, 1.25),
                    new THREE.Vector2(0, 1.30)
                ];
                geom = new THREE.LatheGeometry(pts, segments);
                break;
            }
            case 'knight': {
                // Extruded path for stylized horse
                const shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.lineTo(0.38, 0);
                shape.lineTo(0.38, 0.15);
                shape.lineTo(0.28, 0.35); // neck back curve
                shape.lineTo(0.24, 0.55); // back
                shape.lineTo(0.38, 0.60); // mane
                shape.lineTo(0.32, 0.75); // ears back
                shape.lineTo(0.26, 1.15); // ear tip 1
                shape.lineTo(0.18, 1.15); // ear notch
                shape.lineTo(0.14, 1.08); // ear tip 2
                shape.lineTo(0.10, 0.95); // head front
                shape.lineTo(-0.15, 0.85); // snout top
                shape.lineTo(-0.24, 0.65); // nose tip
                shape.lineTo(-0.18, 0.52); // mouth bottom
                shape.lineTo(-0.06, 0.48); // jaw bottom
                shape.lineTo(0, 0);

                const extrudeSettings = {
                    depth: 0.35, // thicker extrude for better 3D visibility
                    bevelEnabled: true,
                    bevelThickness: 0.05,
                    bevelSize: 0.03,
                    bevelSegments: 4
                };

                const extGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                extGeom.center();
                extGeom.translate(0, 0.65, 0); // lift up
                extGeom.rotateY(Math.PI / 2); // orient forward

                // Add a round cylinder base
                const baseGeom = new THREE.CylinderGeometry(0.42, 0.46, 0.20, segments);
                baseGeom.translate(0, 0.10, 0);

                return { extGeom, baseGeom };
            }
            case 'queen': {
                const pts = [
                    ...getBasePoints(0.48),
                    new THREE.Vector2(0.25, 0.15),
                    new THREE.Vector2(0.20, 0.65),
                    new THREE.Vector2(0.30, 0.68),
                    new THREE.Vector2(0.30, 0.72),
                    new THREE.Vector2(0.20, 0.75),
                    new THREE.Vector2(0.20, 0.80),
                    new THREE.Vector2(0.35, 1.15),
                    new THREE.Vector2(0.42, 1.35),
                    new THREE.Vector2(0.22, 1.35),
                    new THREE.Vector2(0.12, 1.15),
                    new THREE.Vector2(0, 1.22)
                ];
                geom = new THREE.LatheGeometry(pts, segments);
                break;
            }
            case 'king': {
                const pts = [
                    ...getBasePoints(0.50),
                    new THREE.Vector2(0.26, 0.15),
                    new THREE.Vector2(0.22, 0.75),
                    new THREE.Vector2(0.32, 0.78),
                    new THREE.Vector2(0.32, 0.82),
                    new THREE.Vector2(0.22, 0.85),
                    new THREE.Vector2(0.22, 0.90),
                    new THREE.Vector2(0.36, 1.18),
                    new THREE.Vector2(0.36, 1.45),
                    new THREE.Vector2(0.18, 1.48),
                    new THREE.Vector2(0, 1.50)
                ];
                geom = new THREE.LatheGeometry(pts, segments);
                break;
            }
        }
        return geom;
    }

    // High level piece constructor wrapping geometries
    createPieceMesh(type, side) {
        const isWhite = side === 'white';
        const matConfig = isWhite ? THEMES[CONFIG.theme].whitePiece : THEMES[CONFIG.theme].blackPiece;

        // Custom shader/physical material for premium look
        const pieceMaterial = new THREE.MeshPhysicalMaterial({
            color: matConfig.color,
            emissive: matConfig.emissive,
            emissiveIntensity: matConfig.emissiveIntensity,
            roughness: matConfig.roughness,
            metalness: matConfig.metalness,
            transparent: true,
            opacity: matConfig.opacity,
            transmission: CONFIG.theme === 'glass' ? 0.6 : 0.0,
            thickness: CONFIG.theme === 'glass' ? 1.0 : 0.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            side: THREE.DoubleSide
        });

        // Glowing wireframe overlay for futuristic cyber aesthetics
        const wireframeMat = new THREE.MeshBasicMaterial({
            color: matConfig.color,
            wireframe: true,
            transparent: true,
            opacity: CONFIG.theme === 'cyber' ? 0.15 : 0.04
        });

        const pieceGroup = new THREE.Group();

        if (type === 'knight') {
            const geoms = this.getPieceGeometry('knight');
            const baseMesh = new THREE.Mesh(geoms.baseGeom, pieceMaterial);
            baseMesh.castShadow = true;
            baseMesh.receiveShadow = true;
            pieceGroup.add(baseMesh);

            const baseWire = new THREE.Mesh(geoms.baseGeom, wireframeMat);
            pieceGroup.add(baseWire);

            const horseMesh = new THREE.Mesh(geoms.extGeom, pieceMaterial);
            horseMesh.castShadow = true;
            horseMesh.receiveShadow = true;
            pieceGroup.add(horseMesh);

            const horseWire = new THREE.Mesh(geoms.extGeom, wireframeMat);
            pieceGroup.add(horseWire);
        } else {
            let geom = this.getPieceGeometry(type);

            // Separate handling for merged ball on bishop
            let extraMesh = null;
            if (type === 'bishop') {
                const ballGeom = new THREE.SphereGeometry(0.08, 12, 12);
                ballGeom.translate(0, 1.36, 0);
                extraMesh = new THREE.Mesh(ballGeom, pieceMaterial);
                extraMesh.castShadow = true;
                pieceGroup.add(extraMesh);
                pieceGroup.add(new THREE.Mesh(ballGeom, wireframeMat));
            } else if (type === 'king') {
                // Cross attachment
                const crossVert = new THREE.BoxGeometry(0.07, 0.25, 0.07);
                crossVert.translate(0, 1.63, 0);
                const crossHoriz = new THREE.BoxGeometry(0.2, 0.07, 0.07);
                crossHoriz.translate(0, 1.68, 0);

                const cross1 = new THREE.Mesh(crossVert, pieceMaterial);
                const cross2 = new THREE.Mesh(crossHoriz, pieceMaterial);
                cross1.castShadow = true;
                cross2.castShadow = true;
                pieceGroup.add(cross1, cross2);
            } else if (type === 'queen') {
                // Crown jewel ball
                const crownJewel = new THREE.SphereGeometry(0.08, 10, 10);
                crownJewel.translate(0, 1.31, 0);
                const jewelMesh = new THREE.Mesh(crownJewel, pieceMaterial);
                jewelMesh.castShadow = true;
                pieceGroup.add(jewelMesh);
            }

            const mainMesh = new THREE.Mesh(geom, pieceMaterial);
            mainMesh.castShadow = true;
            mainMesh.receiveShadow = true;
            pieceGroup.add(mainMesh);

            const wireMesh = new THREE.Mesh(geom, wireframeMat);
            pieceGroup.add(wireMesh);
        }

        pieceGroup.scale.set(CONFIG.pieceScale, CONFIG.pieceScale, CONFIG.pieceScale);

        // Custom fields for logic
        pieceGroup.userData = {
            type: type,
            side: side,
            isPiece: true,
            baseY: 0,
            gridX: 0,
            gridZ: 0,
            isRotating: false,
            rotationSpeed: 0
        };

        // Align knights facing correct directions
        if (type === 'knight') {
            pieceGroup.rotation.y = isWhite ? 0 : Math.PI;
        }

        return pieceGroup;
    }

    initBoard() {
        const boardGroup = new THREE.Group();
        const tSize = CONFIG.tileSize;

        // Base Board Plinth (Outer frame)
        const frameWidth = tSize * 8 + 0.6;
        const frameGeom = new THREE.BoxGeometry(frameWidth, CONFIG.boardHeight, frameWidth);
        const frameMat = new THREE.MeshPhysicalMaterial({
            color: 0x09090e,
            roughness: 0.1,
            metalness: 0.9,
            clearcoat: 1.0
        });
        const frame = new THREE.Mesh(frameGeom, frameMat);
        frame.position.y = -CONFIG.boardHeight / 2 - 0.01;
        frame.receiveShadow = true;
        boardGroup.add(frame);

        // Neon border piping for Cyber style
        if (CONFIG.theme === 'cyber') {
            const pipeGeom = new THREE.BoxGeometry(frameWidth + 0.08, 0.04, frameWidth + 0.08);
            const pipeMat = new THREE.MeshBasicMaterial({ color: 0x6366f1 });
            const pipe = new THREE.Mesh(pipeGeom, pipeMat);
            pipe.position.y = -0.01;
            boardGroup.add(pipe);
        }

        // Layout Tiles
        const themeConfig = THEMES[CONFIG.theme];
        const tileGeom = new THREE.BoxGeometry(tSize, CONFIG.boardHeight, tSize);

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const isLight = (r + c) % 2 === 0;
                const mConf = isLight ? themeConfig.lightTile : themeConfig.darkTile;

                const tileMat = new THREE.MeshStandardMaterial({
                    color: mConf.color,
                    emissive: mConf.emissive || 0x000000,
                    roughness: mConf.roughness,
                    metalness: mConf.metalness,
                    transparent: true,
                    opacity: mConf.opacity
                });

                const tile = new THREE.Mesh(tileGeom, tileMat);

                // Position on XZ plane centered
                const xPos = (c - 3.5) * tSize;
                const zPos = (r - 3.5) * tSize;
                tile.position.set(xPos, -CONFIG.boardHeight / 2, zPos);
                tile.receiveShadow = true;

                // User data references
                tile.userData = {
                    row: r,
                    col: c,
                    isTile: true,
                    isLight: isLight,
                    baseY: -CONFIG.boardHeight / 2,
                    highlightColor: mConf.color
                };

                boardGroup.add(tile);
                this.tiles.push(tile);
            }
        }

        this.scene.add(boardGroup);
    }

    initPieces() {
        const layout = [
            ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'], // Row 0 (White major)
            Array(8).fill('pawn'),                                                   // Row 1 (White pawn)
            Array(8).fill(null),                                                     // Row 2
            Array(8).fill(null),                                                     // Row 3
            Array(8).fill(null),                                                     // Row 4
            Array(8).fill(null),                                                     // Row 5
            Array(8).fill('pawn'),                                                   // Row 6 (Black pawn)
            ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']  // Row 7 (Black major)
        ];

        const tSize = CONFIG.tileSize;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const type = layout[r][c];
                if (!type) continue;

                const side = r < 2 ? 'white' : 'black';
                const piece = this.createPieceMesh(type, side);

                // Position on board
                const xPos = (c - 3.5) * tSize;
                const zPos = (r - 3.5) * tSize;
                piece.position.set(xPos, 0, zPos);

                piece.userData.gridX = c;
                piece.userData.gridZ = r;

                this.scene.add(piece);
                this.pieces.push(piece);
                this.gameState[r][c] = piece;
            }
        }
    }

    initMoveIndicators() {
        // Build 20 move indicator rings in pool to show legal targets
        const ringGeom = new THREE.RingGeometry(0.45, 0.55, 32);
        ringGeom.rotateX(-Math.PI / 2); // Flat on board

        const indicatorMat = new THREE.MeshBasicMaterial({
            color: THEMES[CONFIG.theme].indicator,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0
        });

        for (let i = 0; i < 24; i++) {
            const mesh = new THREE.Mesh(ringGeom, indicatorMat.clone());
            mesh.position.set(0, 0.02, 0); // Slightly above tiles
            mesh.scale.set(0.001, 0.001, 0.001);
            mesh.userData = { active: false, row: -1, col: -1 };
            this.scene.add(mesh);
            this.indicatorPool.push(mesh);
        }
    }

    initParticles() {
        // Floating cyber space dust
        const particleCount = 120;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const speeds = [];

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 20;     // X
            positions[i + 1] = Math.random() * 6 + 0.1;    // Y
            positions[i + 2] = (Math.random() - 0.5) * 20; // Z

            speeds.push({
                y: Math.random() * 0.01 + 0.003,
                x: (Math.random() - 0.5) * 0.005,
                z: (Math.random() - 0.5) * 0.005
            });
        }

        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const mat = new THREE.PointsMaterial({
            color: THEMES[CONFIG.theme].particles,
            size: 0.08,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        this.ambientParticles = new THREE.Points(geom, mat);
        this.ambientParticles.userData = { speeds: speeds };
        this.scene.add(this.ambientParticles);
    }

    // Trigger local particle blast on move landings
    spawnImpactParticles(pos) {
        const count = 30;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];

        for (let i = 0; i < count; i++) {
            const pIdx = i * 3;
            positions[pIdx] = pos.x;
            positions[pIdx + 1] = pos.y + 0.1;
            positions[pIdx + 2] = pos.z;

            // Sphere explosion vector
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 0.08 + 0.04;
            const upwardForce = Math.random() * 0.08 + 0.05;

            velocities.push({
                x: Math.cos(angle) * speed,
                y: upwardForce,
                z: Math.sin(angle) * speed,
                gravity: 0.003
            });
        }

        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: THEMES[CONFIG.theme].indicator,
            size: 0.1,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });

        const blast = new THREE.Points(geom, mat);
        blast.userData = { velocities: velocities, age: 0, maxAge: 50 };
        this.scene.add(blast);
        this.particleSystems.push(blast);
    }

    spawnShockwave(pos) {
        // Shockwave disc expanding flatly
        const ringGeom = new THREE.RingGeometry(0.01, 0.8, 32);
        ringGeom.rotateX(-Math.PI / 2);

        const ringMat = new THREE.MeshBasicMaterial({
            color: THEMES[CONFIG.theme].indicator,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });

        const wave = new THREE.Mesh(ringGeom, ringMat);
        wave.position.copy(pos);
        wave.position.y = 0.03;
        this.scene.add(wave);

        gsap.to(wave.scale, {
            x: 2.5,
            z: 2.5,
            duration: 0.8,
            ease: "power2.out"
        });

        gsap.to(ringMat, {
            opacity: 0,
            duration: 0.8,
            ease: "power2.out",
            onComplete: () => {
                this.scene.remove(wave);
                ringGeom.dispose();
                ringMat.dispose();
            }
        });
    }

    // Interactive Chess Move Logic (Subsets to keep code clean and fast)
    calculateLegalMoves(piece) {
        const moves = [];
        const r = piece.userData.gridZ;
        const c = piece.userData.gridX;
        const side = piece.userData.side;
        const type = piece.userData.type;

        const isOccupied = (row, col) => {
            if (row < 0 || row > 7 || col < 0 || col > 7) return 'out';
            const occupier = this.gameState[row][col];
            if (!occupier) return null;
            return occupier.userData.side === side ? 'ally' : 'enemy';
        };

        if (type === 'pawn') {
            const dir = side === 'white' ? 1 : -1;
            const startRow = side === 'white' ? 1 : 6;

            // Forward 1
            if (isOccupied(r + dir, c) === null) {
                moves.push({ r: r + dir, c: c });
                // Forward 2
                if (r === startRow && isOccupied(r + dir * 2, c) === null) {
                    moves.push({ r: r + dir * 2, c: c });
                }
            }
            // Captures (Diagonal)
            if (isOccupied(r + dir, c - 1) === 'enemy') moves.push({ r: r + dir, c: c - 1 });
            if (isOccupied(r + dir, c + 1) === 'enemy') moves.push({ r: r + dir, c: c + 1 });

        } else if (type === 'knight') {
            const offsets = [
                [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                [1, -2], [1, 2], [2, -1], [2, 1]
            ];
            offsets.forEach(([dr, dc]) => {
                const state = isOccupied(r + dr, c + dc);
                if (state !== 'out' && state !== 'ally') {
                    moves.push({ r: r + dr, c: c + dc });
                }
            });

        } else if (type === 'bishop' || type === 'rook' || type === 'queen') {
            const directions = [];
            if (type === 'rook' || type === 'queen') {
                directions.push([1, 0], [-1, 0], [0, 1], [0, -1]);
            }
            if (type === 'bishop' || type === 'queen') {
                directions.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
            }

            directions.forEach(([dr, dc]) => {
                let step = 1;
                while (true) {
                    const nr = r + dr * step;
                    const nc = c + dc * step;
                    const state = isOccupied(nr, nc);

                    if (state === 'out') break;
                    if (state === 'ally') break;

                    moves.push({ r: nr, c: nc });

                    if (state === 'enemy') break; // block sliding after capture
                    step++;
                }
            });

        } else if (type === 'king') {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const state = isOccupied(r + dr, c + dc);
                    if (state !== 'out' && state !== 'ally') {
                        moves.push({ r: r + dr, c: c + dc });
                    }
                }
            }
        }

        return moves;
    }

    showMoveIndicators(piece) {
        this.hideMoveIndicators();

        const moves = this.calculateLegalMoves(piece);
        const tSize = CONFIG.tileSize;

        moves.forEach((move, idx) => {
            if (idx >= this.indicatorPool.length) return;
            const ring = this.indicatorPool[idx];

            const xPos = (move.c - 3.5) * tSize;
            const zPos = (move.r - 3.5) * tSize;

            ring.position.set(xPos, 0.02, zPos);
            ring.userData.active = true;
            ring.userData.row = move.r;
            ring.userData.col = move.c;

            // Animate ring display
            gsap.killTweensOf(ring.scale);
            gsap.killTweensOf(ring.material);
            ring.scale.set(0.1, 0.1, 0.1);
            ring.material.opacity = 0;

            gsap.to(ring.scale, { x: 1.0, z: 1.0, duration: 0.35, ease: "back.out(1.7)" });
            gsap.to(ring.material, { opacity: 0.8, duration: 0.25 });
        });
    }

    hideMoveIndicators() {
        this.indicatorPool.forEach(ring => {
            if (ring.userData.active) {
                ring.userData.active = false;
                gsap.to(ring.scale, {
                    x: 0.001, z: 0.001, duration: 0.2, ease: "power2.in",
                    onComplete: () => {
                        ring.position.set(0, -1, 0);
                    }
                });
                gsap.to(ring.material, { opacity: 0, duration: 0.2 });
            }
        });
    }

    // Touch & Hover sensory logic
    handleHover(intersected) {
        if (intersected) {
            // Hovering a piece
            if (intersected.userData.isPiece) {
                if (this.hoveredPiece !== intersected) {
                    // Reset previous hover
                    this.resetHoverState();

                    // Lock hover on selection
                    if (this.selectedPiece === intersected) return;

                    this.hoveredPiece = intersected;

                    // Hover animation: Float up + spin
                    gsap.to(this.hoveredPiece.position, {
                        y: 0.6,
                        duration: 0.3,
                        ease: "power2.out"
                    });

                    this.hoveredPiece.userData.isRotating = true;
                    this.hoveredPiece.userData.rotationSpeed = 0.015;

                    // Pulse glow based on piece side
                    const side = this.hoveredPiece.userData.side;
                    const baseE = side === 'white' ?
                        THEMES[CONFIG.theme].whitePiece.emissiveIntensity : THEMES[CONFIG.theme].blackPiece.emissiveIntensity;

                    this.hoveredPiece.children.forEach(mesh => {
                        if (mesh.material && mesh.material.emissiveIntensity !== undefined) {
                            gsap.to(mesh.material, {
                                emissiveIntensity: baseE * 2.2, // Make it pop clearly on hover
                                duration: 0.2
                            });
                        }
                    });

                    // Highlight moves on hover
                    if (!this.selectedPiece) {
                        this.showMoveIndicators(this.hoveredPiece);
                    }
                }
            } else {
                // Hovered empty tile or other
                if (!this.selectedPiece) {
                    this.resetHoverState();
                }
            }
        } else {
            // Hovered nothing
            if (!this.selectedPiece) {
                this.resetHoverState();
            }
        }
    }

    resetHoverState() {
        if (this.hoveredPiece && this.hoveredPiece !== this.selectedPiece) {
            const baseE = this.hoveredPiece.userData.side === 'white' ?
                THEMES[CONFIG.theme].whitePiece.emissiveIntensity : THEMES[CONFIG.theme].blackPiece.emissiveIntensity;

            gsap.to(this.hoveredPiece.position, {
                y: 0,
                duration: 0.25,
                ease: "power2.inOut"
            });

            this.hoveredPiece.userData.isRotating = false;

            // Slowly slide rotation back to default orientation
            const targetRot = this.hoveredPiece.userData.type === 'knight' ?
                (this.hoveredPiece.userData.side === 'white' ? 0 : Math.PI) : 0;

            gsap.to(this.hoveredPiece.rotation, {
                y: targetRot,
                duration: 0.3
            });

            this.hoveredPiece.children.forEach(mesh => {
                if (mesh.material && mesh.material.emissiveIntensity !== undefined) {
                    gsap.to(mesh.material, {
                        emissiveIntensity: baseE,
                        duration: 0.25
                    });
                }
            });

            this.hoveredPiece = null;

            if (!this.selectedPiece) {
                this.hideMoveIndicators();
            }
        }
    }

    // Select piece on click
    selectPiece(piece) {
        if (this.selectedPiece) {
            this.deselectPiece();
        }

        this.selectedPiece = piece;
        this.showMoveIndicators(piece);

        // Highlight selection: float higher + spin faster
        gsap.to(this.selectedPiece.position, {
            y: 0.8,
            duration: 0.3,
            ease: "back.out(1.5)"
        });
        this.selectedPiece.userData.isRotating = true;
        this.selectedPiece.userData.rotationSpeed = 0.04;

        this.controls.autoRotate = false; // Stop rotating camera during actions
    }

    deselectPiece() {
        if (!this.selectedPiece) return;

        const piece = this.selectedPiece;
        this.selectedPiece = null;

        // Animate piece back down (if not hovered)
        if (this.hoveredPiece !== piece) {
            gsap.to(piece.position, {
                y: 0,
                duration: 0.25,
                ease: "power2.inOut"
            });
            piece.userData.isRotating = false;

            const targetRot = piece.userData.type === 'knight' ?
                (piece.userData.side === 'white' ? 0 : Math.PI) : 0;

            gsap.to(piece.rotation, {
                y: targetRot,
                duration: 0.3
            });
        } else {
            // Return to normal hover height
            gsap.to(piece.position, {
                y: 0.6,
                duration: 0.25
            });
            piece.userData.rotationSpeed = 0.015;
        }

        // Restore normal glow
        const baseE = piece.userData.side === 'white' ?
            THEMES[CONFIG.theme].whitePiece.emissiveIntensity : THEMES[CONFIG.theme].blackPiece.emissiveIntensity;

        piece.children.forEach(mesh => {
            if (mesh.material && mesh.material.emissiveIntensity !== undefined) {
                gsap.to(mesh.material, {
                    emissiveIntensity: baseE,
                    duration: 0.25
                });
            }
        });

        this.hideMoveIndicators();

        // Resume auto camera rotation after delay
        setTimeout(() => {
            if (!this.selectedPiece) this.controls.autoRotate = true;
        }, 8000);
    }

    // Move Selected Piece to Square
    movePieceTo(piece, row, col) {
        const oldRow = piece.userData.gridZ;
        const oldCol = piece.userData.gridX;

        const tSize = CONFIG.tileSize;
        const targetX = (col - 3.5) * tSize;
        const targetZ = (row - 3.5) * tSize;

        // Clear grid positions
        this.gameState[oldRow][oldCol] = null;

        // Capture logic
        const targetOccupier = this.gameState[row][col];
        if (targetOccupier) {
            // Animate capture (explode and remove)
            const capturePos = targetOccupier.position.clone();
            this.spawnImpactParticles(capturePos);

            gsap.to(targetOccupier.scale, {
                x: 0.001, y: 0.001, z: 0.001,
                duration: 0.3,
                onComplete: () => {
                    this.scene.remove(targetOccupier);
                    const idx = this.pieces.indexOf(targetOccupier);
                    if (idx > -1) this.pieces.splice(idx, 1);
                }
            });
        }

        // Apply new grid coordinate mapping
        this.gameState[row][col] = piece;
        piece.userData.gridX = col;
        piece.userData.gridZ = row;

        // Temporary lock hover/select state
        this.selectedPiece = null;
        this.hoveredPiece = null;
        this.hideMoveIndicators();

        // Parabolic Leap Animation Path (GSAP)
        const leapTimeline = gsap.timeline({
            onComplete: () => {
                piece.position.y = 0;
                piece.userData.isRotating = false;

                const finalRot = piece.userData.type === 'knight' ?
                    (piece.userData.side === 'white' ? 0 : Math.PI) : 0;
                gsap.to(piece.rotation, { y: finalRot, duration: 0.2 });

                // Land impact effects
                const landingPos = new THREE.Vector3(targetX, 0, targetZ);
                this.spawnImpactParticles(landingPos);
                this.spawnShockwave(landingPos);

                // Small screen camera shake
                this.shakeCamera();

                // Resume auto-rotate camera
                setTimeout(() => {
                    if (!this.selectedPiece) this.controls.autoRotate = true;
                }, 4000);
            }
        });

        // Jump height and lateral movements
        leapTimeline.to(piece.position, {
            y: 2.2,
            x: (piece.position.x + targetX) / 2,
            z: (piece.position.z + targetZ) / 2,
            duration: 0.35,
            ease: "power2.out"
        });

        leapTimeline.to(piece.position, {
            y: 0,
            x: targetX,
            z: targetZ,
            duration: 0.35,
            ease: "power2.in"
        });

        // Rotate piece during leap
        gsap.to(piece.rotation, {
            y: piece.rotation.y + Math.PI,
            duration: 0.7,
            ease: "power1.inOut"
        });
    }

    shakeCamera() {
        const originalPos = this.camera.position.clone();
        const range = 0.08;

        gsap.timeline()
            .to(this.camera.position, { x: originalPos.x + (Math.random() - 0.5) * range, y: originalPos.y + (Math.random() - 0.5) * range, duration: 0.05 })
            .to(this.camera.position, { x: originalPos.x + (Math.random() - 0.5) * range, y: originalPos.y + (Math.random() - 0.5) * range, duration: 0.05 })
            .to(this.camera.position, { x: originalPos.x + (Math.random() - 0.5) * range, y: originalPos.y + (Math.random() - 0.5) * range, duration: 0.05 })
            .to(this.camera.position, { x: originalPos.x, y: originalPos.y, z: originalPos.z, duration: 0.05 });
    }

    // Set Theme Action
    setTheme(themeName) {
        if (!THEMES[themeName]) return;
        CONFIG.theme = themeName;

        const config = THEMES[themeName];

        // Animate scene colors
        gsap.to(this.scene.background, {
            r: new THREE.Color(config.bg).r,
            g: new THREE.Color(config.bg).g,
            b: new THREE.Color(config.bg).b,
            duration: 0.8
        });

        gsap.to(this.scene.fog, {
            color: new THREE.Color(config.fog),
            density: config.fogDensity,
            duration: 0.8
        });

        // Lighting colors
        gsap.to(this.ambientLight.color, {
            r: new THREE.Color(config.ambient).r,
            g: new THREE.Color(config.ambient).g,
            b: new THREE.Color(config.ambient).b,
            duration: 0.8
        });

        gsap.to(this.spotLight.color, {
            r: new THREE.Color(config.spotlight).r,
            g: new THREE.Color(config.spotlight).g,
            b: new THREE.Color(config.spotlight).b,
            duration: 0.8
        });

        // Animate front key light intensity to fit the theme
        let frontIntensity = 2.2;
        if (themeName === 'obsidian') frontIntensity = 3.0;
        if (themeName === 'cyber') frontIntensity = 2.0;
        gsap.to(this.frontLight, {
            intensity: frontIntensity,
            duration: 0.8
        });

        // Update grid tiles materials
        this.tiles.forEach(tile => {
            const isLight = tile.userData.isLight;
            const mConf = isLight ? config.lightTile : config.darkTile;

            gsap.to(tile.material.color, { r: new THREE.Color(mConf.color).r, g: new THREE.Color(mConf.color).g, b: new THREE.Color(mConf.color).b, duration: 0.8 });
            gsap.to(tile.material.emissive, { r: new THREE.Color(mConf.emissive || 0).r, g: new THREE.Color(mConf.emissive || 0).g, b: new THREE.Color(mConf.emissive || 0).b, duration: 0.8 });
            tile.material.roughness = mConf.roughness;
            tile.material.metalness = mConf.metalness;
            tile.material.opacity = mConf.opacity;
        });

        // Update active pieces materials
        this.pieces.forEach(piece => {
            const isWhite = piece.userData.side === 'white';
            const mConf = isWhite ? config.whitePiece : config.blackPiece;

            piece.children.forEach(mesh => {
                if (mesh.material) {
                    if (mesh.material.wireframe) {
                        mesh.material.color.setHex(mConf.color);
                        mesh.material.opacity = themeName === 'cyber' ? 0.15 : 0.04;
                    } else {
                        gsap.to(mesh.material.color, { r: new THREE.Color(mConf.color).r, g: new THREE.Color(mConf.color).g, b: new THREE.Color(mConf.color).b, duration: 0.8 });
                        gsap.to(mesh.material.emissive, { r: new THREE.Color(mConf.emissive).r, g: new THREE.Color(mConf.emissive).g, b: new THREE.Color(mConf.emissive).b, duration: 0.8 });
                        mesh.material.emissiveIntensity = mConf.emissiveIntensity;
                        mesh.material.roughness = mConf.roughness;
                        mesh.material.metalness = mConf.metalness;
                        mesh.material.opacity = mConf.opacity;
                        mesh.material.transmission = themeName === 'glass' ? 0.6 : 0.0;
                        mesh.material.thickness = themeName === 'glass' ? 1.0 : 0.0;
                    }
                }
            });
        });

        // Indicators
        this.indicatorPool.forEach(ring => {
            ring.material.color.setHex(config.indicator);
        });

        // Particles
        this.ambientParticles.material.color.setHex(config.particles);
    }

    resetBoard() {
        this.deselectPiece();

        // Clear active pieces
        this.pieces.forEach(p => this.scene.remove(p));
        this.pieces = [];
        this.gameState = Array(8).fill(null).map(() => Array(8).fill(null));

        // Recreate
        this.initPieces();
        this.setTheme(CONFIG.theme);
    }

    // Event hooks
    initEvents() {
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Raycasting triggers
        this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.container.addEventListener('click', this.onClick.bind(this));

        // Stop auto rotation when user drags
        this.container.addEventListener('pointerdown', () => {
            this.controls.autoRotate = false;
        });

        // Theme Button Bindings
        const themeButtons = document.querySelectorAll('.theme-btn:not(.reset-btn)');
        themeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                themeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setTheme(btn.getAttribute('data-theme'));
            });
        });

        // Reset Board Binding
        const resetBtn = document.getElementById('reset-board');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetBoard();
            });
        }
    }

    onMouseMove(e) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        // Set target values for mouse parallax
        this.targetMouse.x = this.mouse.x * 0.8;
        this.targetMouse.y = this.mouse.y * 0.4;
    }

    onClick(e) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        let hitObject = null;

        for (let i = 0; i < intersects.length; i++) {
            let obj = intersects[i].object;
            while (obj) {
                if (obj.userData && (obj.userData.isPiece || obj.userData.isTile)) {
                    hitObject = obj;
                    break;
                }
                obj = obj.parent;
            }
            if (hitObject) break;
        }

        if (hitObject) {
            // Clicked a piece
            if (hitObject.userData.isPiece) {
                this.selectPiece(hitObject);
            }
            // Clicked a tile
            else if (hitObject.userData.isTile) {
                const r = hitObject.userData.row;
                const c = hitObject.userData.col;

                // Check if tile is a valid move highlight
                const clickedIndicator = this.indicatorPool.find(
                    ring => ring.userData.active && ring.userData.row === r && ring.userData.col === c
                );

                if (this.selectedPiece && clickedIndicator) {
                    this.movePieceTo(this.selectedPiece, r, c);
                } else {
                    this.deselectPiece();
                }
            }
        } else {
            // Clicked empty space
            this.deselectPiece();
        }
    }

    onWindowResize() {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.width, this.height);
    }

    // Animation frames loop
    animate() {
        requestAnimationFrame(this.animate.bind(this));

        // Smooth camera mouse parallax (tilted angle offset)
        if (Math.abs(this.targetMouse.x) > 0.01) {
            // Shift light values slightly for interactive reflections
            this.fillLight.position.x = -6 + this.targetMouse.x * 3;
        }

        // Piece rotations
        this.pieces.forEach(p => {
            if (p.userData.isRotating) {
                p.rotation.y += p.userData.rotationSpeed;
            }
        });

        // Ambient particles drifting
        if (this.ambientParticles) {
            const posAttr = this.ambientParticles.geometry.attributes.position;
            const speeds = this.ambientParticles.userData.speeds;

            for (let i = 0; i < posAttr.count; i++) {
                const idx = i * 3;
                posAttr.array[idx] += speeds[i].x;
                posAttr.array[idx + 1] += speeds[i].y;
                posAttr.array[idx + 2] += speeds[i].z;

                // Reset particles drifting off screen
                if (posAttr.array[idx + 1] > 6) {
                    posAttr.array[idx] = (Math.random() - 0.5) * 20;
                    posAttr.array[idx + 1] = 0.1;
                    posAttr.array[idx + 2] = (Math.random() - 0.5) * 20;
                }
            }
            posAttr.needsUpdate = true;
            this.ambientParticles.rotation.y += 0.0008; // gentle spin
        }

        // Dynamic impact particles system update
        for (let s = this.particleSystems.length - 1; s >= 0; s--) {
            const system = this.particleSystems[s];
            const posAttr = system.geometry.attributes.position;
            const vels = system.userData.velocities;
            system.userData.age += 1;

            for (let i = 0; i < posAttr.count; i++) {
                const idx = i * 3;
                posAttr.array[idx] += vels[i].x;
                posAttr.array[idx + 1] += vels[i].y;
                posAttr.array[idx + 2] += vels[i].z;

                // Gravity pull
                vels[i].y -= vels[i].gravity;
            }

            posAttr.needsUpdate = true;
            system.material.opacity = 1.0 - (system.userData.age / system.userData.maxAge);

            if (system.userData.age >= system.userData.maxAge) {
                this.scene.remove(system);
                system.geometry.dispose();
                system.material.dispose();
                this.particleSystems.splice(s, 1);
            }
        }

        // Raycasting for hover detection
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        let hoveredObject = null;

        for (let i = 0; i < intersects.length; i++) {
            let obj = intersects[i].object;
            while (obj) {
                if (obj.userData && (obj.userData.isPiece || obj.userData.isTile)) {
                    hoveredObject = obj;
                    break;
                }
                obj = obj.parent;
            }
            if (hoveredObject) break;
        }

        this.handleHover(hoveredObject);

        // Update controls
        this.controls.update();

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Instantiate on load
window.addEventListener('DOMContentLoaded', () => {
    new Chess3D();
});
