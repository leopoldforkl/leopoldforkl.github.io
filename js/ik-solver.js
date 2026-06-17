class CCDIKSolver {
    constructor() {
        this.maxIterations = 5; 
        this.damping = 0.2;
        this.eefName = 'wrist_1_link'; 
        
        // Only run the positional solver on the macro joints
        this.positionalJoints = [
            'elbow_joint',
            'shoulder_lift_joint',
            'shoulder_pan_joint'
        ];
    }

    solve(robot, targetPos) {
        const eef = robot.links[this.eefName];
        if (!eef) return;

        const sl = robot.joints['shoulder_lift_joint'];
        const el = robot.joints['elbow_joint'];
        const w1 = robot.joints['wrist_1_joint'];
        const w2 = robot.joints['wrist_2_joint'];
        const w3 = robot.joints['wrist_3_joint'];

        // 1. Lock the outer wrists
        if (w2) w2.setJointValue(-Math.PI / 2);
        if (w3) w3.setJointValue(0);

        // 2. Helper to enforce the perfectly downward orientation.
        const enforceDownward = () => {
            if (sl && el && w1) {
                w1.setJointValue(-sl.angle - el.angle - (Math.PI / 2));
            }
        };

        // Apply immediately before starting calculations
        enforceDownward();

        const eefPos = new THREE.Vector3();
        const jointPos = new THREE.Vector3();
        const jointQuat = new THREE.Quaternion();
        const axisWorld = new THREE.Vector3();
        const eefDir = new THREE.Vector3();
        const targetDir = new THREE.Vector3();

        for (let iter = 0; iter < this.maxIterations; iter++) {
            for (const jointName of this.positionalJoints) {
                const joint = robot.joints[jointName];
                if (!joint) continue;

                robot.updateMatrixWorld(true);
                eef.getWorldPosition(eefPos);
                joint.getWorldPosition(jointPos);
                joint.getWorldQuaternion(jointQuat);

                if (!joint.axis) continue;
                axisWorld.copy(joint.axis).applyQuaternion(jointQuat).normalize();

                eefDir.subVectors(eefPos, jointPos).normalize();
                targetDir.subVectors(targetPos, jointPos).normalize();

                eefDir.projectOnPlane(axisWorld).normalize();
                targetDir.projectOnPlane(axisWorld).normalize();

                let angle = eefDir.angleTo(targetDir);
                if (angle < 0.001) continue; 

                const cross = new THREE.Vector3().crossVectors(eefDir, targetDir);
                const sign = Math.sign(cross.dot(axisWorld));

                let delta = angle * sign * this.damping;
                let newAngle = (joint.angle || 0) + delta;

                if (joint.limit) {
                    newAngle = Math.max(joint.limit.lower, Math.min(joint.limit.upper, newAngle));
                }

                joint.setJointValue(newAngle);

                // Re-apply the downward constraint immediately 
                enforceDownward();
            }
        }
    }
}