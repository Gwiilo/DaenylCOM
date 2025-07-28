// Physics Simulation with Three.js
// Interactive physics playground with draggable objects and cutting tools

// Physics world and objects
let world;
let objects = [];
let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
let selectedObject = null;
let dragPlane = new THREE.Plane();
let intersection = new THREE.Vector3();
let offset = new THREE.Vector3();
let cuttingMode = false;
let sunDragMode = false;
let isDragging = false;
let dragTarget = new THREE.Vector3();
let lastDragPosition = new THREE.Vector3();

// Physics properties
const gravity = -9.81;
const timeStep = 1/60;

// Initialize the physics world
function initPhysics() {
    // Configure renderer for shadows
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Set scene background
    scene.background = new THREE.Color(0x2a2a2a);
    scene.fog = new THREE.Fog(0x2a2a2a, 50, 200);

    // Create physics world (simplified physics simulation)
    world = {
        gravity: new THREE.Vector3(0, gravity, 0),
        objects: [],
        constraints: []
    };

    // Position camera
    camera.position.set(0, 5, 15);
    camera.lookAt(0, 0, 0);

    // Add lighting
    setupLighting();

    // Create ground
    createGround();

    // Create demo objects
    createDemoObjects();

    // Add event listeners
    setupEventListeners();
}

function setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    // Directional light (sun) - positioned in front of camera, high up and to the right
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 15, 10); // Front-right-up relative to camera
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);
    
    // Store reference for sun dragging
    window.sunLight = directionalLight;

    // Point lights for dynamic lighting (reduced intensity)
    const pointLight1 = new THREE.PointLight(0x4080ff, 0.3, 20);
    pointLight1.position.set(-8, 8, -8);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff8040, 0.3, 20);
    pointLight2.position.set(8, 8, 8);
    scene.add(pointLight2);
}

function createGround() {
    // Remove the visible ground plane but keep invisible ground for physics
    // Objects will appear to float but still have a ground collision at y=0
}

function createDemoObjects() {
    // Create demo sphere
    createRigidSphere(new THREE.Vector3(-3, 5, 0), 1, 0xff4444);
    
    // Create demo cube
    createRigidCube(new THREE.Vector3(0, 5, 0), 1.5, 0x44ff44);
    
    // Create jelly bean (soft body)
    createJellyBean(new THREE.Vector3(3, 5, 0), 0xffff44);
}

function createRigidSphere(position, radius, color) {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.0,  // Reduced from 0.1
        roughness: 0.7,  // Increased from 0.3
        clearcoat: 0.1,  // Reduced from 0.8
        clearcoatRoughness: 0.8  // Increased from 0.2
    });
    
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(position);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    scene.add(sphere);

    // Enhanced physics properties
    sphere.userData.physics = {
        type: 'rigid',
        mass: radius * radius * radius * 4.18 * 800, // Density-based mass (reduced for better interaction)
        velocity: new THREE.Vector3(),
        angularVelocity: new THREE.Vector3(),
        restitution: 0.6,
        friction: 0.5,
        airFriction: 0.995,
        angularDamping: 0.98,
        radius: radius,
        shape: 'sphere',
        momentOfInertia: (2/5) * radius * radius * radius * 4.18 * 800 * radius * radius, // I = (2/5)mr²
        isBeingDragged: false,
        dragForce: 15.0,
        maxDragVelocity: 8.0
    };

    objects.push(sphere);
    world.objects.push(sphere);
    return sphere;
}

function createRigidCube(position, size, color) {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.0,  // Reduced from 0.2
        roughness: 0.8,  // Increased from 0.4
        clearcoat: 0.1,  // Reduced from 0.6
        clearcoatRoughness: 0.9  // Increased from 0.3
    });
    
    const cube = new THREE.Mesh(geometry, material);
    cube.position.copy(position);
    cube.castShadow = true;
    cube.receiveShadow = true;
    scene.add(cube);

    // Enhanced physics properties
    cube.userData.physics = {
        type: 'rigid',
        mass: size * size * size * 800, // Density-based mass (reduced for better interaction)
        velocity: new THREE.Vector3(),
        angularVelocity: new THREE.Vector3(),
        restitution: 0.4,
        friction: 0.7,
        airFriction: 0.995,
        angularDamping: 0.98,
        size: size,
        shape: 'box',
        momentOfInertia: (1/6) * size * size * size * 800 * (size * size + size * size), // I = (1/6)m(w²+h²)
        isBeingDragged: false,
        dragForce: 15.0,
        maxDragVelocity: 8.0
    };

    objects.push(cube);
    world.objects.push(cube);
    return cube;
}

function createJellyBean(position, color) {
    // Create jelly bean shape using multiple spheres
    const group = new THREE.Group();
    const jellyBeanParts = [];
    
    // Main body (larger sphere)
    const bodyGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const jellyMaterial = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.0,
        roughness: 0.4,  // Increased from 0.1
        transmission: 0.05,  // Reduced from 0.1
        thickness: 0.3,  // Reduced from 0.5
        clearcoat: 0.3,  // Reduced from 1.0
        clearcoatRoughness: 0.7  // Increased from 0.0
    });
    
    const body = new THREE.Mesh(bodyGeometry, jellyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    jellyBeanParts.push(body);
    
    // Top part (smaller sphere)
    const topGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    const top = new THREE.Mesh(topGeometry, jellyMaterial.clone());
    top.position.y = 0.7;
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);
    jellyBeanParts.push(top);
    
    // Bottom part (smaller sphere)
    const bottom = new THREE.Mesh(topGeometry, jellyMaterial.clone());
    bottom.position.y = -0.7;
    bottom.castShadow = true;
    bottom.receiveShadow = true;
    group.add(bottom);
    jellyBeanParts.push(bottom);

    group.position.copy(position);
    scene.add(group);

    // Enhanced soft body physics properties
    group.userData.physics = {
        type: 'soft',
        mass: 600, // Reduced for better interaction
        velocity: new THREE.Vector3(),
        angularVelocity: new THREE.Vector3(),
        restitution: 0.8,
        friction: 0.3,
        airFriction: 0.995,
        angularDamping: 0.95,
        stiffness: 0.3,
        damping: 0.1,
        parts: jellyBeanParts,
        shape: 'compound',
        deformation: 0,
        momentOfInertia: 400, // Approximate for compound shape
        isBeingDragged: false,
        dragForce: 12.0,
        maxDragVelocity: 7.0
    };

    objects.push(group);
    world.objects.push(group);
    return group;
}

function setupEventListeners() {
    // Mouse events
    renderer.domElement.addEventListener('mousedown', onMouseDown, false);
    renderer.domElement.addEventListener('mousemove', onMouseMove, false);
    renderer.domElement.addEventListener('mouseup', onMouseUp, false);
    renderer.domElement.addEventListener('contextmenu', onRightClick, false);
    renderer.domElement.addEventListener('wheel', onMouseWheel, false);

    // Keyboard events
    document.addEventListener('keydown', onKeyDown, false);

    // Window resize
    window.addEventListener('resize', onWindowResize, false);
}

function onMouseDown(event) {
    event.preventDefault();
    
    // Update mouse coordinates
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    // Check for sun dragging mode (hold Shift)
    if (event.shiftKey) {
        sunDragMode = true;
        isDragging = true;
        renderer.domElement.style.cursor = 'move';
        return;
    }
    
    // Check for object intersection
    const intersects = raycaster.intersectObjects(objects, true);
    
    if (intersects.length > 0) {
        selectedObject = intersects[0].object;
        isDragging = true;
        
        // Find the root object if it's part of a group
        while (selectedObject.parent && selectedObject.parent.userData && selectedObject.parent.userData.physics) {
            selectedObject = selectedObject.parent;
        }
        
        if (cuttingMode) {
            cutObject(selectedObject, intersects[0].point);
            selectedObject = null;
            isDragging = false;
        } else {
            // Setup enhanced dragging with physics-based movement
            const intersectionPoint = intersects[0].point;
            dragPlane.setFromNormalAndCoplanarPoint(
                camera.getWorldDirection(new THREE.Vector3()),
                intersectionPoint
            );
            
            if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
                offset.subVectors(selectedObject.position, intersection);
                dragTarget.copy(intersection).add(offset);
                lastDragPosition.copy(selectedObject.position);
            }
            
            // Mark object as being dragged for special physics handling
            if (selectedObject.userData.physics) {
                selectedObject.userData.physics.isBeingDragged = true;
            }
            
            renderer.domElement.style.cursor = 'grabbing';
        }
    }
}

function onMouseMove(event) {
    event.preventDefault();
    
    // Update mouse coordinates
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    if (sunDragMode && isDragging) {
        // Move sun light based on mouse movement
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(window.sunLight.position);
        
        // Adjust spherical coordinates based on mouse position
        spherical.theta = mouse.x * Math.PI;
        spherical.phi = (1 - mouse.y) * Math.PI * 0.5;
        spherical.radius = 20; // Keep distance constant
        
        window.sunLight.position.setFromSpherical(spherical);
        
    } else if (selectedObject && !cuttingMode && isDragging) {
        raycaster.setFromCamera(mouse, camera);
        
        if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
            // Update drag target position
            dragTarget.addVectors(intersection, offset);
        }
    }
}

function onMouseUp(event) {
    // Release dragged object
    if (selectedObject && selectedObject.userData.physics) {
        selectedObject.userData.physics.isBeingDragged = false;
    }
    
    selectedObject = null;
    sunDragMode = false;
    isDragging = false;
    renderer.domElement.style.cursor = cuttingMode ? 'crosshair' : 'default';
}

function onRightClick(event) {
    event.preventDefault();
    cuttingMode = !cuttingMode;
    renderer.domElement.style.cursor = cuttingMode ? 'crosshair' : 'default';
    
    // Show cutting mode status
    if (cuttingMode) {
        console.log('🔪 Cutting mode enabled - click objects to slice them!');
    } else {
        console.log('✋ Dragging mode enabled - click and drag objects!');
    }
}

function onMouseWheel(event) {
    const delta = event.deltaY * 0.001;
    camera.position.multiplyScalar(1 + delta);
}

function onKeyDown(event) {
    switch (event.code) {
        case 'Space':
            resetScene();
            break;
    }
}

function cutObject(object, cutPoint) {
    if (!object.userData.physics) return;
    
    const physics = object.userData.physics;
    
    if (physics.shape === 'sphere') {
        // Cut sphere into two smaller spheres
        const radius = physics.radius * 0.7;
        const offset = radius * 0.8;
        
        createRigidSphere(
            new THREE.Vector3(
                object.position.x - offset,
                object.position.y,
                object.position.z
            ),
            radius,
            object.material.color.getHex()
        );
        
        createRigidSphere(
            new THREE.Vector3(
                object.position.x + offset,
                object.position.y,
                object.position.z
            ),
            radius,
            object.material.color.getHex()
        );
        
        removeObject(object);
        
    } else if (physics.shape === 'box') {
        // Cut box into smaller boxes
        const size = physics.size * 0.7;
        const offset = size * 0.6;
        
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const x = Math.cos(angle) * offset;
            const z = Math.sin(angle) * offset;
            
            createRigidCube(
                new THREE.Vector3(
                    object.position.x + x,
                    object.position.y,
                    object.position.z + z
                ),
                size,
                object.material.color.getHex()
            );
        }
        
        removeObject(object);
        
    } else if (physics.shape === 'compound') {
        // Jelly bean - create multiple small spheres
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const radius = 0.3;
            const distance = 1.2;
            
            createRigidSphere(
                new THREE.Vector3(
                    object.position.x + Math.cos(angle) * distance,
                    object.position.y + Math.random() * 2,
                    object.position.z + Math.sin(angle) * distance
                ),
                radius,
                0xffaa44
            );
        }
        
        removeObject(object);
    }
}

function removeObject(object) {
    const index = objects.indexOf(object);
    if (index > -1) {
        objects.splice(index, 1);
    }
    
    const worldIndex = world.objects.indexOf(object);
    if (worldIndex > -1) {
        world.objects.splice(worldIndex, 1);
    }
    
    scene.remove(object);
}

function resetScene() {
    // Remove all dynamic objects
    objects.forEach(object => {
        if (object.userData.physics && object.userData.physics.type !== 'static') {
            scene.remove(object);
        }
    });
    
    objects = objects.filter(obj => 
        obj.userData.physics && obj.userData.physics.type === 'static'
    );
    
    world.objects = world.objects.filter(obj => 
        obj.userData.physics && obj.userData.physics.type === 'static'
    );
    
    // Recreate demo objects
    createDemoObjects();
}

function updatePhysics(deltaTime) {
    world.objects.forEach(object => {
        const physics = object.userData.physics;
        if (!physics || physics.type === 'static') return;
        
        // Handle drag forces for selected objects
        if (physics.isBeingDragged && selectedObject === object) {
            applyDragForce(object, deltaTime);
        } else {
            // Apply gravity only when not being dragged
            physics.velocity.add(world.gravity.clone().multiplyScalar(deltaTime));
        }
        
        // Apply air resistance
        physics.velocity.multiplyScalar(physics.airFriction);
        physics.angularVelocity.multiplyScalar(physics.angularDamping);
        
        // Apply velocity
        object.position.add(physics.velocity.clone().multiplyScalar(deltaTime));
        
        // Apply angular velocity with proper rotation
        if (physics.angularVelocity.length() > 0.01) {
            const rotationAxis = physics.angularVelocity.clone().normalize();
            const rotationAngle = physics.angularVelocity.length() * deltaTime;
            const quaternion = new THREE.Quaternion().setFromAxisAngle(rotationAxis, rotationAngle);
            object.quaternion.multiplyQuaternions(quaternion, object.quaternion);
        }
        
        // Enhanced ground collision with realistic physics
        const groundLevel = getGroundLevel(object);
        if (object.position.y < groundLevel) {
            handleGroundCollision(object, groundLevel, deltaTime);
        }
        
        // Soft body deformation
        if (physics.type === 'soft') {
            updateSoftBodyDeformation(object, physics);
        }
        
        // Object-to-object collisions
        world.objects.forEach(other => {
            if (other === object || !other.userData.physics) return;
            
            const distance = object.position.distanceTo(other.position);
            const minDistance = getObjectRadius(object) + getObjectRadius(other);
            
            if (distance < minDistance && distance > 0) {
                resolveSimpleCollision(object, other);
            }
        });
        
        // Boundary enforcement
        enforceBoundaries(object);
    });
}

function applyDragForce(object, deltaTime) {
    const physics = object.userData.physics;
    
    // Calculate direction to drag target
    const direction = new THREE.Vector3().subVectors(dragTarget, object.position);
    const distance = direction.length();
    
    if (distance > 0.1) {
        direction.normalize();
        
        // Apply strong force towards target
        const dragStrength = 20.0;
        const targetVelocity = direction.multiplyScalar(Math.min(distance * dragStrength, 15.0));
        
        // Smoothly interpolate velocity towards target velocity
        physics.velocity.lerp(targetVelocity, 0.3);
        
        // Reduce angular velocity while dragging
        physics.angularVelocity.multiplyScalar(0.8);
    } else {
        // Close to target - slow down
        physics.velocity.multiplyScalar(0.8);
    }
}

function getGroundLevel(object) {
    const physics = object.userData.physics;
    if (physics.shape === 'sphere') {
        return physics.radius;
    } else if (physics.shape === 'box') {
        return physics.size * 0.5;
    } else if (physics.shape === 'compound') {
        return 0.8; // Approximate for jelly bean
    }
    return 0.5;
}

function handleGroundCollision(object, groundLevel, deltaTime) {
    const physics = object.userData.physics;
    
    // Position correction
    object.position.y = groundLevel;
    
    // Calculate horizontal speed first
    const horizontalSpeed = Math.sqrt(physics.velocity.x * physics.velocity.x + physics.velocity.z * physics.velocity.z);
    
    // Reflect velocity with restitution
    if (physics.velocity.y < 0) {
        physics.velocity.y = -physics.velocity.y * physics.restitution;
        
        // Apply friction to horizontal components
        physics.velocity.x *= (1 - physics.friction * deltaTime * 10);
        physics.velocity.z *= (1 - physics.friction * deltaTime * 10);
        
        // Convert linear velocity to angular velocity for rolling (only when moving fast enough)
        if (horizontalSpeed > 0.5) {
            if (physics.shape === 'sphere') {
                // Spheres roll naturally
                const rollingFactor = 0.3;
                const angularFromLinear = new THREE.Vector3(-physics.velocity.z, 0, physics.velocity.x);
                angularFromLinear.multiplyScalar(rollingFactor / physics.radius);
                physics.angularVelocity.add(angularFromLinear);
            } else if (physics.shape === 'box') {
                // Boxes tumble when moving fast
                const tumblingForce = new THREE.Vector3(
                    (Math.random() - 0.5) * horizontalSpeed * 0.5,
                    0,
                    (Math.random() - 0.5) * horizontalSpeed * 0.5
                );
                physics.angularVelocity.add(tumblingForce);
            }
        } else {
            // Stop rotation when moving slowly
            physics.angularVelocity.multiplyScalar(0.8);
        }
    }
    
    // Stop very slow movement to prevent jitter
    if (horizontalSpeed < 0.1) {
        physics.velocity.x *= 0.9;
        physics.velocity.z *= 0.9;
        physics.angularVelocity.multiplyScalar(0.9);
    }
}

function updateSoftBodyDeformation(object, physics) {
    const speed = physics.velocity.length();
    const impactDeformation = Math.min(speed * 0.15, 0.4);
    const oscillation = Math.sin(Date.now() * 0.01) * 0.05;
    
    physics.deformation = impactDeformation + oscillation;
    
    physics.parts.forEach((part, index) => {
        const phaseOffset = index * Math.PI * 0.3;
        const deformScale = 1 + physics.deformation * Math.sin(Date.now() * 0.008 + phaseOffset);
        part.scale.set(deformScale, deformScale, deformScale);
    });
}

function enforceBoundaries(object) {
    const boundary = 25;
    const dampening = 0.8;
    
    if (Math.abs(object.position.x) > boundary) {
        object.position.x = Math.sign(object.position.x) * boundary;
        object.userData.physics.velocity.x *= -dampening;
    }
    if (Math.abs(object.position.z) > boundary) {
        object.position.z = Math.sign(object.position.z) * boundary;
        object.userData.physics.velocity.z *= -dampening;
    }
    if (object.position.y > boundary) {
        object.position.y = boundary;
        object.userData.physics.velocity.y *= -dampening;
    }
}

function getObjectRadius(object) {
    const physics = object.userData.physics;
    if (physics.shape === 'sphere') return physics.radius;
    if (physics.shape === 'box') return physics.size * 0.866; // Diagonal
    if (physics.shape === 'compound') return 1.5; // Approximate
    return 1;
}

function resolveSimpleCollision(obj1, obj2) {
    const p1 = obj1.userData.physics;
    const p2 = obj2.userData.physics;
    
    if (p2.type === 'static') return;
    
    // Calculate collision normal
    const normal = new THREE.Vector3().subVectors(obj1.position, obj2.position);
    const distance = normal.length();
    normal.normalize();
    
    const minDistance = getObjectRadius(obj1) + getObjectRadius(obj2);
    const overlap = minDistance - distance;
    
    if (overlap > 0) {
        // Separate objects
        const correction = normal.clone().multiplyScalar(overlap * 0.5);
        obj1.position.add(correction);
        obj2.position.sub(correction);
        
        // Calculate relative velocity
        const relativeVelocity = new THREE.Vector3().subVectors(p1.velocity, p2.velocity);
        const velocityAlongNormal = relativeVelocity.dot(normal);
        
        // Only resolve if objects are approaching
        if (velocityAlongNormal > 0) return;
        
        // Calculate impulse
        const restitution = Math.min(p1.restitution, p2.restitution);
        const impulseScalar = -(1 + restitution) * velocityAlongNormal / (1/p1.mass + 1/p2.mass);
        
        const impulse = normal.clone().multiplyScalar(impulseScalar);
        
        p1.velocity.add(impulse.clone().multiplyScalar(1/p1.mass));
        p2.velocity.sub(impulse.clone().multiplyScalar(1/p2.mass));
        
        // Add moderate angular velocity
        const angularFactor = 0.2;
        p1.angularVelocity.add(new THREE.Vector3(
            (Math.random() - 0.5) * angularFactor,
            (Math.random() - 0.5) * angularFactor,
            (Math.random() - 0.5) * angularFactor
        ));
        p2.angularVelocity.add(new THREE.Vector3(
            (Math.random() - 0.5) * angularFactor,
            (Math.random() - 0.5) * angularFactor,
            (Math.random() - 0.5) * angularFactor
        ));
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop with proper timing
let lastTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;
let animationId = null;

function animate(currentTime = 0) {
    // Proper framerate limiting
    if (currentTime - lastTime >= frameInterval) {
        updatePhysics(timeStep);
        lastTime = currentTime;
    }
}

// Render loop
function render(currentTime = 0) {
    animationId = requestAnimationFrame(render);
    animate(currentTime);
    renderer.render(scene, camera);
}

// Expose control functions for the showcase manager
window.pausePhysics = function() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
        console.log('Physics animation paused');
    }
};

window.resumePhysics = function() {
    if (!animationId) {
        console.log('Physics animation resumed');
        render();
    }
};

// Initialize the physics simulation
initPhysics();

// Start the animation
render();

console.log('Physics simulation initialized!');
console.log('Controls:');
console.log('- Left click + drag: Move objects');
console.log('- Right click: Toggle cutting mode');
console.log('- Shift + drag: Move the sun light');
console.log('- Space: Reset scene');