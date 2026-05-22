import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, OrbitControls, TorusKnot, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function CoreShape() {
  const meshRef = useRef();
  const glowRef = useRef();
  const time = useRef(0);

  useFrame((_, delta) => {
    time.current += delta;
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(time.current * 0.2) * 0.3;
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.position.y = Math.sin(time.current * 0.6) * 0.15;
    }
    if (glowRef.current) {
      glowRef.current.rotation.x += delta * 0.1;
      glowRef.current.rotation.z += delta * 0.15;
    }
  });

  return (
    <group>
      <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.6}>
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[1.6, 0]} />
          <MeshDistortMaterial
            color="#7ec8e3"
            emissive="#6ab0d6"
            emissiveIntensity={0.3}
            roughness={0.1}
            metalness={0.9}
            distort={0.35}
            speed={3}
          />
        </mesh>
      </Float>
      <mesh ref={glowRef}>
        <icosahedronGeometry args={[2.4, 1]} />
        <meshBasicMaterial
          color="#7ec8e3"
          transparent
          opacity={0.06}
          wireframe
        />
      </mesh>
    </group>
  );
}

function OrbitingRing({ radius, speed, color, offset = 0 }) {
  const ref = useRef();
  const angle = useRef(offset);
  useFrame((_, delta) => {
    angle.current += delta;
    if (ref.current) {
      ref.current.rotation.y += delta * speed;
      ref.current.rotation.x = Math.sin(angle.current * 0.5 + offset) * 0.2;
    }
  });

  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, 0.015, 16, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} />
    </mesh>
  );
}

function OrbitingSphere({ radius, speed, size, color, offset = 0 }) {
  const ref = useRef();
  const angle = useRef(offset);

  useFrame((_, delta) => {
    angle.current += delta * speed;
    if (ref.current) {
      ref.current.position.x = Math.cos(angle.current) * radius;
      ref.current.position.z = Math.sin(angle.current) * radius;
      ref.current.position.y = Math.sin(angle.current * 0.7 + offset) * 0.3;
      ref.current.rotation.x += delta * 0.5;
      ref.current.rotation.y += delta * 0.8;
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        roughness={0.3}
        metalness={0.7}
      />
    </mesh>
  );
}

function TorusKnotShape() {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * 0.2;
      ref.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <Float speed={0.8} floatIntensity={0.4}>
      <mesh ref={ref} position={[2.8, -1.2, -1]}>
        <torusKnotGeometry args={[0.5, 0.15, 64, 8]} />
        <meshStandardMaterial
          color="#a78bfa"
          emissive="#a78bfa"
          emissiveIntensity={0.15}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

function Particles() {
  const count = 500;
  const [positions, colors, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    const palette = [
      new THREE.Color('#7ec8e3'),
      new THREE.Color('#a78bfa'),
      new THREE.Color('#6ab0d6'),
      new THREE.Color('#8b9dc3'),
    ];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3 + Math.random() * 4;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
      siz[i] = 0.02 + Math.random() * 0.05;
    }
    return [pos, col, siz];
  }, []);

  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function LightBeams() {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={ref}>
      {[0, 1, 2, 3].map(i => (
        <mesh key={i} rotation={[0, (i * Math.PI) / 2, 0]} position={[0, -1.5, 0]}>
          <planeGeometry args={[0.01, 3]} />
          <meshBasicMaterial
            color="#7ec8e3"
            transparent
            opacity={0.04}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function ThreeDScene() {
  return (
    <div className="three-d-scene">
      <Canvas
        camera={{ position: [0, 0.5, 6], fov: 40 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-5, -5, -5]} intensity={0.3} color="#a78bfa" />
        <pointLight position={[0, 3, 0]} intensity={0.5} color="#7ec8e3" />
        <pointLight position={[0, -3, 0]} intensity={0.3} color="#a78bfa" />

        <CoreShape />
        <OrbitingRing radius={2.6} speed={0.3} color="#7ec8e3" />
        <OrbitingRing radius={3.2} speed={-0.2} color="#a78bfa" offset={1} />
        <OrbitingRing radius={3.8} speed={0.15} color="#6ab0d6" offset={2} />
        <OrbitingSphere radius={2.6} speed={0.3} size={0.12} color="#7ec8e3" />
        <OrbitingSphere radius={2.6} speed={0.3} size={0.08} color="#a78bfa" offset={Math.PI} />
        <OrbitingSphere radius={3.2} speed={-0.2} size={0.1} color="#a78bfa" offset={1.5} />
        <OrbitingSphere radius={3.8} speed={0.15} size={0.15} color="#6ab0d6" offset={0.5} />
        <TorusKnotShape />
        <Particles />
        <LightBeams />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.8}
          maxPolarAngle={Math.PI / 2.5}
          minPolarAngle={Math.PI / 3.5}
        />
      </Canvas>
    </div>
  );
}
