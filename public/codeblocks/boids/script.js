// Boids Flocking Simulation with Three.js
// Demonstrates emergent behavior through simple rules

class Boid {
    constructor() {
        this.position = new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
        );
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        );
        this.acceleration = new THREE.Vector3();
        this.maxForce = 0.05; // Increased from 0.03
        this.maxSpeed = 3.5;  // Increased from 2
        
        // Create visual representation
        this.geometry = new THREE.ConeGeometry(0.1, 0.3, 4);
        this.material = new THREE.MeshBasicMaterial({ 
            color: new THREE.Color().setHSL(0, 0.7, 0.6)
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.copy(this.position);
        
        // For smooth orientation interpolation
        this.targetRotation = new THREE.Quaternion();
        this.mesh.quaternion.copy(this.targetRotation);
        
        scene.add(this.mesh);
    }
    
    // Update color based on position (linear gradient)
    updateColor() {
        // Linear color progression across the X axis
        const normalizedX = (this.position.x + 8) / 16; // Normalize -8 to 8 range to 0-1
        const hue = Math.max(0, Math.min(1, normalizedX)); // Clamp to 0-1
        this.material.color.setHSL(hue * 0.8, 0.7, 0.6); // 0.8 to avoid full red wrap-around
    }
    
    // Apply flocking rules
    flock(boids) {
        let sep = this.separate(boids);
        let ali = this.align(boids);
        let coh = this.cohesion(boids);
        let boundary = this.avoidBoundaries();
        
        sep.multiplyScalar(1.5);
        ali.multiplyScalar(1.0);
        coh.multiplyScalar(1.0);
        boundary.multiplyScalar(0.2); // Reduced from 2.0 to 0.2 (90% reduction)
        
        this.acceleration.add(sep);
        this.acceleration.add(ali);
        this.acceleration.add(coh);
        this.acceleration.add(boundary);
    }
    
    // Separation: steer to avoid crowding local flockmates
    separate(boids) {
        let desiredSeparation = 1.0;
        let steer = new THREE.Vector3();
        let count = 0;
        
        for (let other of boids) {
            let d = this.position.distanceTo(other.position);
            if (d > 0 && d < desiredSeparation) {
                let diff = new THREE.Vector3().subVectors(this.position, other.position);
                diff.normalize();
                diff.divideScalar(d); // Weight by distance
                steer.add(diff);
                count++;
            }
        }
        
        if (count > 0) {
            steer.divideScalar(count);
            steer.normalize();
            steer.multiplyScalar(this.maxSpeed);
            steer.sub(this.velocity);
            steer.clampLength(0, this.maxForce);
        }
        
        return steer;
    }
    
    // Alignment: steer towards the average heading of neighbors
    align(boids) {
        let neighborDist = 2.0;
        let sum = new THREE.Vector3();
        let count = 0;
        
        for (let other of boids) {
            let d = this.position.distanceTo(other.position);
            if (d > 0 && d < neighborDist) {
                sum.add(other.velocity);
                count++;
            }
        }
        
        if (count > 0) {
            sum.divideScalar(count);
            sum.normalize();
            sum.multiplyScalar(this.maxSpeed);
            let steer = new THREE.Vector3().subVectors(sum, this.velocity);
            steer.clampLength(0, this.maxForce);
            return steer;
        }
        
        return new THREE.Vector3();
    }
    
    // Cohesion: steer to move toward the average position of neighbors
    cohesion(boids) {
        let neighborDist = 2.0;
        let sum = new THREE.Vector3();
        let count = 0;
        
        for (let other of boids) {
            let d = this.position.distanceTo(other.position);
            if (d > 0 && d < neighborDist) {
                sum.add(other.position);
                count++;
            }
        }
        
        if (count > 0) {
            sum.divideScalar(count);
            return this.seek(sum);
        }
        
        return new THREE.Vector3();
    }
    
    // Seek a target position
    seek(target) {
        let desired = new THREE.Vector3().subVectors(target, this.position);
        desired.normalize();
        desired.multiplyScalar(this.maxSpeed);
        
        let steer = new THREE.Vector3().subVectors(desired, this.velocity);
        steer.clampLength(0, this.maxForce);
        return steer;
    }
    
    // Avoid boundaries by turning away when approaching edges
    avoidBoundaries() {
        let boundary = 8;
        let margin = 2; // Start turning when within this distance of boundary
        let steer = new THREE.Vector3();
        
        // Check each axis
        if (this.position.x > boundary - margin) {
            steer.x = -(this.position.x - (boundary - margin)) / margin;
        } else if (this.position.x < -boundary + margin) {
            steer.x = -((this.position.x + boundary - margin) / margin);
        }
        
        if (this.position.y > boundary - margin) {
            steer.y = -(this.position.y - (boundary - margin)) / margin;
        } else if (this.position.y < -boundary + margin) {
            steer.y = -((this.position.y + boundary - margin) / margin);
        }
        
        if (this.position.z > boundary - margin) {
            steer.z = -(this.position.z - (boundary - margin)) / margin;
        } else if (this.position.z < -boundary + margin) {
            steer.z = -((this.position.z + boundary - margin) / margin);
        }
        
        // Scale the steering force
        if (steer.length() > 0) {
            steer.normalize();
            steer.multiplyScalar(this.maxSpeed);
            steer.sub(this.velocity);
            steer.clampLength(0, this.maxForce * 2); // Stronger force for boundaries
        }
        
        return steer;
    }
    
    // Update boid position and orientation
    update() {
        this.velocity.add(this.acceleration);
        this.velocity.clampLength(0, this.maxSpeed);
        this.position.add(this.velocity.clone().multiplyScalar(1/60)); // Proper 60 FPS timing
        this.acceleration.multiplyScalar(0);
        
        // Update mesh position
        this.mesh.position.copy(this.position);
        
        // Update color based on position
        this.updateColor();
        
        // Smooth orientation interpolation
        if (this.velocity.length() > 0.01) {
            const target = new THREE.Vector3().copy(this.position).add(this.velocity.clone().normalize());
            
            // Create temporary object to calculate target rotation
            const tempObject = new THREE.Object3D();
            tempObject.position.copy(this.position);
            tempObject.lookAt(target);
            tempObject.rotateX(Math.PI / 2); // Correct cone orientation
            
            // Lerp to target rotation smoothly
            this.mesh.quaternion.slerp(tempObject.quaternion, 0.1);
        }
    }
}

// Initialize boids
const boids = [];
const numBoids = 200;

for (let i = 0; i < numBoids; i++) {
    boids.push(new Boid());
}

// Add some ambient lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Position camera
camera.position.set(0, 3, 12);

// Camera controls for orbital movement
let cameraAngle = { theta: 0, phi: Math.PI / 6 };
const cameraDistance = 12;
let isDragging = false;
let previousMouse = { x: 0, y: 0 };

// Mouse interaction for camera control
renderer.domElement.addEventListener('mousedown', (event) => {
    isDragging = true;
    previousMouse.x = event.clientX;
    previousMouse.y = event.clientY;
    renderer.domElement.style.cursor = 'grabbing';
});

renderer.domElement.addEventListener('mousemove', (event) => {
    if (isDragging) {
        const deltaX = event.clientX - previousMouse.x;
        const deltaY = event.clientY - previousMouse.y;
        
        cameraAngle.theta -= deltaX * 0.01;
        cameraAngle.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraAngle.phi + deltaY * 0.01));
        
        previousMouse.x = event.clientX;
        previousMouse.y = event.clientY;
    } else {
        // Mouse attraction when not dragging
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const distance = 10;
        mouseTarget = raycaster.ray.at(distance, new THREE.Vector3());
    }
});

renderer.domElement.addEventListener('mouseup', () => {
    isDragging = false;
    renderer.domElement.style.cursor = 'grab';
});

renderer.domElement.addEventListener('mouseleave', () => {
    isDragging = false;
    renderer.domElement.style.cursor = 'grab';
});

// Set initial cursor
renderer.domElement.style.cursor = 'grab';

// Update camera position based on spherical coordinates
function updateCamera() {
    camera.position.x = cameraDistance * Math.sin(cameraAngle.phi) * Math.cos(cameraAngle.theta);
    camera.position.y = cameraDistance * Math.cos(cameraAngle.phi);
    camera.position.z = cameraDistance * Math.sin(cameraAngle.phi) * Math.sin(cameraAngle.theta);
    camera.lookAt(0, 0, 0);
}

// Initialize camera position
updateCamera();

// Mouse interaction
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let mouseTarget = new THREE.Vector3();

renderer.domElement.addEventListener('mousemove', (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const distance = 10;
    mouseTarget = raycaster.ray.at(distance, new THREE.Vector3());
});

// Animation loop with proper 60 FPS limiting
let lastTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;
let isVisible = true;
let animationId = null;

function animate(currentTime = 0) {
    // Don't check isVisible here - let the main showcase manager control this
    
    // Proper framerate limiting
    if (currentTime - lastTime >= frameInterval) {
        // Update each boid
        for (let boid of boids) {
            boid.flock(boids);
            
            // Add mouse attraction only when not dragging camera
            if (mouseTarget && !isDragging) {
                let mouseForce = boid.seek(mouseTarget);
                mouseForce.multiplyScalar(0.3);
                boid.acceleration.add(mouseForce);
            }
            
            boid.update();
        }
        
        // Update camera position
        updateCamera();
        
        lastTime = currentTime;
    }
}

console.log(`Created ${numBoids} boids`);
console.log('Move your mouse to attract the flock!');

// Render loop - simplified, let showcase manager control start/stop
function render(currentTime = 0) {
    animationId = requestAnimationFrame(render);
    animate(currentTime);
    renderer.render(scene, camera);
}

// Expose control functions for the showcase manager
window.pauseBoids = function() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
        console.log('Boids animation paused');
    }
};

window.resumeBoids = function() {
    if (!animationId) {
        console.log('Boids animation resumed');
        render();
    }
};

// Remove individual viewport detection - let main manager handle this
// Start the animation (will be controlled by showcase manager)
render();
