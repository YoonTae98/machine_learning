import { Canvas } from "@react-three/fiber";
import {
  Float,
  MeshDistortMaterial,
  Sphere,
} from "@react-three/drei";

function Scene() {
  return (
    <>
      {/* 전체적으로 부드러운 밝은 조명 */}
      <ambientLight intensity={1.8} />

      <directionalLight
        position={[4, 4, 5]}
        intensity={2.2}
      />

      <pointLight
        position={[-3, 1, 4]}
        intensity={8}
        color="#d8e2ff"
      />

      <pointLight
        position={[3, -2, 3]}
        intensity={6}
        color="#c9f2ff"
      />

      {/* 메인 Liquid Glass 느낌의 구체 */}
      <Float
        speed={1.15}
        rotationIntensity={0.45}
        floatIntensity={1.1}
      >
        <Sphere
          args={[1.65, 96, 96]}
          position={[0.9, 0, 0]}
        >
          <MeshDistortMaterial
            color="#7890ff"
            transparent
            opacity={0.28}
            roughness={0.1}
            metalness={0.35}
            distort={0.42}
            speed={1.4}
          />
        </Sphere>
      </Float>

      {/* 보조 와이어프레임 오브젝트 */}
      <Float
        speed={0.9}
        rotationIntensity={0.7}
        floatIntensity={0.8}
      >
        <mesh position={[-2.2, -0.9, -1]}>
          <icosahedronGeometry args={[0.8, 2]} />

          <meshStandardMaterial
            color="#42b8d8"
            wireframe
            transparent
            opacity={0.22}
          />
        </mesh>
      </Float>

      {/* 작은 보조 구체 */}
      <Float
        speed={1.4}
        rotationIntensity={0.3}
        floatIntensity={0.7}
      >
        <Sphere
          args={[0.34, 48, 48]}
          position={[2.6, 1.4, -0.7]}
        >
          <meshStandardMaterial
            color="#9aaeff"
            transparent
            opacity={0.32}
            roughness={0.15}
            metalness={0.2}
          />
        </Sphere>
      </Float>
    </>
  );
}

export default function HeroScene() {
  return (
    <div className="hero-canvas">
      <Canvas
        camera={{
          position: [0, 0, 6],
          fov: 45,
        }}
        dpr={[1, 1.5]}
      >
        <Scene />
      </Canvas>
    </div>
  );
}