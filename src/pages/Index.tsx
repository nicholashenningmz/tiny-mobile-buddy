
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { HelpCircle, Volume2, VolumeX } from "lucide-react";
import { HelpModal } from "@/components/HelpModal";
import { CircleComponent } from "@/components/CircleComponent";
import { ImpAnimation } from "@/components/ImpAnimation";

const COLORS = [
  '#FF6B6B', // Bright red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue  
  '#96CEB4', // Mint green
  '#FECA57', // Yellow
  '#FF9FF3', // Pink
  '#54A0FF', // Light blue
  '#5F27CD', // Purple
  '#00D2D3', // Cyan
  '#FF9F43'  // Orange
];

interface Finger {
  id: string;
  x: number;
  y: number;
  color: string;
}

type GamePhase = 'waiting' | 'selecting' | 'revealing' | 'resetting';

const Index = () => {
  const [fingers, setFingers] = useState<Finger[]>([]);
  const [gamePhase, setGamePhase] = useState<GamePhase>('waiting');
  const [winner, setWinner] = useState<Finger | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [screenColor, setScreenColor] = useState('#000000');
  const [showImpAnimation, setShowImpAnimation] = useState(false);
  
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const colorIndexRef = useRef(0);
  
  // Play evil giggle sound
  const playEvilGiggle = () => {
    if (soundEnabled) {
      // In a real implementation, this would play an actual sound file
      console.log('Playing evil giggle sound! 😈');
    }
  };

  // Vibration effect
  const vibrate = () => {
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
  };

  // Find the winner (finger closest to bottom of screen)
  const findWinner = (activeFingers: Finger[]): Finger => {
    let winner = activeFingers[0];
    
    activeFingers.forEach(finger => {
      if (finger.y > winner.y) {
        winner = finger;
      } else if (finger.y === winner.y && finger.x > winner.x) {
        // Tiebreaker: rightmost finger wins
        winner = finger;
      }
    });
    
    return winner;
  };

  // Start countdown timer
  const startCountdown = () => {
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
    }
    
    countdownRef.current = setTimeout(() => {
      if (fingers.length > 0) {
        executeSelection();
      }
    }, 2000);
  };

  // Execute the evil selection
  const executeSelection = () => {
    if (fingers.length === 0) return;
    
    setGamePhase('selecting');
    const selectedWinner = findWinner(fingers);
    setWinner(selectedWinner);
    
    // Phase 1: Winner highlight (2 seconds)
    setScreenColor(selectedWinner.color);
    vibrate();
    
    setTimeout(() => {
      // Phase 2: Evil reveal (3 seconds)
      setGamePhase('revealing');
      setScreenColor('#1a1a1a');
      setShowImpAnimation(true);
      playEvilGiggle();
      
      setTimeout(() => {
        // Phase 3: Reset
        setGamePhase('resetting');
        setShowImpAnimation(false);
        setScreenColor('#000000');
        setWinner(null);
        setFingers([]);
        colorIndexRef.current = 0;
        setGamePhase('waiting');
      }, 3000);
    }, 2000);
  };

  // Handle touch events
  const handleTouchStart = (event: React.TouchEvent) => {
    event.preventDefault();
    if (gamePhase !== 'waiting') return;

    const touches = event.touches;
    const newFingers: Finger[] = [];

    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      
      newFingers.push({
        id: `finger-${touch.identifier}`,
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        color: COLORS[colorIndexRef.current % COLORS.length]
      });
      
      colorIndexRef.current++;
    }

    setFingers(newFingers);
    startCountdown();
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    event.preventDefault();
    if (gamePhase !== 'waiting') return;

    const touches = event.touches;
    const updatedFingers: Finger[] = [];

    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const existingFinger = fingers.find(f => f.id === `finger-${touch.identifier}`);
      
      if (existingFinger) {
        updatedFingers.push({
          ...existingFinger,
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top
        });
      }
    }

    setFingers(updatedFingers);
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    event.preventDefault();
    if (gamePhase !== 'waiting') return;

    const touches = event.touches;
    const remainingFingers = fingers.filter(finger => 
      Array.from(touches).some(touch => finger.id === `finger-${touch.identifier}`)
    );

    setFingers(remainingFingers);
    
    if (remainingFingers.length > 0) {
      startCountdown();
    } else {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden select-none">
      {/* Main touch area */}
      <div
        className="w-full h-full relative transition-colors duration-500"
        style={{ backgroundColor: screenColor }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Render finger circles */}
        {fingers.map((finger) => (
          <CircleComponent
            key={finger.id}
            x={finger.x}
            y={finger.y}
            color={finger.color}
            isWinner={winner?.id === finger.id && gamePhase === 'selecting'}
          />
        ))}

        {/* Evil imp animation */}
        {showImpAnimation && (
          <ImpAnimation />
        )}

        {/* Control buttons */}
        <div className="absolute top-4 right-4 flex gap-2 z-50">
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
            onClick={() => setShowHelp(true)}
          >
            <HelpCircle size={20} />
          </Button>
        </div>
      </div>

      {/* Help modal */}
      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </div>
  );
};

export default Index;
