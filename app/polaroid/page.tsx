'use client';

import { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import PolaroidCamera3D from '../../components/PolaroidCamera3D';

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
            {/* Hidden but functioning Webcam for photo capture */}
            {cameraActive && (
                <div className="fixed bottom-4 right-4 w-32 h-24 opacity-30 pointer-events-none z-50 border border-gray-300 rounded overflow-hidden">
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
                </div>
            )}

            {/* 3D Polaroid Camera */}
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">

                <PolaroidCamera3D
                    onCapture={capturePhoto}
                    isActive={cameraActive}
                />

                <div className="space-y-3 mt-6">
                    {!cameraActive ? (
                        <button
                            onClick={() => setCameraActive(true)}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-full transition-colors shadow-lg"
                        >
                            Start Camera
                        </button>
                    ) : (
                        <button
                            onClick={() => setCameraActive(false)}
                            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-full transition-colors shadow-lg"
                        >
                            Stop Camera
                        </button>
                    )}
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