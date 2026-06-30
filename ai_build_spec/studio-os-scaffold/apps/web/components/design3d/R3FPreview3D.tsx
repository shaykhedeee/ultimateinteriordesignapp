'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { SceneVersionDto } from '@studio/contracts';
import { getModules, getWalls } from '../../lib/scene/selectors';

function Walls({ scene }: { scene: SceneVersionDto | null }) {
  const walls = getWalls(scene);
  return (
    <>
      {walls.map((wall) => {
        const dx = wall.end.x - wall.start.x;
        const dy = wall.end.y - wall.start.y;
        const length = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const angle = Math.atan2(dy, dx);
        const centerX = (wall.start.x + wall.end.x) / 2 / 1000;
        const centerZ = (wall.start.y + wall.end.y) / 2 / 1000;
        return (
          <mesh key={wall.wallId} position={[centerX, wall.heightMm / 2000, centerZ]} rotation={[0, -angle, 0]}>
            <boxGeometry args={[length / 1000, wall.heightMm / 1000, wall.thicknessMm / 1000]} />
            <meshStandardMaterial color="#888888" />
          </mesh>
        );
      })}
    </>
  );
}

function Modules({ scene }: { scene: SceneVersionDto | null }) {
  const modules = getModules(scene);
  return (
    <>
      {modules.map((module) => (
        <mesh
          key={module.moduleId}
          position={[
            module.geometry.anchor.x / 1000,
            module.geometry.size.heightMm / 2000,
            module.geometry.anchor.y / 1000,
          ]}
        >
          <boxGeometry args={[
            module.geometry.size.widthMm / 1000,
            module.geometry.size.heightMm / 1000,
            module.geometry.size.depthMm / 1000,
          ]} />
          <meshStandardMaterial color="#7dbb74" />
        </mesh>
      ))}
    </>
  );
}

export function R3FPreview3D({ scene, compareScene }: { scene: SceneVersionDto | null; compareScene?: SceneVersionDto | null }) {
  return (
    <div className="canvasMock" style={{ minHeight: 360, padding: 0 }}>
      <Canvas camera={{ position: [6, 4, 6], fov: 45 }} frameloop="demand">
        <ambientLight intensity={0.7} />
        <directionalLight position={[8, 10, 5]} intensity={1.2} />
        <gridHelper args={[20, 20, '#333333', '#222222']} />
        <Walls scene={scene} />
        <Modules scene={scene} />
        {compareScene ? <Modules scene={compareScene} /> : null}
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
