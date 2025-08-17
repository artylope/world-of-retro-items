'use client';

import { useRef, useState, Suspense, useEffect } from 'react';
import * as React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera, useGLTF, Edges, Line } from '@react-three/drei';
import * as THREE from 'three';

interface PolaroidCamera3DProps {
  onCapture: () => void;
  isActive: boolean;
  webcamRef?: React.RefObject<any>;
}


// Preload the GLB model
useGLTF.preload('/assets/polaroid/polaroid_onestep.glb');

function LoadingFallback() {
  return null; // Don't show anything while loading
}

function GLBPolaroidCamera({ onCapture, isActive, webcamRef }: { onCapture: () => void; isActive: boolean; webcamRef?: React.RefObject<any> }) {
  const groupRef = useRef<THREE.Group>(null);
  const [rotation, setRotation] = useState(0);
  const [modelCenter, setModelCenter] = useState<THREE.Vector3 | null>(null);
  const lastClickTime = useRef(0);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [canvasTexture, setCanvasTexture] = useState<THREE.CanvasTexture | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load the GLB model
  const { scene } = useGLTF('/assets/polaroid/polaroid_onestep.glb');

  // Create canvas texture from webcam
  useEffect(() => {
    if (webcamRef?.current && isActive) {
      const video = webcamRef.current.video;

      if (video && video.tagName === 'VIDEO') {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        canvasRef.current = canvas;

        const ctx = canvas.getContext('2d');

        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.flipY = false;
        setCanvasTexture(texture);

        console.log('Canvas texture created');
      }
    } else {
      setCanvasTexture(null);
      canvasRef.current = null;
    }
  }, [webcamRef, isActive]);

  // Calculate center and add toon shading when model loads
  useEffect(() => {
    if (scene && !modelCenter) {
      console.log('New model loaded:', scene);
      console.log('New model children:', scene.children);

      // Apply Lambert materials for softer, more diffuse lighting
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Use Lambert material for soft, diffuse lighting
          child.material = new THREE.MeshLambertMaterial({
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

    // Update canvas with video frame
    if (canvasRef.current && webcamRef?.current?.video && canvasTexture) {
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx && video.readyState >= video.HAVE_CURRENT_DATA) {
        ctx.save();
        ctx.scale(1, -1);
        ctx.drawImage(video, 0, -canvas.height, canvas.width, canvas.height);
        ctx.restore();
        canvasTexture.needsUpdate = true;
      }
    }
  });

  const handlePointerDown = (event: any) => {
    event.stopPropagation();
    isDragging.current = false;
    dragStart.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerMove = (event: any) => {
    if (event.buttons === 1) {
      const deltaX = Math.abs(event.clientX - dragStart.current.x);
      const deltaY = Math.abs(event.clientY - dragStart.current.y);

      // If moved more than 5 pixels, consider it dragging
      if (deltaX > 5 || deltaY > 5) {
        isDragging.current = true;
      }

      setRotation(prev => prev + event.movementX * 0.01);
    }
  };

  const handleClick = (event: any) => {
    event.stopPropagation();

    // Don't take photo if user was dragging
    if (isDragging.current) {
      return;
    }

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

  // If model failed to load or has no children, show fallback
  if (!scene || !scene.children.length) {
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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
      scale={[0.25, 0.25, 0.25]} // Bigger scale for larger canvas
    >
      {/* This group rotates around origin, with model offset to center it */}
      <group position={[-modelCenter.x, -modelCenter.y, -modelCenter.z]}>
        <primitive object={scene} />

        {/* Viewfinder screen plane positioned where the cyan square is */}
        <mesh position={[51, 9, 36.1]} rotation={[0, 0, 0]}>
          <planeGeometry args={[12.5, 11]} />
          {canvasTexture ? (
            <meshBasicMaterial
              map={canvasTexture}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          ) : (
            <meshBasicMaterial color="#00ff00" />
          )}
        </mesh>


      </group>
    </group>
  );
}

export default function PolaroidCamera3D({ onCapture, isActive, webcamRef }: PolaroidCamera3DProps) {
  return (
    <div className="w-[min(90vw,80vh)] h-[min(90vw,80vh)]"> {/* Responsive: 90% of viewport width or 80% of height, whichever is smaller */}
      <Canvas className='w-full h-full'>
        <OrthographicCamera
          makeDefault
          position={[0, 0, 15]}
          zoom={30}
        />
        <ambientLight intensity={0.1} />
        <spotLight
          position={[10, 15, 35]}
          penumbra={1}
          angle={0.3}
          color="white"
          castShadow
          shadow-mapSize={[512, 512]}
          intensity={1}
        />
        <directionalLight position={[0, 8, 25]} intensity={2} />
        <directionalLight position={[0, -15, 25]} intensity={0.5} color="#ffeedd" />


        <Suspense fallback={<LoadingFallback />}>
          <GLBPolaroidCamera onCapture={onCapture} isActive={isActive} webcamRef={webcamRef} />
        </Suspense>
      </Canvas>

    </div>
  );
}