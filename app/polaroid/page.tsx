'use client';

import { useState, useRef, useEffect } from 'react';
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

    // Auto-start camera on component mount
    useEffect(() => {
        setCameraActive(true);
    }, []);

    // Handle spacebar to take photos
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.code === 'Space' && cameraActive) {
                event.preventDefault();
                capturePhoto();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [cameraActive]);

    const capturePhoto = () => {
        if (!webcamRef.current) return;

        const imageUrl = webcamRef.current.getScreenshot();
        if (!imageUrl) return;

        // Responsive positioning using viewport proportions
        const centerExclusionWidth = window.innerWidth * 0.38; // Center camera zone: 38vw
        const centerExclusionHeight = window.innerHeight * 0.50; // Center camera zone: 50vh
        const polaroidSize = Math.min(window.innerWidth * 0.12, 200); // Responsive polaroid size

        // Top preview exclusion zone
        const previewWidth = window.innerWidth * 0.20; // 20vw
        const previewHeight = window.innerHeight * 0.15; // 15vw converted to vh roughly
        
        const maxX = window.innerWidth - polaroidSize;
        const maxY = window.innerHeight - polaroidSize;

        // Center camera exclusion boundaries
        const centerLeft = (window.innerWidth - centerExclusionWidth) / 2 - polaroidSize * 0.2;
        const centerRight = (window.innerWidth + centerExclusionWidth) / 2 + polaroidSize * 0.2;
        const centerTop = (window.innerHeight - centerExclusionHeight) / 2 - polaroidSize * 0.2;
        const centerBottom = (window.innerHeight + centerExclusionHeight) / 2 + polaroidSize * 0.2;

        // Top preview exclusion boundaries  
        const previewLeft = (window.innerWidth - previewWidth) / 2 - polaroidSize * 0.2;
        const previewRight = (window.innerWidth + previewWidth) / 2 + polaroidSize * 0.2;
        const previewTop = 16 - polaroidSize * 0.2; // top-4 = 16px
        const previewBottom = 16 + previewHeight + polaroidSize * 0.2;

        let x, y;
        do {
            x = Math.random() * maxX;
            y = Math.random() * maxY;
        } while (
            // Avoid center camera area
            (x > centerLeft && x < centerRight && y > centerTop && y < centerBottom) ||
            // Avoid top preview area
            (x > previewLeft && x < previewRight && y > previewTop && y < previewBottom)
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
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 w-[20vw] h-[15vw] max-w-32 max-h-24 rounded pointer-events-none z-50 border border-gray-300 rounded overflow-hidden">
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

            {/* Polaroid exclusion zone - red boundary */}
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-5 bg-red-500 opacity-20 pointer-events-none w-[38vw] h-[50vh] rounded-lg">
            </div>

            {/* 3D Polaroid Camera */}
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">

                <PolaroidCamera3D
                    onCapture={capturePhoto}
                    isActive={cameraActive}
                />


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
                                className="w-[min(10vw,160px)] h-[min(7.5vw,120px)] object-cover"
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