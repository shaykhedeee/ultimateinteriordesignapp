'use client';

import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

type Props = {
  assetPath?: string;
  color?: string;
  widthMm?: number;
  heightMm?: number;
  depthMm?: number;
  label?: string;
};

function PreviewMesh({ assetPath = '/models/furniture/generic_cuboid.gltf', color = '#9aa7b2', widthMm = 1200, heightMm = 900, depthMm = 500 }: Props) {
  const gltf = useGLTF(assetPath);
  const scene = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if ((mesh as any).isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.material = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.62,
          metalness: 0.08,
        });
      }
    });
    return cloned;
  }, [color, gltf.scene]);

  return (
    <primitive
      object={scene}
      position={[0, heightMm / 2000, 0]}
      scale={[widthMm / 1000, heightMm / 1000, depthMm / 1000]}
    />
  );
}

export function FurniturePreview3D({ assetPath, color, widthMm, heightMm, depthMm, label }: Props) {
  return (
    <div className="canvasMock" style={{ minHeight: 220, padding: 0, overflow: 'hidden' }}>
      <Canvas camera={{ position: [2.8, 2.2, 3.2], fov: 42 }} shadows>
        <color attach="background" args={['#0d1110']} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[6, 8, 5]} intensity={1.1} castShadow />
        <gridHelper args={[6, 12, '#2a2a2a', '#1d1d1d']} position={[0, 0, 0]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[6, 6]} />
          <shadowMaterial opacity={0.18} />
        </mesh>
        <Suspense fallback={null}>
          <PreviewMesh assetPath={assetPath} color={color} widthMm={widthMm} heightMm={heightMm} depthMm={depthMm} />
        </Suspense>
        <OrbitControls makeDefault enablePan={false} maxDistance={8} minDistance={1.6} />
      </Canvas>
      <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', background: '#101413' }}>
        <div style={{ fontWeight: 600 }}>{label ?? 'GLTF Preview'}</div>
        <div className="muted" style={{ fontSize: 12 }}>GLTF-backed massing preview for quick placement confidence.</div>
      </div>
    </div>
  );
}

useGLTF.preload('/models/furniture/bed_lowpoly.gltf');
useGLTF.preload('/models/furniture/sofa_linear_lowpoly.gltf');
useGLTF.preload('/models/furniture/sofa_lshape_lowpoly.gltf');
useGLTF.preload('/models/furniture/wardrobe_tall_lowpoly.gltf');
useGLTF.preload('/models/furniture/tv_unit_feature_lowpoly.gltf');
useGLTF.preload('/models/furniture/mandir_compact_lowpoly.gltf');
useGLTF.preload('/models/furniture/study_desk_lowpoly.gltf');
useGLTF.preload('/models/furniture/dresser_mirror_lowpoly.gltf');
