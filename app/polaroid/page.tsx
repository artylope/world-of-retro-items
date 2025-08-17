'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Webcam from 'react-webcam';
import PolaroidCamera3D from '../../components/PolaroidCamera3D';
import { X } from 'lucide-react';

interface PolaroidPhoto {
    id: string;
    imageUrl: string;
    x: number;
    y: number;
    rotation: number;
}

export default function Polaroid() {
    const [photos, setPhotos] = useState<PolaroidPhoto[]>([]);
    const webcamRef = useRef<Webcam>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [draggedPhoto, setDraggedPhoto] = useState<string | null>(null);
    const [currentInstruction, setCurrentInstruction] = useState(0);
    const [instructionOpacity, setInstructionOpacity] = useState(1);

    // Auto-start camera on component mount
    useEffect(() => {
        setCameraActive(true);
    }, []);

    // Cycling instructions effect
    useEffect(() => {
        const instructions = [
            "Click camera to take photo",
            "Press SPACE to take photo",
            "Drag to rotate camera"
        ];

        const cycleInstructions = () => {
            // Fade out
            setInstructionOpacity(0);

            setTimeout(() => {
                // Change instruction
                setCurrentInstruction((prev) => (prev + 1) % instructions.length);
                // Fade in
                setInstructionOpacity(1);
            }, 300); // Half second fade out
        };

        const interval = setInterval(cycleInstructions, 3000); // 3 seconds per instruction

        return () => clearInterval(interval);
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

        const maxX = window.innerWidth - polaroidSize;
        const maxY = window.innerHeight - polaroidSize;

        let x, y;
        do {
            x = Math.random() * maxX;
            y = Math.random() * maxY;
        } while (
            // Check if polaroid overlaps with red zone (camera area)
            (x < redZoneRight && x + polaroidSize > redZoneLeft && y < redZoneBottom && y + polaroidSize > redZoneTop)
        );

        const newPhoto: PolaroidPhoto = {
            id: Date.now().toString(),
            imageUrl,
            x,
            y,
            rotation: Math.random() * 20 - 10 // Random rotation between -10 and 10 degrees
        };

        setPhotos(prev => [...prev, newPhoto]);
    };

    const removePhoto = (id: string) => {
        setPhotos(prev => prev.filter(photo => photo.id !== id));
    };

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent, photoId: string) => {
        setDraggedPhoto(photoId);
        e.dataTransfer.effectAllowed = 'move';

        // Create a custom drag image (optional)
        const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
        dragImage.style.transform = 'rotate(0deg)';
        dragImage.style.opacity = '0.8';
        e.dataTransfer.setDragImage(dragImage, 75, 75);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();

        if (!draggedPhoto) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left - 75; // Offset for center of photo
        const y = e.clientY - rect.top - 75;

        // Ensure photo stays within bounds
        const polaroidSize = Math.min(window.innerWidth * 0.12, 200);
        const maxX = window.innerWidth - polaroidSize;
        const maxY = window.innerHeight - polaroidSize;

        const clampedX = Math.max(0, Math.min(x, maxX));
        const clampedY = Math.max(0, Math.min(y, maxY));

        setPhotos(prev => prev.map(photo =>
            photo.id === draggedPhoto
                ? { ...photo, x: clampedX, y: clampedY }
                : photo
        ));

        setDraggedPhoto(null);
    };

    const handleDragEnd = () => {
        setDraggedPhoto(null);
    };

    return (
        <div
            className="relative min-h-screen bg-sky-500 overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <div className="fixed top-0 left-0 w-full h-full z-50 overflow-hidden dreamy-blur"></div>

            {/* Hidden but functioning Webcam for photo capture */}
            {cameraActive && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 w-80 h-60 opacity-0 pointer-events-none z-0">
                    <Webcam
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-full h-full object-cover"
                        videoConstraints={{
                            facingMode: 'user',
                            width: 1280,
                            height: 960
                        }}
                    />
                </div>
            )}

            {/* Polaroid exclusion zone - red boundary */}
            <div className="fixed top-2/5 left-1/2 transform -translate-x-1/2 -translate-y-2/5 z-5 bg-red-500 opacity-0 pointer-events-none w-[38vw] h-[50vh] rounded-lg">
            </div>

            {/* 3D Polaroid Camera */}
            <div className="fixed top-2/5 left-1/2 transform -translate-x-1/2 -translate-y-2/5 z-10">

                <PolaroidCamera3D
                    onCapture={capturePhoto}
                    isActive={cameraActive}
                    webcamRef={webcamRef}
                />
            </div>
            <div
                className="fixed top-44 left-1/2 transform -translate-x-1/2 text-center font-medium text-sm md:text-base text-white px-2 transition-opacity duration-500"
                style={{ opacity: instructionOpacity }}
            >
                {(() => {
                    const instructions = [
                        "Click camera to take photo",
                        "Press SPACE to take photo",
                        "Drag to rotate camera"
                    ];
                    return instructions[currentInstruction];
                })()}
            </div>
            {/* Scattered Polaroid Photos */}
            {photos.map((photo) => (
                <div
                    key={photo.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, photo.id)}
                    onDragEnd={handleDragEnd}
                    className={`absolute transform cursor-move group transition-opacity ${draggedPhoto === photo.id ? 'opacity-50' : 'opacity-100'
                        }`}
                    style={{
                        left: `${photo.x}px`,
                        top: `${photo.y}px`,
                        transform: `rotate(${photo.rotation}deg)`,
                        zIndex: draggedPhoto === photo.id ? 1000 : 'auto'
                    }}
                >
                    <div className="bg-white p-3 pb-8 shadow-xl rounded-xs hover:shadow-xl transition-shadow">
                        <div className="relative">
                            <img
                                src={photo.imageUrl}
                                alt="Polaroid"
                                className="w-[min(12vw,200px)] h-[min(10vw,180px)] object-cover rounded-xs"
                            />
                            <button
                                onClick={() => removePhoto(photo.id)}
                                className="absolute -top-6 -right-6 bg-zinc-200 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                            >
                                <X className="w-4 h-4 text-zinc-600 hover:text-zinc-500" strokeWidth={2} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
            <p className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-center text-sm text-sky-200 px-2 -translate-y-10">
                Built by <a href="https://www.artylope.com/" className="font-semibold text-sky-50 hover:text-white ">Yi Xin</a> using <a href="https://www.react-three-fiber.com/" className="font-semibold text-sky-50 hover:text-white ">React Three Fiber</a>. Thanks to <Link href="https://sketchfab.com/3d-models/polaroid-1000-sx-70-onestep-ff290b601dbe471a963f818a1646d31a" className="font-semibold text-sky-50 hover:text-white ">BIGDOGLOBAL</Link> for the Polaroid 1000 model

            </p>
        </div>
    );
} 