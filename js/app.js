// --- Scene Setup ---
const canvas = document.querySelector('#bg-canvas');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.2, 2.5);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, 7);
const techLight = new THREE.PointLight(0x00ffcc, 2, 10);
techLight.position.set(-2, 2, 2);
scene.add(ambientLight, directionalLight, techLight);

// --- Helper: Position Robot Based on Screen Size ---
function updateRobotPosition() {
    if (!robot) return;
    const isDesktop = window.innerWidth >= 768 && window.innerWidth > window.innerHeight;
    
    if (isDesktop) {
        // Desktop: Shift right (X=1.5) so it sits in the empty 1/3 space
        robot.position.set(1.5, 0.2, -1);
    } else {
        // Mobile: Keep it centered and slightly lower
        robot.position.set(0, 0.5, -1);
    }
}

// --- URDF Loader & Solver ---
let robot;
const ikSolver = new CCDIKSolver();

const manager = new THREE.LoadingManager();
const loader = new URDFLoader(manager);

loader.load('assets/models/ur5/urdf/ur5.urdf', result => {
    robot = result;
    robot.rotation.x = -Math.PI / 2;
    robot.scale.set(2.5, 2.5, 2.5);
    
    updateRobotPosition(); // Apply positioning logic immediately
    scene.add(robot);
});

// --- Static Plane Mouse Tracking ---
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

// The robot is at Z = -1. 
// 0.5 meters in front of the robot is Z = -0.5.
// We define a flat plane facing the camera (0,0,1) located at Z = -0.5
const targetPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0.5); 
const targetPosition = new THREE.Vector3(0, 1, -0.5); 
const smoothedTarget = new THREE.Vector3(0, 1, -0.5); 

// --- Static Plane Mouse Tracking ---
window.addEventListener('mousemove', (event) => {
    // Revert to full-screen mouse calculations
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(targetPlane, targetPosition);
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    updateRobotPosition(); // Adjust robot placement if crossing the mobile/desktop threshold
});

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    if (robot) {
        smoothedTarget.lerp(targetPosition, 0.08);
        ikSolver.solve(robot, smoothedTarget);
    }

    renderer.render(scene, camera);
}

animate();