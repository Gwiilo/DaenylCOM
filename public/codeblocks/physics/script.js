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

// Camera orbit controls
let isOrbitMode = false;
let lastMousePosition = { x: 0, y: 0 };
let cameraDistance = 15;
let cameraAngles = { theta: 0, phi: Math.PI * 0.3 };

// Cutting system variables
let cuttingStartPoint = null;
let cuttingEndPoint = null;
let cuttingPath = [];
let cuttingLine = null;
let isDrawingCut = false;

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

    // Position camera with orbital setup
    cameraDistance = 15;
    updateCameraPosition();

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
    createRigidSphere(new THREE.Vector3(-2, 5, 0), 1, 0xff4444);
    
    // Create demo cube
    createRigidCube(new THREE.Vector3(2, 5, 0), 1.5, 0x44ff44);
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
    
    lastMousePosition.x = event.clientX;
    lastMousePosition.y = event.clientY;
    
    raycaster.setFromCamera(mouse, camera);
    
    // Check for sun dragging mode (hold Shift)
    if (event.shiftKey) {
        sunDragMode = true;
        isDragging = true;
        renderer.domElement.style.cursor = 'move';
        return;
    }
    
    if (cuttingMode) {
        // Start drawing cutting line
        startCuttingLine();
    } else {
        // Check for object intersection for dragging
        const intersects = raycaster.intersectObjects(objects, true);
        
        if (intersects.length > 0) {
            selectedObject = intersects[0].object;
            isDragging = true;
            
            // Find the root object if it's part of a group
            while (selectedObject.parent && selectedObject.parent.userData && selectedObject.parent.userData.physics) {
                selectedObject = selectedObject.parent;
            }
            
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
        } else {
            // No object selected - start camera orbit mode
            isOrbitMode = true;
            renderer.domElement.style.cursor = 'grab';
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
        
    } else if (isOrbitMode) {
        // Handle camera orbit
        const deltaX = event.clientX - lastMousePosition.x;
        const deltaY = event.clientY - lastMousePosition.y;
        
        cameraAngles.theta -= deltaX * 0.01;
        cameraAngles.phi += deltaY * 0.01;
        
        // Constrain phi to avoid flipping
        cameraAngles.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraAngles.phi));
        
        updateCameraPosition();
        
        lastMousePosition.x = event.clientX;
        lastMousePosition.y = event.clientY;
        
    } else if (cuttingMode && isDrawingCut) {
        // Continue drawing cutting line
        updateCuttingLine();
        
    } else if (selectedObject && !cuttingMode && isDragging) {
        raycaster.setFromCamera(mouse, camera);
        
        if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
            // Update drag target position
            dragTarget.addVectors(intersection, offset);
        }
    }
}

function onMouseUp(event) {
    if (cuttingMode && isDrawingCut) {
        // Finish cutting line and perform the cut
        finishCuttingLine();
    }
    
    // Release dragged object
    if (selectedObject && selectedObject.userData.physics) {
        selectedObject.userData.physics.isBeingDragged = false;
    }
    
    selectedObject = null;
    sunDragMode = false;
    isDragging = false;
    isOrbitMode = false;
    renderer.domElement.style.cursor = cuttingMode ? 'crosshair' : 'default';
}

function onRightClick(event) {
    event.preventDefault();
    cuttingMode = !cuttingMode;
    renderer.domElement.style.cursor = cuttingMode ? 'crosshair' : 'default';
    
    // Clear any existing cutting line when switching modes
    if (!cuttingMode) {
        clearCuttingLine();
    }
    
    // Show cutting mode status
    if (cuttingMode) {
        console.log('🔪 Cutting mode enabled - drag across objects to slice them!');
    } else {
        console.log('✋ Dragging mode enabled - click and drag objects!');
    }
}

function onMouseWheel(event) {
    const delta = event.deltaY * 0.001;
    cameraDistance *= (1 + delta);
    cameraDistance = Math.max(5, Math.min(50, cameraDistance)); // Constrain zoom
    updateCameraPosition();
}

function updateCameraPosition() {
    const x = cameraDistance * Math.sin(cameraAngles.phi) * Math.cos(cameraAngles.theta);
    const y = cameraDistance * Math.cos(cameraAngles.phi);
    const z = cameraDistance * Math.sin(cameraAngles.phi) * Math.sin(cameraAngles.theta);
    
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
}

function onKeyDown(event) {
    switch (event.code) {
        case 'Space':
            resetScene();
            break;
        case 'Escape':
            if (cuttingMode) {
                clearCuttingLine();
            }
            break;
    }
}

// Advanced cutting system functions
function startCuttingLine() {
    // Start with current mouse position
    cuttingPath = [];
    isDrawingCut = true;
    
    // Add first point
    addCuttingPoint();
    
    // Create visual cutting line
    createCuttingLineVisual();
}

function updateCuttingLine() {
    if (!isDrawingCut) return;
    
    // Add new point to cutting path
    addCuttingPoint();
    updateCuttingLineVisual();
}

function addCuttingPoint() {
    // Raycast from current mouse position to find world intersection
    raycaster.setFromCamera(mouse, camera);
    
    // First, try to intersect with existing objects
    const objectIntersects = raycaster.intersectObjects(objects, true);
    
    if (objectIntersects.length > 0) {
        // Use intersection point on object surface
        const intersectionPoint = objectIntersects[0].point.clone();
        
        // Only add if far enough from last point
        if (cuttingPath.length === 0 || 
            cuttingPath[cuttingPath.length - 1].distanceTo(intersectionPoint) > 0.1) {
            cuttingPath.push(intersectionPoint);
        }
    } else {
        // If no object intersection, project to a plane in front of camera
        const projectionDistance = 10;
        const worldPoint = raycaster.ray.at(projectionDistance, new THREE.Vector3());
        
        // Only add if far enough from last point
        if (cuttingPath.length === 0 || 
            cuttingPath[cuttingPath.length - 1].distanceTo(worldPoint) > 0.1) {
            cuttingPath.push(worldPoint);
        }
    }
}

function finishCuttingLine() {
    if (!isDrawingCut || cuttingPath.length < 2) {
        clearCuttingLine();
        return;
    }
    
    // Find objects that intersect with the cutting line using proper raycasting
    const objectsToCut = findObjectsAlongCuttingLineRaycast();
    
    // Perform the cutting operation on each object
    objectsToCut.forEach(objectInfo => {
        performAdvancedCut(objectInfo.object, objectInfo.intersectionPoints);
    });
    
    // Clear the cutting line
    clearCuttingLine();
}

function createCuttingLineVisual() {
    if (cuttingLine) {
        scene.remove(cuttingLine);
    }
    
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({ 
        color: 0xff0000, 
        linewidth: 3,
        transparent: true,
        opacity: 0.8
    });
    
    cuttingLine = new THREE.Line(geometry, material);
    scene.add(cuttingLine);
}

function updateCuttingLineVisual() {
    if (!cuttingLine || cuttingPath.length < 2) return;
    
    const points = cuttingPath.map(point => point.clone());
    cuttingLine.geometry.setFromPoints(points);
}

function clearCuttingLine() {
    if (cuttingLine) {
        scene.remove(cuttingLine);
        cuttingLine = null;
    }
    cuttingStartPoint = null;
    cuttingEndPoint = null;
    cuttingPath = [];
    isDrawingCut = false;
}

function findObjectsAlongCuttingLineRaycast() {
    const objectsToCut = [];
    const processedObjects = new Set();
    
    // For each point in the cutting path, cast a ray through the scene
    cuttingPath.forEach((pathPoint, index) => {
        // Calculate screen position for this world point
        const screenPosition = worldToScreen(pathPoint);
        
        // Create raycaster from camera through this screen position
        const pointRaycaster = new THREE.Raycaster();
        pointRaycaster.setFromCamera(screenPosition, camera);
        
        // Find all objects intersected by this ray
        const intersects = pointRaycaster.intersectObjects(objects, true);
        
        intersects.forEach(intersect => {
            let targetObject = intersect.object;
            
            // Find root object
            while (targetObject.parent && targetObject.parent.userData && targetObject.parent.userData.physics) {
                targetObject = targetObject.parent;
            }
            
            // Skip if we've already processed this object
            if (processedObjects.has(targetObject)) {
                return;
            }
            
            // Check if the intersection point is close to our cutting path
            const distanceToPath = getDistanceToPath(intersect.point);
            
            if (distanceToPath < 2.0) { // Within 2 units of the cutting path
                processedObjects.add(targetObject);
                
                // Find the best intersection point for this object
                const bestIntersection = findBestIntersectionForObject(targetObject);
                
                if (bestIntersection) {
                    objectsToCut.push({
                        object: targetObject,
                        intersectionPoints: [bestIntersection]
                    });
                }
            }
        });
    });
    
    return objectsToCut;
}

function worldToScreen(worldPoint) {
    const vector = worldPoint.clone();
    vector.project(camera);
    
    return new THREE.Vector2(vector.x, vector.y);
}

function getDistanceToPath(point) {
    let minDistance = Infinity;
    
    // Check distance to each segment of the cutting path
    for (let i = 0; i < cuttingPath.length - 1; i++) {
        const segmentStart = cuttingPath[i];
        const segmentEnd = cuttingPath[i + 1];
        
        const distance = distanceToLineSegment(point, segmentStart, segmentEnd);
        minDistance = Math.min(minDistance, distance);
    }
    
    return minDistance;
}

function distanceToLineSegment(point, lineStart, lineEnd) {
    const line = new THREE.Vector3().subVectors(lineEnd, lineStart);
    const lineLength = line.length();
    
    if (lineLength === 0) {
        return point.distanceTo(lineStart);
    }
    
    const t = Math.max(0, Math.min(1, 
        new THREE.Vector3().subVectors(point, lineStart).dot(line) / (lineLength * lineLength)
    ));
    
    const projection = lineStart.clone().add(line.multiplyScalar(t));
    return point.distanceTo(projection);
}

function findBestIntersectionForObject(targetObject) {
    let bestIntersection = null;
    let minDistance = Infinity;
    
    // Cast rays through multiple points along the cutting path to find the best intersection
    for (let i = 0; i < cuttingPath.length; i++) {
        const pathPoint = cuttingPath[i];
        const screenPos = worldToScreen(pathPoint);
        
        const testRaycaster = new THREE.Raycaster();
        testRaycaster.setFromCamera(screenPos, camera);
        
        const intersects = testRaycaster.intersectObjects([targetObject], true);
        
        if (intersects.length > 0) {
            const intersection = intersects[0];
            let rootObject = intersection.object;
            
            // Find root object
            while (rootObject.parent && rootObject.parent.userData && rootObject.parent.userData.physics) {
                rootObject = rootObject.parent;
            }
            
            if (rootObject === targetObject) {
                const distanceToPath = getDistanceToPath(intersection.point);
                if (distanceToPath < minDistance) {
                    minDistance = distanceToPath;
                    bestIntersection = intersection.point.clone();
                }
            }
        }
    }
    
    return bestIntersection;
}

function performAdvancedCut(object, intersectionPoints) {
    if (!object.userData.physics || intersectionPoints.length === 0) return;
    
    const physics = object.userData.physics;
    
    // Calculate cutting plane from intersection points
    const cuttingPlane = calculateCuttingPlane(object, intersectionPoints);
    
    if (physics.shape === 'sphere') {
        cutSphereWithPlane(object, cuttingPlane);
    } else if (physics.shape === 'box') {
        cutBoxWithPlane(object, cuttingPlane);
    } else if (physics.shape === 'compound') {
        cutCompoundWithPlane(object, cuttingPlane);
    }
}

function calculateCuttingPlane(object, intersectionPoints) {
    // Calculate cutting direction from the cutting line path
    let cuttingDirection = new THREE.Vector3();
    
    if (cuttingPath.length >= 2) {
        // Use the direction of the cutting line
        const startPoint = cuttingPath[0];
        const endPoint = cuttingPath[cuttingPath.length - 1];
        cuttingDirection = new THREE.Vector3().subVectors(endPoint, startPoint).normalize();
        
        // Create perpendicular normal to the cutting line (cutting plane normal)
        const cameraDirection = camera.getWorldDirection(new THREE.Vector3());
        const normal = new THREE.Vector3().crossVectors(cuttingDirection, cameraDirection).normalize();
        
        console.log('📐 Cutting direction:', cuttingDirection);
        console.log('📐 Cutting normal:', normal);
        
        return {
            point: intersectionPoints[0],
            normal: normal,
            cuttingDirection: cuttingDirection,
            localPoint: object.worldToLocal(intersectionPoints[0].clone()),
            localNormal: object.worldToLocal(normal.clone().add(object.position)).sub(object.worldToLocal(object.position.clone()))
        };
    }
    
    // Fallback to camera direction if cutting path is too short
    const normal = camera.getWorldDirection(new THREE.Vector3());
    return {
        point: intersectionPoints[0],
        normal: normal,
        cuttingDirection: normal.clone(),
        localPoint: object.worldToLocal(intersectionPoints[0].clone()),
        localNormal: object.worldToLocal(normal.clone().add(object.position)).sub(object.worldToLocal(object.position.clone()))
    };
}

function cutSphereWithPlane(sphere, cuttingPlane) {
    const physics = sphere.userData.physics;
    const radius = physics.radius;
    const originalColor = sphere.material.color.getHex();
    const originalVelocity = physics.velocity.clone();
    const originalAngularVelocity = physics.angularVelocity.clone();
    const originalPosition = sphere.position.clone();
    
    console.log('🔪 Cutting sphere with plane at position:', originalPosition);
    
    // Remove original object FIRST
    removeObject(sphere);
    
    // For spheres, we'll create hemisphere-like shapes using custom geometry
    const cutDirection = cuttingPlane.normal.clone().normalize();
    
    // Create two cut pieces with custom geometry
    createSphereCutPiece(originalPosition, radius, originalColor, originalVelocity, originalAngularVelocity, cutDirection, 1);
    createSphereCutPiece(originalPosition, radius, originalColor, originalVelocity, originalAngularVelocity, cutDirection, -1);
    
    console.log('✅ Created two sphere cut pieces');
}

function createSphereCutPiece(position, radius, color, velocity, angularVelocity, cutDirection, side) {
    // Create a cut sphere piece using custom geometry with interior faces
    const phiStart = 0;
    const phiLength = Math.PI * 2;
    const thetaStart = side > 0 ? 0 : Math.PI * 0.4;
    const thetaLength = Math.PI * 0.6;
    
    const geometry = new THREE.SphereGeometry(radius * 0.8, 16, 16, phiStart, phiLength, thetaStart, thetaLength);
    
    // Add interior faces for the cut surface
    addSphereCutSurface(geometry, radius * 0.8, side);
    
    const material = new THREE.MeshPhysicalMaterial({
        color: color, // Use the passed color directly
        metalness: 0.0,
        roughness: 0.7,
        clearcoat: 0.1,
        clearcoatRoughness: 0.8,
        side: THREE.DoubleSide // Show both sides of faces
    });
    
    const piece = new THREE.Mesh(geometry, material);
    
    // Position the piece offset from the cutting plane (reduced velocity)
    const offset = cutDirection.clone().multiplyScalar(radius * 0.2 * side);
    piece.position.copy(position).add(offset);
    
    piece.castShadow = true;
    piece.receiveShadow = true;
    scene.add(piece);

    // Physics properties for the cut piece - mark as cut piece for recursive cutting
    piece.userData.physics = {
        type: 'rigid',
        mass: radius * radius * radius * 4.18 * 400,
        velocity: velocity.clone().add(cutDirection.clone().multiplyScalar(side * 1.5)), // Reduced from 3 to 1.5
        angularVelocity: angularVelocity.clone().add(new THREE.Vector3(
            (Math.random() - 0.5) * 2, // Reduced from 4 to 2
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        )),
        restitution: 0.6,
        friction: 0.5,
        airFriction: 0.995,
        angularDamping: 0.98,
        radius: radius * 0.8,
        shape: 'sphere',
        momentOfInertia: (2/5) * radius * radius * radius * 4.18 * 400 * radius * radius,
        isBeingDragged: false,
        dragForce: 15.0,
        maxDragVelocity: 8.0,
        isCutPiece: true, // Mark as cut piece for recursive cutting
        originalRadius: radius // Store original size for reference
    };

    objects.push(piece);
    world.objects.push(piece);
    return piece;
}

function addSphereCutSurface(geometry, radius, side) {
    // Add flat circular surface to show the interior of the cut
    const positions = geometry.attributes.position.array;
    const normals = geometry.attributes.normals?.array;
    const uvs = geometry.attributes.uv.array;
    
    // Create circular flat surface
    const segments = 16;
    const centerY = side > 0 ? -radius * 0.4 : radius * 0.4;
    
    // Add vertices for the flat circular surface
    const newPositions = [];
    const newNormals = [];
    const newUvs = [];
    
    // Center vertex
    newPositions.push(0, centerY, 0);
    newNormals.push(0, side > 0 ? -1 : 1, 0);
    newUvs.push(0.5, 0.5);
    
    // Ring vertices
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.cos(angle) * radius * 0.6;
        const z = Math.sin(angle) * radius * 0.6;
        
        newPositions.push(x, centerY, z);
        newNormals.push(0, side > 0 ? -1 : 1, 0);
        newUvs.push(0.5 + Math.cos(angle) * 0.5, 0.5 + Math.sin(angle) * 0.5);
    }
    
    // Combine with existing geometry
    const totalPositions = new Float32Array(positions.length + newPositions.length);
    totalPositions.set(positions);
    totalPositions.set(newPositions, positions.length);
    
    const totalNormals = new Float32Array((normals?.length || 0) + newNormals.length);
    if (normals) totalNormals.set(normals);
    totalNormals.set(newNormals, normals?.length || 0);
    
    const totalUvs = new Float32Array(uvs.length + newUvs.length);
    totalUvs.set(uvs);
    totalUvs.set(newUvs, uvs.length);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(totalPositions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(totalNormals, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(totalUvs, 2));
}

function cutBoxWithPlane(box, cuttingPlane) {
    const physics = box.userData.physics;
    const size = physics.size;
    const originalColor = box.material.color.getHex();
    const originalVelocity = physics.velocity.clone();
    const originalAngularVelocity = physics.angularVelocity.clone();
    const originalPosition = box.position.clone();
    
    console.log('🔪 Cutting box with plane at position:', originalPosition);
    
    // Remove original object FIRST
    removeObject(box);
    
    // Calculate cutting plane in local coordinates
    const cutDirection = cuttingPlane.normal.clone().normalize();
    
    // Determine which axis the cut is closest to
    const absX = Math.abs(cutDirection.x);
    const absY = Math.abs(cutDirection.y);
    const absZ = Math.abs(cutDirection.z);
    
    if (absX > absY && absX > absZ) {
        // Cut along X axis - create left and right pieces
        createBoxCutPiece(originalPosition, size, originalColor, originalVelocity, originalAngularVelocity, 'x', -1);
        createBoxCutPiece(originalPosition, size, originalColor, originalVelocity, originalAngularVelocity, 'x', 1);
    } else if (absY > absZ) {
        // Cut along Y axis - create top and bottom pieces
        createBoxCutPiece(originalPosition, size, originalColor, originalVelocity, originalAngularVelocity, 'y', -1);
        createBoxCutPiece(originalPosition, size, originalColor, originalVelocity, originalAngularVelocity, 'y', 1);
    } else {
        // Cut along Z axis - create front and back pieces
        createBoxCutPiece(originalPosition, size, originalColor, originalVelocity, originalAngularVelocity, 'z', -1);
        createBoxCutPiece(originalPosition, size, originalColor, originalVelocity, originalAngularVelocity, 'z', 1);
    }
    
    console.log('✅ Created two box cut pieces');
}

function createBoxCutPiece(position, size, color, velocity, angularVelocity, axis, side) {
    // Create geometry for cut piece with interior faces
    let geometry;
    const cutRatio = 0.6;
    
    if (axis === 'x') {
        geometry = new THREE.BoxGeometry(size * cutRatio, size, size);
    } else if (axis === 'y') {
        geometry = new THREE.BoxGeometry(size, size * cutRatio, size);
    } else {
        geometry = new THREE.BoxGeometry(size, size, size * cutRatio);
    }
    
    // Add interior surface to show the cut
    addBoxCutSurface(geometry, size, axis, side);
    
    const material = new THREE.MeshPhysicalMaterial({
        color: color, // Use the passed color directly
        metalness: 0.0,
        roughness: 0.8,
        clearcoat: 0.1,
        clearcoatRoughness: 0.9,
        side: THREE.DoubleSide // Show both sides of faces
    });
    
    const piece = new THREE.Mesh(geometry, material);
    
    // Position the piece offset from the cutting plane (reduced offset)
    const offset = new THREE.Vector3();
    const offsetDistance = size * 0.15; // Reduced from 0.25
    
    if (axis === 'x') {
        offset.x = offsetDistance * side;
    } else if (axis === 'y') {
        offset.y = offsetDistance * side;
    } else {
        offset.z = offsetDistance * side;
    }
    
    piece.position.copy(position).add(offset);
    piece.castShadow = true;
    piece.receiveShadow = true;
    scene.add(piece);

    // Physics properties for the cut piece - mark as cut piece for recursive cutting
    const pieceSize = size * cutRatio;
    piece.userData.physics = {
        type: 'rigid',
        mass: pieceSize * pieceSize * pieceSize * 400,
        velocity: velocity.clone().add(offset.clone().normalize().multiplyScalar(2)), // Reduced from 4 to 2
        angularVelocity: angularVelocity.clone().add(new THREE.Vector3(
            (Math.random() - 0.5) * 1.5, // Reduced from 3 to 1.5
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.5) * 1.5
        )),
        restitution: 0.4,
        friction: 0.7,
        airFriction: 0.995,
        angularDamping: 0.98,
        size: pieceSize,
        shape: 'box',
        momentOfInertia: (1/6) * pieceSize * pieceSize * pieceSize * 400 * (pieceSize * pieceSize + pieceSize * pieceSize),
        isBeingDragged: false,
        dragForce: 15.0,
        maxDragVelocity: 8.0,
        isCutPiece: true, // Mark as cut piece for recursive cutting
        originalSize: size // Store original size for reference
    };

    objects.push(piece);
    world.objects.push(piece);
    return piece;
}

function addBoxCutSurface(geometry, size, axis, side) {
    // Add flat rectangular surface to show the interior of the cut
    const positions = geometry.attributes.position.array;
    const normals = geometry.attributes.normals?.array;
    const uvs = geometry.attributes.uv.array;
    
    // Create flat rectangular surface on the cut side
    const newPositions = [];
    const newNormals = [];
    const newUvs = [];
    
    const halfSize = size * 0.5;
    
    if (axis === 'x') {
        const x = side > 0 ? -halfSize * 0.6 : halfSize * 0.6;
        // Add rectangular face
        newPositions.push(x, -halfSize, -halfSize, x, halfSize, -halfSize, x, halfSize, halfSize, x, -halfSize, halfSize);
        for (let i = 0; i < 4; i++) {
            newNormals.push(side > 0 ? -1 : 1, 0, 0);
        }
        newUvs.push(0, 0, 1, 0, 1, 1, 0, 1);
    } else if (axis === 'y') {
        const y = side > 0 ? -halfSize * 0.6 : halfSize * 0.6;
        newPositions.push(-halfSize, y, -halfSize, halfSize, y, -halfSize, halfSize, y, halfSize, -halfSize, y, halfSize);
        for (let i = 0; i < 4; i++) {
            newNormals.push(0, side > 0 ? -1 : 1, 0);
        }
        newUvs.push(0, 0, 1, 0, 1, 1, 0, 1);
    } else {
        const z = side > 0 ? -halfSize * 0.6 : halfSize * 0.6;
        newPositions.push(-halfSize, -halfSize, z, halfSize, -halfSize, z, halfSize, halfSize, z, -halfSize, halfSize, z);
        for (let i = 0; i < 4; i++) {
            newNormals.push(0, 0, side > 0 ? -1 : 1);
        }
        newUvs.push(0, 0, 1, 0, 1, 1, 0, 1);
    }
    
    // Combine with existing geometry
    const totalPositions = new Float32Array(positions.length + newPositions.length);
    totalPositions.set(positions);
    totalPositions.set(newPositions, positions.length);
    
    const totalNormals = new Float32Array((normals?.length || 0) + newNormals.length);
    if (normals) totalNormals.set(normals);
    totalNormals.set(newNormals, normals?.length || 0);
    
    const totalUvs = new Float32Array(uvs.length + newUvs.length);
    totalUvs.set(uvs);
    totalUvs.set(newUvs, uvs.length);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(totalPositions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(totalNormals, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(totalUvs, 2));
}

function cutCompoundWithPlane(compound, cuttingPlane) {
    const originalPosition = compound.position.clone();
    const originalVelocity = compound.userData.physics.velocity.clone();
    
    console.log('🔪 Cutting jelly bean with plane at position:', originalPosition);
    
    // Remove original object FIRST
    removeObject(compound);
    
    // For compound objects like jelly bean, create realistic cut pieces
    // Split into two main pieces along the cutting plane
    const cutDirection = cuttingPlane.normal.clone().normalize();
    
    // Create two irregular jelly bean halves
    createJellybeanCutPiece(originalPosition, originalVelocity, cutDirection, 1);
    createJellybeanCutPiece(originalPosition, originalVelocity, cutDirection, -1);
    
    // Add some small fragments for dramatic effect
    const numFragments = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numFragments; i++) {
        const angle = (i / numFragments) * Math.PI * 2;
        const radius = 0.3 + Math.random() * 0.3;
        const fragmentRadius = 0.08 + Math.random() * 0.1;
        
        const fragmentPosition = originalPosition.clone().add(new THREE.Vector3(
            Math.cos(angle) * radius,
            (Math.random() - 0.5) * 0.8,
            Math.sin(angle) * radius
        ));
        
        const fragment = createRigidSphere(fragmentPosition, fragmentRadius, 0xffaa44);
        
        // Add velocity based on original velocity plus explosion
        const explosionVelocity = new THREE.Vector3(
            Math.cos(angle) * 3,
            Math.random() * 2 + 1,
            Math.sin(angle) * 3
        );
        fragment.userData.physics.velocity.copy(originalVelocity).add(explosionVelocity);
        fragment.userData.physics.angularVelocity.set(
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6
        );
    }
    
    console.log('✅ Created jellybean cut pieces and fragments');
}

function createJellybeanCutPiece(position, velocity, cutDirection, side) {
    // Create an elongated piece that looks like half a jelly bean
    const group = new THREE.Group();
    const jellyBeanParts = [];
    
    // Scale factor for the cut piece
    const scaleFactor = 0.7;
    
    // Main body (half sphere on one side)
    const bodyGeometry = new THREE.SphereGeometry(0.6 * scaleFactor, 12, 12, 0, Math.PI * 2, 0, Math.PI * (side > 0 ? 0.8 : 0.6));
    const jellyMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffff44,
        metalness: 0.0,
        roughness: 0.4,
        transmission: 0.05,
        thickness: 0.3,
        clearcoat: 0.3,
        clearcoatRoughness: 0.7,
        side: THREE.DoubleSide // Show interior faces
    });
    
    const body = new THREE.Mesh(bodyGeometry, jellyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    jellyBeanParts.push(body);
    
    // Add an elongated part
    const elongatedGeometry = new THREE.SphereGeometry(0.4 * scaleFactor, 10, 10);
    elongatedGeometry.scale(1, side > 0 ? 1.5 : 0.8, 1);
    const elongated = new THREE.Mesh(elongatedGeometry, jellyMaterial.clone());
    elongated.position.y = side * 0.4 * scaleFactor;
    elongated.castShadow = true;
    elongated.receiveShadow = true;
    group.add(elongated);
    jellyBeanParts.push(elongated);
    
    // Position the piece offset from the cutting plane
    const offset = cutDirection.clone().multiplyScalar(0.8 * side);
    group.position.copy(position).add(offset);
    scene.add(group);

    // Physics properties for the cut piece - mark as cut piece for recursive cutting
    group.userData.physics = {
        type: 'soft',
        mass: 300,
        velocity: velocity.clone().add(cutDirection.clone().multiplyScalar(side * 3)),
        angularVelocity: new THREE.Vector3(
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4
        ),
        restitution: 0.8,
        friction: 0.3,
        airFriction: 0.995,
        angularDamping: 0.95,
        stiffness: 0.3,
        damping: 0.1,
        parts: jellyBeanParts,
        shape: 'compound',
        deformation: 0,
        momentOfInertia: 200,
        isBeingDragged: false,
        dragForce: 12.0,
        maxDragVelocity: 7.0,
        isCutPiece: true // Mark as cut piece for recursive cutting
    };

    objects.push(group);
    world.objects.push(group);
    return group;
}

function removeObject(object) {
    console.log('🗑️ Removing object from scene:', object.userData.physics?.shape || 'unknown');
    
    // Remove from objects array
    const index = objects.indexOf(object);
    if (index > -1) {
        objects.splice(index, 1);
        console.log('  ✅ Removed from objects array');
    } else {
        console.log('  ⚠️ Object not found in objects array');
    }
    
    // Remove from world.objects array
    const worldIndex = world.objects.indexOf(object);
    if (worldIndex > -1) {
        world.objects.splice(worldIndex, 1);
        console.log('  ✅ Removed from world.objects array');
    } else {
        console.log('  ⚠️ Object not found in world.objects array');
    }
    
    // Remove from scene
    scene.remove(object);
    console.log('  ✅ Removed from scene');
    
    // If this was the selected object, clear selection
    if (selectedObject === object) {
        selectedObject = null;
        console.log('  ✅ Cleared selection');
    }
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
console.log('- In cutting mode: Drag across objects to slice them');
console.log('- Shift + drag: Move the sun light');
console.log('- Space: Reset scene');
console.log('- Escape: Cancel cutting line');