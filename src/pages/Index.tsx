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

type GamePhase = 'waiting' | 'hiding-losers' | 'expanding' | 'contracting' | 'fading' | 'revealing' | 'resetting';

const Index = () => {
  const [fingers, setFingers] = useState<Finger[]>([]);
  const [gamePhase, setGamePhase] = useState<GamePhase>('waiting');
  const [winner, setWinner] = useState<Finger | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [screenColor, setScreenColor] = useState('#000000');
  const [showImpAnimation, setShowImpAnimation] = useState(false);
  const [showOnlyWinner, setShowOnlyWinner] = useState(false);
  
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

  // Execute the new selection sequence
  const executeSelection = () => {
    if (fingers.length === 0) return;
    
    const selectedWinner = findWinner(fingers);
    setWinner(selectedWinner);
    
    // Phase 1: Hide losing circles (0.5 seconds)
    setGamePhase('hiding-losers');
    setShowOnlyWinner(true);
    
    setTimeout(() => {
      // Phase 2: Expand winner color to fill screen (0.5 seconds)
      setGamePhase('expanding');
      setScreenColor(selectedWinner.color);
      
      setTimeout(() => {
        // Phase 3: Contract back to circle with vibration (0.5 seconds)
        setGamePhase('contracting');
        setScreenColor('#000000');
        vibrate();
        
        setTimeout(() => {
          // Phase 4: Fade the winning circle (0.5 seconds)
          setGamePhase('fading');
          
          setTimeout(() => {
            // Phase 5: Wait 1 second, then show imp animation
            setTimeout(() => {
              setGamePhase('revealing');
              setScreenColor('#1a1a1a');
              setShowImpAnimation(true);
              setShowOnlyWinner(false);
              playEvilGiggle();
              
              setTimeout(() => {
                // Phase 6: Reset everything
                setGamePhase('resetting');
                setShowImpAnimation(false);
                setScreenColor('#000000');
                setWinner(null);
                setFingers([]);
                setShowOnlyWinner(false);
                colorIndexRef.current = 0;
                setGamePhase('waiting');
              }, 3000);
            }, 1000);
          }, 500);
        }, 500);
      }, 500);
    }, 500);
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
        {fingers.map((finger) => {
          // Show all circles during waiting, or only winner during specific phases
          const shouldShow = !showOnlyWinner || finger.id === winner?.id;
          const isCurrentWinner = winner?.id === finger.id;
          
          // Hide during fading phase if it's the winner
          if (gamePhase === 'fading' && isCurrentWinner) {
            return null;
          }
          
          return shouldShow ? (
            <CircleComponent
              key={finger.id}
              x={finger.x}
              y={finger.y}
              color={finger.color}
              isWinner={isCurrentWinner && (gamePhase === 'hiding-losers' || gamePhase === 'expanding' || gamePhase === 'contracting')}
            />
          ) : null;
        })}

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
