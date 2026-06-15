// --- Scene Setup ---
const canvas = document.querySelector('#bg-canvas');
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.2, 2.5); // Placed slightly above and back

// Renderer setup
const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Lights - Tweaked to make the UR5's metal look great
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, 7);
const techLight = new THREE.PointLight(0x00ffcc, 2, 10); // Futuristic cyan accent
techLight.position.set(-2, 2, 2);
scene.add(ambientLight, directionalLight, techLight);

// --- URDF Loader ---
let robot;
const manager = new THREE.LoadingManager();
const loader = new URDFLoader(manager);

// Load the URDF
loader.load('assets/models/ur5/urdf/ur5.urdf', result => {
    robot = result;
    
    // ROS uses Z-up, Three.js uses Y-up. Rotate the robot to stand upright.
    robot.rotation.x = -Math.PI / 2;
    
    // Position it nicely in the background
    robot.position.set(0.5, -0.5, -1); 
    
    scene.add(robot);
});

// --- Mouse Tracking Logic ---
const mouse = new THREE.Vector2();
let targetX = 0;
let targetY = 0;

window.addEventListener('mousemove', (event) => {
    // Normalize mouse coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    // Smoothly interpolate target values for organic movement
    targetX += (mouse.x - targetX) * 0.05;
    targetY += (mouse.y - targetY) * 0.05;

    if (robot) {
        // --- Pseudo-IK for Initial Prototype ---
        
        if (robot.joints['shoulder_pan_joint']) {
            // Turn the base towards the mouse
            robot.joints['shoulder_pan_joint'].setJointValue(targetX * Math.PI);
            
            // Lean the shoulder forward/backward based on Y
            robot.joints['shoulder_lift_joint'].setJointValue(-Math.PI / 2 + (targetY * 0.5));
            
            // Adjust the elbow to "reach"
            robot.joints['elbow_joint'].setJointValue(Math.PI / 4 - (targetY * 0.5));
            
            // Keep the wrist somewhat level
            robot.joints['wrist_1_joint'].setJointValue(-Math.PI / 2);
            robot.joints['wrist_2_joint'].setJointValue(-Math.PI / 2);
            
            // Slowly rotate the end effector for a dynamic look
            robot.joints['wrist_3_joint'].setJointValue(Date.now() * 0.001);
        }
    }

    renderer.render(scene, camera);
}

animate();