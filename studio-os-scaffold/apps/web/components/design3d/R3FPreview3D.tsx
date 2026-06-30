import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import type { SceneVersionDto } from '@studio/contracts';
import { getModules, getWalls } from '../../lib/scene/selectors';
import * as THREE from 'three';

const modelMapping: Record<string, { path: string; color: string }> = {
  bed_queen_upholstered: { path: '/models/furniture/bed_lowpoly.gltf', color: '#c5a383' },
  sofa_l_shape_lounge: { path: '/models/furniture/sofa_lshape_lowpoly.gltf', color: '#c79574' },
  sofa_three_seater_linear: { path: '/models/furniture/sofa_linear_lowpoly.gltf', color: '#bf9f7f' },
  tv_unit_fluted_backlit: { path: '/models/furniture/tv_unit_feature_lowpoly.gltf', color: '#C9A84C' },
  tv_unit_minimal_wood: { path: '/models/furniture/tv_unit_feature_lowpoly.gltf', color: '#d2b48c' },
  tv_unit_marble_floating: { path: '/models/furniture/tv_unit_feature_lowpoly.gltf', color: '#ffffff' },
  tv_unit_compact_apartment: { path: '/models/furniture/tv_unit_feature_lowpoly.gltf', color: '#c0c0c0' },
  wardrobe_four_door_sliding: { path: '/models/furniture/wardrobe_tall_lowpoly.gltf', color: '#a08575' },
  wardrobe_three_door_hinged: { path: '/models/furniture/wardrobe_tall_lowpoly.gltf', color: '#b09585' },
  crockery_glass_profile: { path: '/models/furniture/wardrobe_tall_lowpoly.gltf', color: '#c0b0a5' },
  mandir_cnc_backlit: { path: '/models/furniture/mandir_compact_lowpoly.gltf', color: '#e8cfa5' },
  study_desk_floating: { path: '/models/furniture/study_desk_lowpoly.gltf', color: '#a5b0c0' },
  dresser_clean_mirror_unit: { path: '/models/furniture/dresser_mirror_lowpoly.gltf', color: '#d0c5cf' },
};

function FallbackMesh({ position, size, color = '#1E1E24' }: { position: [number, number, number]; size: { widthMm: number; heightMm: number; depthMm: number }; color?: string }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[size.widthMm / 1000, size.heightMm / 1000, size.depthMm / 1000]} />
      <meshStandardMaterial color={color} roughness={0.7} metalness={0.15} />
    </mesh>
  );
}

function R3FModuleMesh({ moduleType, position, size, rotationDeg }: { moduleType: string; position: [number, number, number]; size: { widthMm: number; heightMm: number; depthMm: number }; rotationDeg?: number }) {
  const mapping = modelMapping[moduleType];
  const gltf = useGLTF(mapping?.path ?? '/models/furniture/generic_cuboid.gltf');
  
  const scene = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if ((mesh as any).isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.material = new THREE.MeshStandardMaterial({
          color: mapping?.color ?? '#C9A84C',
          roughness: 0.65,
          metalness: 0.1,
        });
      }
    });
    return cloned;
  }, [gltf.scene, mapping?.color]);

  const rotRad = ((rotationDeg ?? 0) * Math.PI) / 180;

  return (
    <primitive
      object={scene}
      position={position}
      rotation={[0, rotRad, 0]}
      scale={[size.widthMm / 1000, size.heightMm / 1000, size.depthMm / 1000]}
    />
  );
}

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
            <meshStandardMaterial color="#3a3a42" roughness={0.8} />
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
      {modules.map((module) => {
        const posVal: [number, number, number] = [
          module.geometry.anchor.x / 1000,
          module.geometry.size.heightMm / 2000,
          module.geometry.anchor.y / 1000,
        ];
        return (
          <Suspense key={module.moduleId} fallback={<FallbackMesh position={posVal} size={module.geometry.size} />}>
            <R3FModuleMesh
              moduleType={module.moduleType}
              position={posVal}
              size={module.geometry.size}
              rotationDeg={module.geometry.rotationDeg}
            />
          </Suspense>
        );
      })}
    </>
  );
}

export function R3FPreview3D({ scene, compareScene }: { scene: SceneVersionDto | null; compareScene?: SceneVersionDto | null }) {
  return (
    <div className="canvasMock" style={{ minHeight: 360, padding: 0 }}>
      <Canvas camera={{ position: [6, 4, 6], fov: 45 }} frameloop="demand">
        <color attach="background" args={['#0A0A0B']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[8, 10, 5]} intensity={1.3} />
        <gridHelper args={[20, 20, '#C9A84C', '#1E1E24']} />
        <Walls scene={scene} />
        <Modules scene={scene} />
        {compareScene ? <Modules scene={compareScene} /> : null}
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
