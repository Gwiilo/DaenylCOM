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
        this.maxForce = 0.03;
        this.maxSpeed = 2;
        
        // Create visual representation
        this.geometry = new THREE.ConeGeometry(0.1, 0.3, 4);
        this.material = new THREE.MeshBasicMaterial({ 
            color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6)
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.copy(this.position);
        
        scene.add(this.mesh);
    }
    
    // Apply flocking rules
    flock(boids) {
        let sep = this.separate(boids);
        let ali = this.align(boids);
        let coh = this.cohesion(boids);
        
        sep.multiplyScalar(1.5);
        ali.multiplyScalar(1.0);
        coh.multiplyScalar(1.0);
        
        this.acceleration.add(sep);
        this.acceleration.add(ali);
        this.acceleration.add(coh);
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
    
    // Update boid position and orientation
    update() {
        this.velocity.add(this.acceleration);
        this.velocity.clampLength(0, this.maxSpeed);
        this.position.add(this.velocity);
        this.acceleration.multiplyScalar(0);
        
        // Wrap around edges
        this.wrapEdges();
        
        // Update mesh position
        this.mesh.position.copy(this.position);
        
        // Orient mesh in direction of movement
        if (this.velocity.length() > 0) {
            this.mesh.lookAt(this.position.clone().add(this.velocity));
        }
    }
    
    // Wrap around scene boundaries
    wrapEdges() {
        let boundary = 8;
        if (this.position.x < -boundary) this.position.x = boundary;
        if (this.position.x > boundary) this.position.x = -boundary;
        if (this.position.y < -boundary) this.position.y = boundary;
        if (this.position.y > boundary) this.position.y = -boundary;
        if (this.position.z < -boundary) this.position.z = boundary;
        if (this.position.z > boundary) this.position.z = -boundary;
    }
}

// Initialize boids
const boids = [];
const numBoids = 50;

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
camera.position.set(0, 0, 12);

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

// Animation loop
function animate() {
    // Update each boid
    for (let boid of boids) {
        boid.flock(boids);
        
        // Add mouse attraction
        if (mouseTarget) {
            let mouseForce = boid.seek(mouseTarget);
            mouseForce.multiplyScalar(0.5);
            boid.acceleration.add(mouseForce);
        }
        
        boid.update();
    }
    
    // Slowly rotate the camera for a better view
    camera.position.x = Math.cos(Date.now() * 0.0005) * 12;
    camera.position.z = Math.sin(Date.now() * 0.0005) * 12;
    camera.lookAt(0, 0, 0);
}

console.log(`Created ${numBoids} boids`);
console.log('Move your mouse to attract the flock!');
