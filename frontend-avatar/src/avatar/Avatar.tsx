import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AvatarExpression, PoseData } from "../types";

interface AvatarProps {
  pose: PoseData;
  expression: AvatarExpression;
}

const SHOULDER_R: [number, number, number] = [0.28, 0.35, 0];
const SHOULDER_L: [number, number, number] = [-0.28, 0.35, 0];
const LERP_SPEED = 6; // higher = snappier tween; keeps motion smooth, not abrupt (Phase 12)

/** A single-segment "stretchy" arm: a capsule that always connects the
 * shoulder to the (tweened) hand target. This is a deliberate simplification
 * over real two-bone IK — honest tradeoff for a hackathon timeframe that
 * still keeps hands clearly visible and moving distinctly per sign. */
function Arm({ shoulder, hand }: { shoulder: THREE.Vector3; hand: THREE.Vector3 }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const handSphereRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current || !handSphereRef.current) return;
    const mid = shoulder.clone().add(hand).multiplyScalar(0.5);
    const dist = shoulder.distanceTo(hand);
    meshRef.current.position.copy(mid);
    meshRef.current.scale.set(1, Math.max(dist, 0.05), 1);
    const dir = hand.clone().sub(shoulder).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    meshRef.current.quaternion.setFromUnitVectors(up, dir.length() > 0 ? dir : up);
    handSphereRef.current.position.copy(hand);
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <capsuleGeometry args={[0.055, 1, 4, 8]} />
        <meshStandardMaterial color="#d9a066" />
      </mesh>
      <mesh ref={handSphereRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#e8b787" />
      </mesh>
    </group>
  );
}

function Face({ expression }: { expression: AvatarExpression }) {
  const mouthRef = useRef<THREE.Mesh>(null);
  const browLRef = useRef<THREE.Mesh>(null);
  const browRRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!mouthRef.current || !browLRef.current || !browRRef.current) return;
    const mouthCurve = expression === "HAPPY" ? 0.08 : expression === "NEGATION" ? -0.03 : 0;
    mouthRef.current.position.y = 0.62 + mouthCurve;
    const browLift = expression === "QUESTION" ? 0.06 : 0;
    browLRef.current.position.y = 0.72 + browLift;
    browRRef.current.position.y = 0.72 + browLift;
  });

  return (
    <group>
      {/* eyes */}
      <mesh position={[-0.06, 0.68, 0.22]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0.06, 0.68, 0.22]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* eyebrows */}
      <mesh ref={browLRef} position={[-0.06, 0.72, 0.22]}>
        <boxGeometry args={[0.05, 0.012, 0.01]} />
        <meshStandardMaterial color="#3a2a1a" />
      </mesh>
      <mesh ref={browRRef} position={[0.06, 0.72, 0.22]}>
        <boxGeometry args={[0.05, 0.012, 0.01]} />
        <meshStandardMaterial color="#3a2a1a" />
      </mesh>
      {/* mouth */}
      <mesh ref={mouthRef} position={[0, 0.62, 0.22]}>
        <boxGeometry args={[0.07, 0.015, 0.01]} />
        <meshStandardMaterial color="#7a3b3b" />
      </mesh>
    </group>
  );
}

export function Avatar({ pose, expression }: AvatarProps) {
  const rightHandTarget = useRef(new THREE.Vector3(...(pose.right_hand ?? [0.35, -0.35, 0.15])));
  const leftHandTarget = useRef(new THREE.Vector3(...(pose.left_hand ?? [-0.35, -0.35, 0.15])));
  const headGroupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const t = Math.min(1, delta * LERP_SPEED);
    const rTarget = pose.right_hand ?? [0.35, -0.35, 0.15];
    const lTarget = pose.left_hand ?? [-0.35, -0.35, 0.15];
    rightHandTarget.current.lerp(new THREE.Vector3(...rTarget), t);
    leftHandTarget.current.lerp(new THREE.Vector3(...lTarget), t);

    if (headGroupRef.current) {
      // NEGATION -> subtle head shake cue (Phase 14: "where feasible").
      const shake = expression === "NEGATION" ? Math.sin(performance.now() / 120) * 0.08 : 0;
      headGroupRef.current.rotation.y = THREE.MathUtils.lerp(headGroupRef.current.rotation.y, shake, t);
    }
  });

  return (
    <group position={[0, -0.2, 0]}>
      {/* torso */}
      <mesh position={[0, 0.15, 0]}>
        <capsuleGeometry args={[0.22, 0.5, 4, 12]} />
        <meshStandardMaterial color="#4a6fa5" />
      </mesh>

      {/* head + face */}
      <group ref={headGroupRef} position={[0, 0.62, 0]}>
        <mesh>
          <sphereGeometry args={[0.16, 24, 24]} />
          <meshStandardMaterial color="#e8b787" />
        </mesh>
        <Face expression={expression} />
      </group>

      {/* shoulders (visual joints) */}
      <mesh position={SHOULDER_R}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#4a6fa5" />
      </mesh>
      <mesh position={SHOULDER_L}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#4a6fa5" />
      </mesh>

      <Arm shoulder={new THREE.Vector3(...SHOULDER_R)} hand={rightHandTarget.current} />
      <Arm shoulder={new THREE.Vector3(...SHOULDER_L)} hand={leftHandTarget.current} />
    </group>
  );
}
