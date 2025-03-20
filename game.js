import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import * as CANNON from 'cannon-es';

let camera, scene, renderer, controls;
let world;
let pizzas = [];
let chickens = [];
let score = 0;

// Movement
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let velocity = new THREE.Vector3();
const speed = 100.0;

// Physics materials
const groundMaterial = new CANNON.Material('ground');
const pizzaPhysicsMaterial = new CANNON.Material('pizza');

// Create reusable geometries and materials
const pizzaGeometry = createPizzaGeometry();
const pizzaMaterial = createPizzaMaterial();
const chickenGeometry = createChickenGeometry();
const chickenMaterial = createChickenMaterial();

function createPizzaGeometry() {
    // Create a more detailed pizza geometry
    const baseRadius = 0.5;
    const height = 0.05;
    const segments = 32;
    
    // Create base (slightly larger at bottom for crust)
    const baseGeometry = new THREE.CylinderGeometry(baseRadius, baseRadius + 0.05, height, segments);
    
    // Create an array to hold all geometries
    const geometries = [baseGeometry];
    
    // Add toppings (small spheres for pepperoni)
    for (let i = 0; i < 8; i++) {
        const toppingGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const angle = (i / 8) * Math.PI * 2;
        const radius = baseRadius * 0.7;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // Translate the topping geometry to its position
        toppingGeometry.translate(x, height/2, z);
        geometries.push(toppingGeometry);
    }
    
    // Merge all geometries using the correct import
    return BufferGeometryUtils.mergeGeometries(geometries);
}

function createPizzaMaterial() {
    // Create materials for different parts of the pizza
    const materials = [
        new THREE.MeshStandardMaterial({ 
            color: 0xf4a460,  // Base/crust color (sandy brown)
            roughness: 0.8 
        }),
        new THREE.MeshStandardMaterial({ 
            color: 0xff6347,  // Sauce color (tomato red)
            roughness: 0.7
        }),
        new THREE.MeshStandardMaterial({ 
            color: 0xffd700,  // Cheese color (golden)
            roughness: 0.5,
            metalness: 0.2
        })
    ];
    return materials[0]; // For now using just the base material
}

function createChickenGeometry() {
    const group = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    bodyGeometry.scale(1, 0.8, 1.2);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    
    // Beak
    const beakGeometry = new THREE.ConeGeometry(0.1, 0.3, 4);
    
    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
    
    // Wings
    const wingGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    wingGeometry.scale(1, 0.2, 0.8);

    return {
        body: bodyGeometry,
        head: headGeometry,
        beak: beakGeometry,
        leg: legGeometry,
        wing: wingGeometry
    };
}

function createChickenMaterial() {
    return {
        body: new THREE.MeshStandardMaterial({
            color: 0xf5f5dc,  // Beige
            roughness: 0.8
        }),
        beak: new THREE.MeshStandardMaterial({
            color: 0xffa500,  // Orange
            roughness: 0.6
        }),
        legs: new THREE.MeshStandardMaterial({
            color: 0xffa500,  // Orange
            roughness: 0.7
        })
    };
}

function createTreeGeometry() {
    const tree = new THREE.Group();
    
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1;
    tree.add(trunk);
    
    // Tree leaves (3 layers of cones)
    const leafGeometry = new THREE.ConeGeometry(1.2, 2, 8);
    const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 }); // Forest green
    
    const leaves1 = new THREE.Mesh(leafGeometry, leafMaterial);
    leaves1.position.y = 3;
    tree.add(leaves1);
    
    const leaves2 = new THREE.Mesh(leafGeometry, leafMaterial);
    leaves2.position.y = 3.8;
    leaves2.scale.set(0.8, 0.8, 0.8);
    tree.add(leaves2);
    
    const leaves3 = new THREE.Mesh(leafGeometry, leafMaterial);
    leaves3.position.y = 4.4;
    leaves3.scale.set(0.6, 0.6, 0.6);
    tree.add(leaves3);
    
    return tree;
}

function createFlowerGeometry() {
    const flower = new THREE.Group();
    
    // Stem
    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 }); // Green
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.15;
    flower.add(stem);
    
    // Petals
    const petalGeometry = new THREE.CircleGeometry(0.1, 8);
    const colors = [0xFF69B4, 0xFFFF00, 0xFF1493, 0xFFA500, 0xFF4500]; // Various flower colors
    const petalColor = colors[Math.floor(Math.random() * colors.length)];
    const petalMaterial = new THREE.MeshStandardMaterial({ 
        color: petalColor,
        side: THREE.DoubleSide 
    });
    
    // Create 5 petals
    for (let i = 0; i < 5; i++) {
        const petal = new THREE.Mesh(petalGeometry, petalMaterial);
        petal.position.y = 0.3;
        petal.rotation.y = (i / 5) * Math.PI * 2;
        petal.rotation.x = Math.PI / 4; // Tilt petals slightly
        flower.add(petal);
    }
    
    // Center of flower
    const centerGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const centerMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00 }); // Yellow center
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.position.y = 0.3;
    flower.add(center);
    
    return flower;
}

function addEnvironment() {
    // Add trees
    for (let i = 0; i < 15; i++) {
        const tree = createTreeGeometry();
        const angle = Math.random() * Math.PI * 2;
        const radius = 15 + Math.random() * 25; // Place trees between 15 and 40 units from center
        tree.position.x = Math.cos(angle) * radius;
        tree.position.z = Math.sin(angle) * radius;
        scene.add(tree);
    }
    
    // Add flowers
    for (let i = 0; i < 50; i++) {
        const flower = createFlowerGeometry();
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 35; // Scatter flowers within 35 units from center
        flower.position.x = Math.cos(angle) * radius;
        flower.position.z = Math.sin(angle) * radius;
        scene.add(flower);
    }
}

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 2;

    // Renderer setup
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Controls
    controls = new PointerLockControls(camera, document.body);
    
    // Click to start
    document.addEventListener('click', function() {
        controls.lock();
    });

    // Physics world
    world = new CANNON.World({
        gravity: new CANNON.Vec3(0, -9.82, 0)
    });

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x33aa33 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Ground physics
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
        mass: 0,
        shape: groundShape,
        material: groundMaterial
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    // Add trees and flowers after ground creation but before chicken spawning
    addEnvironment();

    // Add some initial chickens
    for (let i = 0; i < 5; i++) {
        spawnChicken();
    }

    // Event listeners
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('click', throwPizza, false);

    // Movement controls
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);
}

function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
}

function updateMovement(delta) {
    if (controls.isLocked) {
        velocity.x = 0;
        velocity.z = 0;

        if (moveForward) velocity.z = -1;
        if (moveBackward) velocity.z = 1;
        if (moveLeft) velocity.x = -1;
        if (moveRight) velocity.x = 1;

        velocity.normalize(); // Ensure consistent movement in all directions
        velocity.multiplyScalar(delta * speed);

        controls.moveRight(velocity.x);
        controls.moveForward(-velocity.z);
    }
}

function spawnChicken() {
    const chicken = new THREE.Group();
    
    // Body
    const body = new THREE.Mesh(chickenGeometry.body, chickenMaterial.body);
    chicken.add(body);
    
    // Head
    const head = new THREE.Mesh(chickenGeometry.head, chickenMaterial.body);
    head.position.set(0, 0.7, 0.4);
    chicken.add(head);
    
    // Beak
    const beak = new THREE.Mesh(chickenGeometry.beak, chickenMaterial.beak);
    beak.position.set(0, 0.7, 0.7);
    beak.rotation.x = -Math.PI / 2;
    chicken.add(beak);
    
    // Legs
    const leftLeg = new THREE.Mesh(chickenGeometry.leg, chickenMaterial.legs);
    leftLeg.position.set(0.2, -0.5, 0);
    chicken.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(chickenGeometry.leg, chickenMaterial.legs);
    rightLeg.position.set(-0.2, -0.5, 0);
    chicken.add(rightLeg);
    
    // Wings
    const leftWing = new THREE.Mesh(chickenGeometry.wing, chickenMaterial.body);
    leftWing.position.set(0.5, 0, 0);
    leftWing.rotation.z = Math.PI / 6;
    chicken.add(leftWing);
    
    const rightWing = new THREE.Mesh(chickenGeometry.wing, chickenMaterial.body);
    rightWing.position.set(-0.5, 0, 0);
    rightWing.rotation.z = -Math.PI / 6;
    chicken.add(rightWing);
    
    // Random position
    chicken.position.x = Math.random() * 40 - 20;
    chicken.position.z = Math.random() * 40 - 20;
    chicken.position.y = 0.5;
    
    scene.add(chicken);
    chickens.push({
        mesh: chicken,
        direction: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize()
    });
}

function throwPizza() {
    if (!controls.isLocked) return;

    const pizza = new THREE.Mesh(pizzaGeometry, pizzaMaterial);
    
    // Set initial position to camera position
    pizza.position.copy(camera.position);
    
    // Get direction vector from camera
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    // Rotate pizza to face the direction it's flying
    pizza.rotation.x = Math.PI / 2;
    
    // Create physics body for pizza
    const pizzaShape = new CANNON.Cylinder(0.5, 0.5, 0.05, 32);
    const pizzaBody = new CANNON.Body({
        mass: 1,
        shape: pizzaShape,
        material: pizzaPhysicsMaterial
    });
    
    pizzaBody.position.copy(pizza.position);
    pizzaBody.velocity.copy(direction.multiplyScalar(20));
    
    scene.add(pizza);
    world.addBody(pizzaBody);
    pizzas.push({ mesh: pizza, body: pizzaBody });
}

function updatePizzas() {
    for (let i = pizzas.length - 1; i >= 0; i--) {
        const pizza = pizzas[i];
        pizza.mesh.position.copy(pizza.body.position);
        pizza.mesh.quaternion.copy(pizza.body.quaternion);

        // Check for collisions with chickens
        chickens.forEach((chicken, chickenIndex) => {
            const distance = pizza.mesh.position.distanceTo(chicken.mesh.position);
            if (distance < 1) {
                // Hit!
                scene.remove(chicken.mesh);
                chickens.splice(chickenIndex, 1);
                scene.remove(pizza.mesh);
                world.removeBody(pizza.body);
                pizzas.splice(i, 1);
                score += 100;
                document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
                spawnChicken(); // Spawn a new chicken
            }
        });

        // Remove pizzas that hit the ground (y ≈ 0) or fall below
        if (pizza.mesh.position.y <= 0.1) {
            scene.remove(pizza.mesh);
            world.removeBody(pizza.body);
            pizzas.splice(i, 1);
        }
    }
}

function updateChickens() {
    chickens.forEach(chicken => {
        // Simple movement - chickens walk around randomly
        chicken.mesh.position.x += chicken.direction.x * 0.05;
        chicken.mesh.position.z += chicken.direction.z * 0.05;

        // Keep chickens in bounds
        if (Math.abs(chicken.mesh.position.x) > 20 || Math.abs(chicken.mesh.position.z) > 20) {
            chicken.direction.multiplyScalar(-1);
        }
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    const delta = 0.016; // Approximately 60 FPS
    
    // Update physics
    world.step(1/60);
    
    // Update movement
    updateMovement(delta);
    
    // Update game objects
    updatePizzas();
    updateChickens();
    
    renderer.render(scene, camera);
}

init();
animate();
