import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

function drawFaceToCanvas(img, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  if (img && img.complete && img.naturalWidth > 0) ctx.drawImage(img, 0, 0, size, size);
  return canvas;
}

function buildEquirectFromFaces(faceImages, width = 2048, height = 1024) {
  const faceSize = Math.floor(width / 4);
  const front = drawFaceToCanvas(faceImages[0], faceSize);
  const back = drawFaceToCanvas(faceImages[1], faceSize);
  const top = drawFaceToCanvas(faceImages[2], faceSize);
  const bottom = drawFaceToCanvas(faceImages[3], faceSize);
  const right = drawFaceToCanvas(faceImages[4], faceSize);
  const left = drawFaceToCanvas(faceImages[5], faceSize);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);

  ctx.drawImage(front, width * 0.5, height * 0.5, width * 0.5, height * 0.5);
  ctx.drawImage(back, 0, height * 0.5, width * 0.5, height * 0.5);
  ctx.drawImage(right, width * 0.75, height * 0.5, width * 0.25, height * 0.5);
  ctx.drawImage(left, width * 0.5, height * 0.5, width * 0.25, height * 0.5);
  ctx.drawImage(top, width * 0.5, 0, width * 0.5, height * 0.5);
  ctx.drawImage(bottom, width * 0.5, height * 0.5, width * 0.5, height * 0.5);

  return canvas.toDataURL('image/jpeg', 0.88);
}

async function captureCubeFaces({ scene, camera, size = 512 }) {
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(size, {
    format: THREE.RGBAFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter
  });
  const cubeCamera = new THREE.CubeCamera(0.1, 100000, cubeRenderTarget);
  cubeCamera.position.copy(camera.position);

  const originalBackground = scene.background;
  scene.background = null;
  cubeCamera.update(renderer, scene);
  scene.background = originalBackground;

  const faces = [];
  for (let i = 0; i < 6; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const faceCanvas = cubeRenderTarget.texture.image[i];
    ctx.drawImage(faceCanvas, 0, 0, size, size);
    const dataUrl = canvas.toDataURL('image/png');
    faces.push(dataUrl);
  }

  cubeRenderTarget.dispose();
  return faces;
}

export async function generateEquirectFromScene({ scene, camera, width = 2048, height = 1024 }) {
  const faces = await captureCubeFaces({ scene, camera, size: 512 });
  return buildEquirectFromFaces(faces, width, height);
}

export default function Viewer360({ equirectImage, onClose }) {
  const mountRef = useRef(null);
  const sphereRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const frameRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;
    if (sphereRef.current) {
      cancelAnimationFrame(frameRef.current);
      mountRef.current.innerHTML = '';
    }

    const width = mountRef.current.clientWidth || 1024;
    const height = mountRef.current.clientHeight || 800;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const geometry = new THREE.SphereGeometry(500, 64, 32);
    geometry.scale(-1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    sphereRef.current = mesh;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = mountRef.current.clientWidth || 800;
      const h = mountRef.current.clientHeight || 600;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && rendererRef.current && rendererRef.current.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
      material.dispose();
      geometry.dispose();
      sphereRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!equirectImage || !sphereRef.current || !rendererRef.current) return;
    setLoading(true);
    const loader = new THREE.TextureLoader();
    loader.load(
      equirectImage,
      (texture) => {
        sphereRef.current.material = new THREE.MeshBasicMaterial({ map: texture });
        setReady(true);
        setLoading(false);
        rendererRef.current.render(sphereRef.current.parent || new THREE.Scene(), cameraRef.current);
      },
      undefined,
      () => {
        setLoading(false);
      }
    );
  }, [equirectImage]);

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startY = e.clientY;
    const startTheta = sphereRef.current?.rotation?.y || 0;
    const startPhi = sphereRef.current?.rotation?.x || 0;

    const handlePointerMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (sphereRef.current) {
        sphereRef.current.rotation.y = startTheta - dx * 0.005;
        sphereRef.current.rotation.x = startPhi + dy * 0.005;
      }
    };
    const handlePointerUp = () => {
      e.currentTarget.releasePointerCapture(e.pointerId);
      e.currentTarget.removeEventListener('pointermove', handlePointerMove);
      e.currentTarget.removeEventListener('pointerup', handlePointerUp);
    };
    e.currentTarget.addEventListener('pointermove', handlePointerMove);
    e.currentTarget.addEventListener('pointerup', handlePointerUp);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (!cameraRef.current) return;
    cameraRef.current.fov = Math.max(30, Math.min(100, cameraRef.current.fov + e.deltaY * 0.05));
    cameraRef.current.updateProjectionMatrix();
  };

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden">
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <button
          onClick={onClose}
          className="bg-slate-900/80 border border-slate-700 text-slate-200 px-2 py-1 rounded text-[10px] font-bold uppercase hover:bg-slate-800"
        >
          Exit 360
        </button>
        <span className="bg-slate-900/80 border border-slate-700 text-slate-400 px-2 py-1 rounded text-[9px] font-mono">
          DRAG TO LOOK · SCROLL TO ZOOM
        </span>
      </div>
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onWheel={handleWheel}
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
          Generating 360 preview...
        </div>
      )}
    </div>
  );
}
