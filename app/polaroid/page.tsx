'use client';

import { useState, useRef } from 'react';
import Webcam from 'react-webcam';

interface PolaroidPhoto {
  id: string;
  imageUrl: string;
  x: number;
  y: number;
}

export default function Polaroid() {
  const [photos, setPhotos] = useState<PolaroidPhoto[]>([]);
  const webcamRef = useRef<Webcam>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const capturePhoto = () => {
    if (!webcamRef.current) return;

    const imageUrl = webcamRef.current.getScreenshot();
    if (!imageUrl) return;
    
    // Random position calculation (avoiding center area)
    const centerBuffer = 200;
    const maxX = window.innerWidth - 200;
    const maxY = window.innerHeight - 240;
    
    let x, y;
    do {
      x = Math.random() * maxX;
      y = Math.random() * maxY;
    } while (
      x > window.innerWidth / 2 - centerBuffer && 
      x < window.innerWidth / 2 + centerBuffer &&
      y > window.innerHeight / 2 - centerBuffer && 
      y < window.innerHeight / 2 + centerBuffer
    );

    const newPhoto: PolaroidPhoto = {
      id: Date.now().toString(),
      imageUrl,
      x,
      y
    };

    setPhotos(prev => [...prev, newPhoto]);
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
      {/* Polaroid Camera Box */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="bg-white p-6 rounded-lg shadow-2xl border-4 border-gray-300" style={{ width: '320px' }}>
          <div className="bg-black rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
            {cameraActive ? (
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover"
                videoConstraints={{
                  facingMode: 'user',
                  width: 640,
                  height: 480
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="text-4xl mb-2">📷</div>
                  <div>Camera Off</div>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            {!cameraActive ? (
              <button
                onClick={() => setCameraActive(true)}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-full transition-colors"
              >
                Start Camera
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={capturePhoto}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-full transition-colors"
                >
                  📸 Take Photo
                </button>
                <button
                  onClick={() => setCameraActive(false)}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Stop Camera
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scattered Polaroid Photos */}
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="absolute transform cursor-pointer group"
          style={{ 
            left: `${photo.x}px`, 
            top: `${photo.y}px`,
            transform: `rotate(${Math.random() * 20 - 10}deg)`
          }}
        >
          <div className="bg-white p-3 pb-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="relative">
              <img
                src={photo.imageUrl}
                alt="Polaroid"
                className="w-40 h-30 object-cover"
              />
              <button
                onClick={() => removePhoto(photo.id)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}