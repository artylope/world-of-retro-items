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

        // Exclusion zones
        const polaroidSize = Math.min(window.innerWidth * 0.12, 200);

        // Red zone (center camera area) - 38vw × 50vh, centered
        const redZoneWidth = window.innerWidth * 0.38;
        const redZoneHeight = window.innerHeight * 0.50;
        const redZoneLeft = (window.innerWidth - redZoneWidth) / 2;
        const redZoneRight = redZoneLeft + redZoneWidth;
        const redZoneTop = (window.innerHeight - redZoneHeight) / 2;
        const redZoneBottom = redZoneTop + redZoneHeight;

        // Preview zone (top area) - 20vw × 15vh, top center
        const previewWidth = window.innerWidth * 0.20;
        const previewHeight = window.innerHeight * 0.15;
        const previewLeft = (window.innerWidth - previewWidth) / 2;
        const previewRight = previewLeft + previewWidth;
        const previewTop = 16; // top-4 = 16px
        const previewBottom = previewTop + previewHeight;

        const maxX = window.innerWidth - polaroidSize;
        const maxY = window.innerHeight - polaroidSize;

        let x, y;
        do {
            x = Math.random() * maxX;
            y = Math.random() * maxY;
        } while (
            // Check if polaroid overlaps with red zone
            (x < redZoneRight && x + polaroidSize > redZoneLeft && y < redZoneBottom && y + polaroidSize > redZoneTop) ||
            // Check if polaroid overlaps with preview zone
            (x < previewRight && x + polaroidSize > previewLeft && y < previewBottom && y + polaroidSize > previewTop)
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
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-5 bg-red-500 opacity-0 pointer-events-none w-[38vw] h-[50vh] rounded-lg">
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