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
        this.size = 100; // 100x100 grid
        this.seaLevel = 0;
        this.maxHeight = 8;
        this.noise = new SimpleNoise(Math.random() * 1000);
        this.isTopDown = true;
        
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
        const widthSegments = this.size - 1;
        const heightSegments = this.size - 1;

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
                
                // Simple 2D noise for height
                let terrainHeight = this.noise.fractalNoise2d(x, z, 6);
                
                // Scale height
                terrainHeight = (terrainHeight + 1) * 0.5; // Normalize to 0-1
                terrainHeight = terrainHeight * 20; // Make it tall!
                
                // Distance from center for island shape
                const distance = Math.sqrt(x * x + z * z);
                const maxDistance = this.size * 0.4;
                const falloff = Math.max(0, 1 - (distance / maxDistance));
                
                // Apply island falloff
                terrainHeight *= falloff * falloff;
                
                // Correct order: X, Y (height), Z for horizontal terrain
                vertices.push(x, terrainHeight, z);
                
                // Determine color based on height
                const color = this.getTerrainColor(terrainHeight, distance, maxDistance);
                colors.push(color.r, color.g, color.b);
                
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
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.computeVertexNormals();

        const material = new THREE.MeshLambertMaterial({ 
            vertexColors: true,
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

    getTerrainColor(height, distance, maxDistance) {
        let color = new THREE.Color();
        
        if (height < 1) {
            // Beach/sand
            color.setHSL(0.12, 0.4, 0.7);
        } else if (height < 5) {
            // Grass/lowlands
            color.setHSL(0.25, 0.8, 0.4);
        } else if (height < 10) {
            // Forest
            color.setHSL(0.2, 0.9, 0.3);
        } else if (height < 15) {
            // Mountains
            color.setHSL(0.08, 0.6, 0.4);
        } else {
            // Snow peaks
            color.setHSL(0, 0, 0.9);
        }
        
        return color;
    }

    addWater() {
        const waterGeometry = new THREE.PlaneGeometry(this.size * 1.5, this.size * 1.5);
        const waterMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x006994,
            transparent: true,
            opacity: 0.7
        });
        
        this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
        this.waterMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        this.waterMesh.position.y = this.seaLevel - 0.1;
        this.terrainGroup.add(this.waterMesh);
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        scene.add(ambientLight);

        // Directional light (sun)
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(10, 10, 5);
        this.directionalLight.castShadow = true;
        scene.add(this.directionalLight);
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
        const frustumSize = this.size;
        
        camera.left = -frustumSize * aspect / 2;
        camera.right = frustumSize * aspect / 2;
        camera.top = frustumSize / 2;
        camera.bottom = -frustumSize / 2;
        camera.near = 0.1;
        camera.far = 1000;
        
        // Look down from above at the XZ plane
        camera.position.set(0, 50, 0);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
    }

    setPerspectiveView() {
        this.isTopDown = false;
        
        // Switch back to perspective camera
        camera.fov = 75;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.near = 0.1;
        camera.far = 1000;
        
        // Position camera to view terrain from an angle (standard 3D view)
        camera.position.set(30, 25, 30);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
    }

    setupControls() {
        // Camera controls for orbital movement (perspective mode)
        this.cameraAngle = { theta: 0.785, phi: Math.PI / 4 };
        this.cameraDistance = 50; // Increased distance to see the whole island
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

        // Wheel zoom
        renderer.domElement.addEventListener('wheel', (event) => {
            event.preventDefault();
            if (!this.isTopDown) {
                this.cameraDistance += event.deltaY * 0.01;
                this.cameraDistance = Math.max(10, Math.min(100, this.cameraDistance));
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
        
        // Info text
        const infoText = document.createElement('div');
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
        
        // Animate water
        if (this.waterMesh) {
            this.waterMesh.material.opacity = 0.6 + Math.sin(Date.now() * 0.001) * 0.1;
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
        islandGenerator.render();
    }
};

// Cleanup function
window.cleanupIslands = function() {
    window.islandGenerator = null;
    islandGenerator.cleanup();
};