'use client';

import { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera, useGLTF, Edges } from '@react-three/drei';
import * as THREE from 'three';

interface PolaroidCamera3DProps {
  onCapture: () => void;
  isActive: boolean;
}

function CameraModel({ onCapture, isActive }: { onCapture: () => void; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const [rotation, setRotation] = useState(0);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = rotation;
    }
  });

  const handleClick = () => {
    if (isActive) {
      onCapture();
    }
  };

  const handlePointerMove = (event: any) => {
    if (event.buttons === 1) { // Left mouse button held
      setRotation(prev => prev + event.movementX * 0.01);
    }
  };

  // First, let's just show a simple test cube to see if rendering works
  return (
    <group 
      ref={groupRef} 
      onPointerMove={handlePointerMove}
      onClick={handleClick}
    >
      {/* Test cube - should be visible */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshToonMaterial color="#4CAF50" />
        <Edges threshold={15} color="black" />
      </mesh>
      
      {/* Test sphere */}
      <mesh position={[3, 0, 0]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshToonMaterial color="#ff4444" />
        <Edges threshold={15} color="black" />
      </mesh>
    </group>
  );
}

function GLTFCameraModel({ onCapture, isActive }: { onCapture: () => void; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const [rotation, setRotation] = useState(0);
  
  // Load the GLB model with error handling
  const { scene, error } = useGLTF('/assets/polaroid/polaroid_cam.glb');

  // Debug: Log if model loaded
  console.log('Model loaded:', scene);
  console.log('Model error:', error);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = rotation;
    }
  });

  const handleClick = () => {
    if (isActive) {
      onCapture();
    }
  };

  const handlePointerMove = (event: any) => {
    if (event.buttons === 1) { // Left mouse button held
      setRotation(prev => prev + event.movementX * 0.01);
    }
  };

  // If model failed to load, show fallback
  if (error || !scene) {
    console.log('Model loading failed, showing fallback');
    return (
      <group ref={groupRef}>
        <mesh>
          <boxGeometry args={[2, 1.5, 1]} />
          <meshToonMaterial color="#ff0000" />
          <Edges threshold={15} color="black" />
        </mesh>
      </group>
    );
  }

  return (
    <group 
      ref={groupRef} 
      onPointerMove={handlePointerMove}
      onClick={handleClick}
      scale={[10, 10, 10]} // Much larger scale
      position={[0, 0, 0]}
    >
      <primitive object={scene} />
    </group>
  );
}

// Preload the GLB model
useGLTF.preload('/assets/polaroid/polaroid_cam.glb');

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[2, 1.5, 1]} />
      <meshToonMaterial color="#cccccc" />
    </mesh>
  );
}

function SimplePolaroidCamera({ onCapture, isActive }: { onCapture: () => void; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const [rotation, setRotation] = useState(0);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = rotation;
    }
  });

  const handleClick = () => {
    if (isActive) {
      onCapture();
    }
  };

  const handlePointerMove = (event: any) => {
    if (event.buttons === 1) {
      setRotation(prev => prev + event.movementX * 0.01);
    }
  };

  return (
    <group 
      ref={groupRef} 
      onPointerMove={handlePointerMove}
      onClick={handleClick}
      scale={[4.5, 4.5, 4.5]} // 1.5x bigger (was 3x, now 4.5x)
      rotation={[0, 0, 0]} // Perfectly front-facing, no rotation
    >
      {/* Main camera body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 1.5, 1]} />
        <meshStandardMaterial color="#f5f5f0" />
      </mesh>

      {/* Lens housing */}
      <mesh position={[0, 0.3, 0.6]}>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
        <meshStandardMaterial color="#2e2e2e" />
      </mesh>

      {/* Lens */}
      <mesh position={[0, 0.3, 0.8]}>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>

      {/* Viewfinder */}
      <mesh position={[0, 0.9, 0.2]}>
        <boxGeometry args={[0.6, 0.4, 0.5]} />
        <meshStandardMaterial color="#f5f5f0" />
      </mesh>

      {/* Shutter button */}
      <mesh position={[0.6, 0.6, 0.4]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 8]} />
        <meshStandardMaterial color="#ff4444" />
      </mesh>

      {/* Film slot */}
      <mesh position={[0, -0.9, 0.6]}>
        <boxGeometry args={[1.8, 0.15, 0.1]} />
        <meshStandardMaterial color="#2e2e2e" />
      </mesh>

      {/* Side grips */}
      <mesh position={[-1.1, 0, 0]}>
        <boxGeometry args={[0.2, 1.2, 0.9]} />
        <meshStandardMaterial color="#2e2e2e" />
      </mesh>

      <mesh position={[1.1, 0, 0]}>
        <boxGeometry args={[0.2, 1.2, 0.9]} />
        <meshStandardMaterial color="#2e2e2e" />
      </mesh>

      {/* Flash */}
      <mesh position={[-0.6, 0.6, 0.6]}>
        <boxGeometry args={[0.4, 0.3, 0.15]} />
        <meshStandardMaterial color="#f5f5f0" />
      </mesh>
    </group>
  );
}

export default function PolaroidCamera3D({ onCapture, isActive }: PolaroidCamera3DProps) {
  return (
    <div className="w-[500px] h-[500px]"> {/* Larger container for bigger camera */}
      <Canvas 
        camera={{ position: [0, 0, 15], fov: 50 }} // Directly in front for perfect front view
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        
        <SimplePolaroidCamera onCapture={onCapture} isActive={isActive} />
      </Canvas>
      
      <div className="text-center mt-4 text-sm text-gray-600">
        {isActive ? 'Click camera to take photo' : 'Drag to rotate • Click "Start Camera" first'}
      </div>
    </div>
  );
}