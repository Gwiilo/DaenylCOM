// Islands - 3D Procedural Island Generator
// Generates terrain using 3D Perlin noise with distance-based falloff

// Simple 2D Perlin noise implementation
class SimpleNoise {
    constructor(seed = Math.random()) {
        this.seed = seed;
        this.p = this.generatePermutation();
    }

    generatePermutation() {
        const p = [];
        for (let i = 0; i < 256; i++) {
            p[i] = i;
        }
        
        // Shuffle using seed
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }
        
        // Duplicate array
        for (let i = 0; i < 256; i++) {
            p[256 + i] = p[i];
        }
        
        return p;
    }

    random() {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(a, b, t) {
        return a + t * (b - a);
    }

    grad2d(hash, x, y) {
        const h = hash & 3;
        return ((h & 1) === 0 ? x : -x) + ((h & 2) === 0 ? y : -y);
    }

    noise2d(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);

        const u = this.fade(x);
        const v = this.fade(y);

        const A = this.p[X] + Y;
        const B = this.p[X + 1] + Y;

        return this.lerp(
            this.lerp(
                this.grad2d(this.p[A], x, y),
                this.grad2d(this.p[B], x - 1, y),
                u
            ),
            this.lerp(
                this.grad2d(this.p[A + 1], x, y - 1),
                this.grad2d(this.p[B + 1], x - 1, y - 1),
                u
            ),
            v
        );
    }

    // Simple fractal noise
    fractalNoise2d(x, y, octaves = 4) {
        let value = 0;
        let amplitude = 1;
        let frequency = 0.01;

        for (let i = 0; i < octaves; i++) {
            value += this.noise2d(x * frequency, y * frequency) * amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }

        return value;
    }
}

class IslandGenerator {
    constructor() {
        this.size = 500; // Increased to 500x500 grid for larger world
        this.seaLevel = 0.25; // Set sea level to 0.25 as requested
        this.segmentSize = 200; // Number of segments for terrain resolution
        this.maxHeight = 8;
        this.noise = new SimpleNoise(Math.random() * 1000);
        this.isTopDown = true;
        this.lastTime = 0; // Initialize framerate timing
        
        this.initializeTerrain();
        this.setupLighting();
        this.setupCamera();
        this.setupControls();
        
        this.createUI();
        this.render();
    }

    initializeTerrain() {
        this.terrainGroup = new THREE.Group();
        scene.add(this.terrainGroup);
        
        this.generateTerrain();
    }

    generateTerrain() {
        // Clear existing terrain
        while (this.terrainGroup.children.length > 0) {
            const child = this.terrainGroup.children[0];
            this.terrainGroup.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        }

        // Create geometry from scratch with height data
        const width = this.size;
        const height = this.size;
        const widthSegments = Math.min(this.segmentSize, this.size - 1);
        const heightSegments = Math.min(this.segmentSize, this.size - 1);

        const geometry = new THREE.BufferGeometry();
        
        const vertices = [];
        const colors = [];
        const indices = [];
        const uvs = [];

        // Generate vertices with heights
        for (let iy = 0; iy <= heightSegments; iy++) {
            for (let ix = 0; ix <= widthSegments; ix++) {
                const x = (ix / widthSegments) * width - width / 2;
                const z = (iy / heightSegments) * height - height / 2;
                
                // Distance from center for island shape calculations
                const distance = Math.sqrt(x * x + z * z);
                const maxDistance = this.size * 0.6; // Larger area for islands
                const normalizedDistance = Math.min(distance / maxDistance, 1.0);
                
                // Enhanced 2D noise with distance-based displacement
                let terrainHeight = this.noise.fractalNoise2d(x, z, 8); // More octaves for detail
                
                // Distance-based noise displacement - much more effective at edges
                const displacementMultiplier = 1.0 + normalizedDistance * 4.0; // 1x at center, 5x at edges
                terrainHeight *= displacementMultiplier;
                
                // Scale height more aggressively
                terrainHeight = (terrainHeight + 1) * 0.5; // Normalize to 0-1
                terrainHeight = terrainHeight * 15; // Increase base height variation
                
                const falloff = Math.max(0, 1 - normalizedDistance);
                
                // Much more aggressive island-shaped falloff
                // Force terrain variation throughout, water only at edges
                let islandFalloff;
                if (normalizedDistance > 0.75) {
                    // Outer 25% - force to zero (guaranteed water)
                    islandFalloff = 0;
                } else {
                    // Inner 75% - smooth transition with full noise effects
                    const transitionProgress = normalizedDistance / 0.75; // 0 to 1 over inner 75%
                    islandFalloff = Math.pow(1 - transitionProgress, 2); // Smooth quadratic falloff
                }
                
                // Full noise-driven terrain throughout (no plateau)
                terrainHeight = terrainHeight * islandFalloff;
                
                // Allow terrain to dip below sea level for proper underwater areas
                terrainHeight = Math.max(terrainHeight, -3); // Allow terrain to go 3 units below sea level
                
                // Correct order: X, Y (height), Z for horizontal terrain
                vertices.push(x, terrainHeight, z);
                
                // UV coordinates
                uvs.push(ix / widthSegments, iy / heightSegments);
            }
        }

        // Generate indices for triangles
        for (let iy = 0; iy < heightSegments; iy++) {
            for (let ix = 0; ix < widthSegments; ix++) {
                const a = ix + (widthSegments + 1) * iy;
                const b = ix + (widthSegments + 1) * (iy + 1);
                const c = (ix + 1) + (widthSegments + 1) * (iy + 1);
                const d = (ix + 1) + (widthSegments + 1) * iy;

                // Two triangles per quad
                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }

        geometry.setIndex(indices);
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.computeVertexNormals();

        // Create a texture-based material instead of vertex colors
        const textureSize = this.size; // Texture size matches world size
        const canvas = document.createElement('canvas');
        canvas.width = textureSize;
        canvas.height = textureSize;
        const ctx = canvas.getContext('2d');
        
        // Generate texture data pixel by pixel
        const imageData = ctx.createImageData(textureSize, textureSize);
        const data = imageData.data;
        
        for (let y = 0; y < textureSize; y++) {
            for (let x = 0; x < textureSize; x++) {
                // Convert pixel coordinates to world coordinates
                const worldX = (x / textureSize) * this.size - this.size / 2;
                const worldZ = (y / textureSize) * this.size - this.size / 2;
                
                // Calculate height at this position (same logic as terrain generation)
                const distance = Math.sqrt(worldX * worldX + worldZ * worldZ);
                const maxDistance = this.size * 0.6;
                const normalizedDistance = Math.min(distance / maxDistance, 1.0);
                
                let terrainHeight = this.noise.fractalNoise2d(worldX, worldZ, 8);
                const displacementMultiplier = 1.0 + normalizedDistance * 4.0;
                terrainHeight *= displacementMultiplier;
                terrainHeight = (terrainHeight + 1) * 0.5;
                terrainHeight = terrainHeight * 15;
                
                let islandFalloff;
                if (normalizedDistance > 0.75) {
                    islandFalloff = 0;
                } else {
                    const transitionProgress = normalizedDistance / 0.75;
                    islandFalloff = Math.pow(1 - transitionProgress, 2);
                }
                
                terrainHeight = terrainHeight * islandFalloff;
                terrainHeight = Math.max(terrainHeight, -3); // Allow terrain to go 3 units below sea level
                
                // Get color for this pixel
                const color = this.getTerrainColor(terrainHeight, distance, maxDistance, worldX, worldZ);
                
                const pixelIndex = (y * textureSize + x) * 4;
                data[pixelIndex] = Math.floor(color.r * 255);     // R
                data[pixelIndex + 1] = Math.floor(color.g * 255); // G
                data[pixelIndex + 2] = Math.floor(color.b * 255); // B
                data[pixelIndex + 3] = 255;                       // A
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter; // No interpolation - sharp pixels
        texture.minFilter = THREE.NearestFilter;
        texture.wrapS = THREE.ClampToEdgeWrap;
        texture.wrapT = THREE.ClampToEdgeWrap;

        const material = new THREE.MeshLambertMaterial({ 
            map: texture,
            side: THREE.DoubleSide
        });
        
        this.terrainMesh = new THREE.Mesh(geometry, material);
        // Keep terrain in XZ plane (no rotation needed)
        this.terrainGroup.add(this.terrainMesh);

        // Add water plane
        this.addWater();
        
        const maxHeight = Math.max(...vertices.filter((_, i) => i % 3 === 1));
        console.log('Generated terrain with max height:', maxHeight);
    }

    getTerrainColor(height, distance, maxDistance, x, z) {
        let color = new THREE.Color();
        
        // FIRST: Check if terrain is below sea level - force sand color immediately
        if (height <= this.seaLevel) {
            color.setHex(0xF4E4BC); // Sandy beige for underwater areas
            return color;
        }
        
        // Add biome border randomization using seeded noise at 10% strength
        const biomeNoise = this.noise.noise2d(x * 0.05, z * 0.05) * 0.1; // 10% noise influence
        const adjustedHeight = height + biomeNoise;
        
        // SECOND: Check adjusted height for beach areas near water
        if (adjustedHeight <= this.seaLevel + 0.1) {
            // Beach/sand - only very close to water
            color.setHex(0xF4E4BC); // Sandy beige
        } else if (adjustedHeight < 2) {
            // Grass/lowlands
            color.setHex(0x4A7C2A); // Rich green
        } else if (adjustedHeight < 5) {
            // Forest
            color.setHex(0x2D5016); // Dark forest green
        } else if (adjustedHeight < 8) {
            // Mountains
            color.setHex(0x8B7355); // Brown mountain
        } else {
            // Snow peaks
            color.setHex(0xFFFFFF); // Pure white snow
        }
        
        return color;
    }

    addWater() {
        // Water same size as terrain (not 1.5x larger)
        const waterGeometry = new THREE.PlaneGeometry(this.size, this.size);
        const waterMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x006994,
            transparent: true,
            opacity: 0.7,
            depthWrite: false, // Don't write to depth buffer to avoid z-fighting
            side: THREE.DoubleSide
        });
        
        this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
        this.waterMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        this.waterMesh.position.y = this.seaLevel; // Water at actual sea level
        this.waterMesh.renderOrder = 1; // Render after terrain
        this.terrainGroup.add(this.waterMesh);
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        scene.add(ambientLight);

        // Directional light (sun) - positioned at 135 degrees and animated
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.castShadow = true;
        
        // Initial position at 135 degrees (3/4 around from positive X axis)
        this.sunAngle = Math.PI * 3/4; // 135 degrees in radians
        this.sunDistance = 50;
        this.sunHeight = 35; // Height above terrain
        
        this.updateSunPosition();
        scene.add(this.directionalLight);
    }
    
    updateSunPosition() {
        // Rotate sun around the terrain every 6 minutes (360 seconds)
        const time = Date.now() * 0.001; // Current time in seconds
        const rotationSpeed = (2 * Math.PI) / 360; // One full rotation every 6 minutes (360 seconds)
        
        this.sunAngle += rotationSpeed * (1/60); // Adjust for frame rate
        
        // Position sun in circular orbit
        this.directionalLight.position.set(
            Math.cos(this.sunAngle) * this.sunDistance,
            this.sunHeight,
            Math.sin(this.sunAngle) * this.sunDistance
        );
        
        // Always point toward terrain center
        this.directionalLight.target.position.set(0, 0, 0);
        this.directionalLight.target.updateMatrixWorld();
    }

    setupCamera() {
        // Check if we're in a preview context (smaller container)
        const isPreview = renderer.domElement.parentElement && 
                          renderer.domElement.parentElement.clientWidth < 800;
        
        if (isPreview) {
            // For previews, start in perspective view to show the 3D terrain
            this.setPerspectiveView();
            this.updatePerspectiveCamera();
        } else {
            // For full editor, start in top-down view
            this.setTopDownView();
        }
    }

    setTopDownView() {
        this.isTopDown = true;
        
        // Switch to orthographic camera for top-down view
        const aspect = window.innerWidth / window.innerHeight;
        const frustumSize = this.size * 0.6; // Scale frustum to show full island
        
        camera.left = -frustumSize * aspect / 2;
        camera.right = frustumSize * aspect / 2;
        camera.top = frustumSize / 2;
        camera.bottom = -frustumSize / 2;
        camera.near = 0.1;
        camera.far = 2000;
        
        // Look down from much higher up to see the full island
        camera.position.set(0, this.size * 0.5, 0); // Position camera at 2x world size height
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
    }

    setPerspectiveView() {
        this.isTopDown = false;
        
        // Switch back to perspective camera
        camera.fov = 75;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.near = 0.1;
        camera.far = this.size * 2; // Scale far plane with world size
        
        // Position camera to view terrain from an angle (scaled to world size)
        const distance = this.size * 0.15; // 15% of world size
        camera.position.set(distance, distance * 0.8, distance);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
    }

    setupControls() {
        // Camera controls for orbital movement (perspective mode)
        this.cameraAngle = { theta: 0.785, phi: Math.PI / 4 };
        this.cameraDistance = this.size * 0.2; // Start at 20% of world size
        this.isDragging = false;
        this.previousMouse = { x: 0, y: 0 };

        // Mouse controls
        renderer.domElement.addEventListener('mousedown', (event) => {
            if (!this.isTopDown) {
                this.isDragging = true;
                this.previousMouse.x = event.clientX;
                this.previousMouse.y = event.clientY;
                renderer.domElement.style.cursor = 'grabbing';
            }
        });

        renderer.domElement.addEventListener('mousemove', (event) => {
            if (this.isDragging && !this.isTopDown) {
                const deltaX = event.clientX - this.previousMouse.x;
                const deltaY = event.clientY - this.previousMouse.y;
                
                this.cameraAngle.theta -= deltaX * 0.01;
                this.cameraAngle.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraAngle.phi + deltaY * 0.01));
                
                this.updatePerspectiveCamera();
                
                this.previousMouse.x = event.clientX;
                this.previousMouse.y = event.clientY;
            }
        });

        renderer.domElement.addEventListener('mouseup', () => {
            this.isDragging = false;
            renderer.domElement.style.cursor = this.isTopDown ? 'default' : 'grab';
        });

        renderer.domElement.addEventListener('mouseleave', () => {
            this.isDragging = false;
            renderer.domElement.style.cursor = this.isTopDown ? 'default' : 'grab';
        });

        // Wheel zoom - scaled to world size
        renderer.domElement.addEventListener('wheel', (event) => {
            event.preventDefault();
            if (!this.isTopDown) {
                const zoomStep = this.size / 20; // Zoom step = world size / 10
                this.cameraDistance += event.deltaY * 0.01 * zoomStep;
                this.cameraDistance = Math.max(10, Math.min(this.size, this.cameraDistance)); // Min 10, max = world size
                this.updatePerspectiveCamera();
            }
        });
    }

    updatePerspectiveCamera() {
        if (!this.isTopDown) {
            // Standard spherical coordinates for XZ plane with Y up
            camera.position.x = this.cameraDistance * Math.sin(this.cameraAngle.phi) * Math.cos(this.cameraAngle.theta);
            camera.position.y = this.cameraDistance * Math.cos(this.cameraAngle.phi);
            camera.position.z = this.cameraDistance * Math.sin(this.cameraAngle.phi) * Math.sin(this.cameraAngle.theta);
            camera.lookAt(0, 0, 0);
        }
    }

    createUI() {
        // Create UI container
        const uiContainer = document.createElement('div');
        uiContainer.style.position = 'absolute';
        uiContainer.style.top = '10px';
        uiContainer.style.left = '10px';
        uiContainer.style.zIndex = '1000';
        uiContainer.style.color = 'white';
        uiContainer.style.fontFamily = 'monospace';
        uiContainer.style.fontSize = '14px';
        uiContainer.style.background = 'rgba(0,0,0,0.7)';
        uiContainer.style.padding = '10px';
        uiContainer.style.borderRadius = '5px';
        
        // Camera toggle button
        const cameraButton = document.createElement('button');
        cameraButton.textContent = 'Switch to Perspective';
        cameraButton.style.display = 'block';
        cameraButton.style.marginBottom = '10px';
        cameraButton.style.padding = '5px 10px';
        cameraButton.style.background = '#4CAF50';
        cameraButton.style.color = 'white';
        cameraButton.style.border = 'none';
        cameraButton.style.borderRadius = '3px';
        cameraButton.style.cursor = 'pointer';
        
        cameraButton.onclick = () => {
            if (this.isTopDown) {
                this.setPerspectiveView();
                this.updatePerspectiveCamera();
                cameraButton.textContent = 'Switch to Top-Down';
                renderer.domElement.style.cursor = 'grab';
            } else {
                this.setTopDownView();
                cameraButton.textContent = 'Switch to Perspective';
                renderer.domElement.style.cursor = 'default';
            }
        };
        
        // Generate new island button
        const generateButton = document.createElement('button');
        generateButton.textContent = 'Generate New Island';
        generateButton.style.display = 'block';
        generateButton.style.marginBottom = '10px';
        generateButton.style.padding = '5px 10px';
        generateButton.style.background = '#2196F3';
        generateButton.style.color = 'white';
        generateButton.style.border = 'none';
        generateButton.style.borderRadius = '3px';
        generateButton.style.cursor = 'pointer';
        
        generateButton.onclick = () => {
            this.noise = new SimpleNoise(Math.random() * 1000);
            this.generateTerrain();
        };
        
        // Settings section
        const settingsDiv = document.createElement('div');
        settingsDiv.style.marginBottom = '10px';
        settingsDiv.style.borderTop = '1px solid #666';
        settingsDiv.style.paddingTop = '10px';
        
        // World size control
        const sizeLabel = document.createElement('label');
        sizeLabel.textContent = 'World Size: ';
        sizeLabel.style.display = 'block';
        sizeLabel.style.marginBottom = '5px';
        
        const sizeInput = document.createElement('input');
        sizeInput.type = 'range';
        sizeInput.min = '100';
        sizeInput.max = '1000';
        sizeInput.step = '50';
        sizeInput.value = this.size;
        sizeInput.style.width = '150px';
        sizeInput.style.marginBottom = '5px';
        
        const sizeValue = document.createElement('span');
        sizeValue.textContent = this.size;
        sizeValue.style.marginLeft = '10px';
        
        sizeInput.oninput = () => {
            this.size = parseInt(sizeInput.value);
            sizeValue.textContent = this.size;
        };
        
        // Segment size control
        const segmentLabel = document.createElement('label');
        segmentLabel.textContent = 'Segment Count: ';
        segmentLabel.style.display = 'block';
        segmentLabel.style.marginBottom = '5px';
        segmentLabel.style.marginTop = '10px';
        
        const segmentInput = document.createElement('input');
        segmentInput.type = 'range';
        segmentInput.min = '50';
        segmentInput.max = '500';
        segmentInput.step = '25';
        segmentInput.value = this.segmentSize;
        segmentInput.style.width = '150px';
        segmentInput.style.marginBottom = '5px';
        
        const segmentValue = document.createElement('span');
        segmentValue.textContent = this.segmentSize;
        segmentValue.style.marginLeft = '10px';
        
        segmentInput.oninput = () => {
            this.segmentSize = parseInt(segmentInput.value);
            segmentValue.textContent = this.segmentSize;
        };
        
        // Sea level control
        const seaLabel = document.createElement('label');
        seaLabel.textContent = 'Sea Level: ';
        seaLabel.style.display = 'block';
        seaLabel.style.marginBottom = '5px';
        seaLabel.style.marginTop = '10px';
        
        const seaInput = document.createElement('input');
        seaInput.type = 'range';
        seaInput.min = '0';
        seaInput.max = '2';
        seaInput.step = '0.1';
        seaInput.value = this.seaLevel;
        seaInput.style.width = '150px';
        seaInput.style.marginBottom = '5px';
        
        const seaValue = document.createElement('span');
        seaValue.textContent = this.seaLevel.toFixed(1);
        seaValue.style.marginLeft = '10px';
        
        seaInput.oninput = () => {
            this.seaLevel = parseFloat(seaInput.value);
            seaValue.textContent = this.seaLevel.toFixed(1);
        };
        
        // Apply settings button
        const applyButton = document.createElement('button');
        applyButton.textContent = 'Apply Settings';
        applyButton.style.display = 'block';
        applyButton.style.marginTop = '10px';
        applyButton.style.padding = '5px 10px';
        applyButton.style.background = '#FF9800';
        applyButton.style.color = 'white';
        applyButton.style.border = 'none';
        applyButton.style.borderRadius = '3px';
        applyButton.style.cursor = 'pointer';
        
        applyButton.onclick = () => {
            this.generateTerrain();
            this.setupCamera(); // Recalculate camera for new world size
        };
        
        settingsDiv.appendChild(sizeLabel);
        settingsDiv.appendChild(sizeInput);
        settingsDiv.appendChild(sizeValue);
        settingsDiv.appendChild(segmentLabel);
        settingsDiv.appendChild(segmentInput);
        settingsDiv.appendChild(segmentValue);
        settingsDiv.appendChild(seaLabel);
        settingsDiv.appendChild(seaInput);
        settingsDiv.appendChild(seaValue);
        settingsDiv.appendChild(applyButton);
        
        // Info text
        const infoText = document.createElement('div');
        infoText.style.marginTop = '10px';
        infoText.style.borderTop = '1px solid #666';
        infoText.style.paddingTop = '10px';
        infoText.innerHTML = `
            <div><strong>Island Generator</strong></div>
            <div>• Top-down orthographic view</div>
            <div>• Click button to explore in 3D</div>
            <div>• Procedural terrain with biomes</div>
            <div>• Drag to rotate (perspective mode)</div>
            <div>• Scroll to zoom (perspective mode)</div>
        `;
        
        uiContainer.appendChild(cameraButton);
        uiContainer.appendChild(generateButton);
        uiContainer.appendChild(settingsDiv);
        uiContainer.appendChild(infoText);
        
        // Add to the canvas container
        const canvasContainer = renderer.domElement.parentElement || document.body;
        canvasContainer.appendChild(uiContainer);
        
        // Store reference for cleanup
        this.uiContainer = uiContainer;
    }

    render() {
        // Check if we should continue animating (for showcase integration)
        if (window.islandGenerator === this) {
            this.animationId = requestAnimationFrame(() => this.render());
        }
        
        // Proper 60 FPS framerate limiting
        const currentTime = performance.now();
        if (!this.lastTime) this.lastTime = 0;
        const targetFPS = 60;
        const frameInterval = 1000 / targetFPS;
        
        if (currentTime - this.lastTime >= frameInterval) {
            // Animate sun position
            this.updateSunPosition();
            
            // Animate water
            if (this.waterMesh) {
                this.waterMesh.material.opacity = 0.6 + Math.sin(Date.now() * 0.001) * 0.1;
            }
            
            this.lastTime = currentTime;
        }
        
        renderer.render(scene, camera);
    }

    cleanup() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.uiContainer && this.uiContainer.parentElement) {
            this.uiContainer.parentElement.removeChild(this.uiContainer);
        }
        
        // Clean up Three.js objects
        while (this.terrainGroup.children.length > 0) {
            const child = this.terrainGroup.children[0];
            this.terrainGroup.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        }
        scene.remove(this.terrainGroup);
    }
}

// Initialize the island generator
const islandGenerator = new IslandGenerator();

// Store reference globally for showcase management
window.islandGenerator = islandGenerator;

// Create render function for showcase compatibility
window.render = function() {
    islandGenerator.render();
};

// Expose control functions for the showcase manager
window.pauseIslands = function() {
    if (islandGenerator.animationId) {
        cancelAnimationFrame(islandGenerator.animationId);
        islandGenerator.animationId = null;
        console.log('Islands animation paused');
    }
};

window.resumeIslands = function() {
    if (!islandGenerator.animationId && window.islandGenerator === islandGenerator) {
        console.log('Islands animation resumed');
        islandGenerator.lastTime = 0; // Reset timing to prevent frame skipping
        islandGenerator.render();
    }
};

// Cleanup function
window.cleanupIslands = function() {
    window.islandGenerator = null;
    islandGenerator.cleanup();
};