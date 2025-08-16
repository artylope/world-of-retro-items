'use client';

import { useRef, useState, Suspense, useEffect } from 'react';
import * as React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera, useGLTF, Edges, Line } from '@react-three/drei';
import * as THREE from 'three';

interface PolaroidCamera3DProps {
  onCapture: () => void;
  isActive: boolean;
}


// Preload the GLB model
useGLTF.preload('/assets/polaroid/polaroid_onestep.glb');

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[2, 1.5, 1]} />
      <meshToonMaterial color="#cccccc" />
    </mesh>
  );
}

function GLBPolaroidCamera({ onCapture, isActive }: { onCapture: () => void; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const [rotation, setRotation] = useState(0);
  const [modelCenter, setModelCenter] = useState<THREE.Vector3 | null>(null);
  const lastClickTime = useRef(0);

  // Load the GLB model with error handling
  const { scene, error } = useGLTF('/assets/polaroid/polaroid_onestep.glb');

  // Calculate center and add toon shading when model loads
  useEffect(() => {
    if (scene && !modelCenter) {
      console.log('New model loaded:', scene);
      console.log('New model children:', scene.children);
      
      // Apply clean toon shading for IKEA style
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Replace material with clean toon material
          child.material = new THREE.MeshToonMaterial({
            color: child.material.color || 0xffffff,
            map: child.material.map || null,
          });
        }
      });
      
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      setModelCenter(center);
      console.log('New model center:', center);
      console.log('New model size:', size);
    }
  }, [scene, modelCenter]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = rotation;
    }
  });

  const handleClick = (event: any) => {
    event.stopPropagation(); // Prevent event bubbling

    // Debounce clicks - only allow one click per 500ms
    const now = Date.now();
    if (now - lastClickTime.current < 500) {
      return;
    }
    lastClickTime.current = now;

    if (isActive) {
      console.log('Camera clicked - taking photo');
      onCapture();
    }
  };

  const handlePointerMove = (event: any) => {
    if (event.buttons === 1) {
      setRotation(prev => prev + event.movementX * 0.01);
    }
  };

  // If model failed to load or has no children, show fallback
  if (error || !scene || !scene.children.length) {
    console.log('Model failed to load or is empty, showing fallback');
    return (
      <group ref={groupRef}>
        <mesh>
          <boxGeometry args={[2, 1.5, 1]} />
          <meshStandardMaterial color="#ff0000" />
        </mesh>
        <mesh position={[0, -2, 0]}>
          <boxGeometry args={[3, 0.2, 0.2]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
    );
  }

  // Don't render until we have the center calculated
  if (!modelCenter) {
    return null;
  }

  return (
    <group
      ref={groupRef}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
      scale={[0.15, 0.15, 0.15]} // 5x bigger (was 0.05, now 0.25)
    >
      {/* This group rotates around origin, with model offset to center it */}
      <group position={[-modelCenter.x, -modelCenter.y, -modelCenter.z]}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

export default function PolaroidCamera3D({ onCapture, isActive }: PolaroidCamera3DProps) {
  return (
    <div className="w-[min(80vw,60vh)] h-[min(80vw,60vh)]"> {/* Responsive: 80% of viewport width or 60% of height, whichever is smaller */}
      <Canvas>
        <OrthographicCamera
          makeDefault
          position={[0, 0, 15]}
          zoom={50}
        />
        <ambientLight intensity={1.2} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <directionalLight position={[-10, -10, -5]} intensity={0.8} />
        <directionalLight position={[0, 10, 10]} intensity={0.6} />

        <Suspense fallback={<LoadingFallback />}>
          <GLBPolaroidCamera onCapture={onCapture} isActive={isActive} />
        </Suspense>
      </Canvas>
      <div className="text-center text-xs sm:text-sm text-gray-600 px-2 -translate-y-10">
        'Click camera or press SPACE to take photo • Drag to rotate'
      </div>
    </div>
  );
}