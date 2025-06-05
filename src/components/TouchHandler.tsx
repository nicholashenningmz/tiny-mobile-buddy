
import React from 'react';
import { CircleComponent } from "@/components/CircleComponent";
import { ImpAnimation } from "@/components/ImpAnimation";
import { Finger } from "@/hooks/useGameState";
import { COLORS } from "@/hooks/useGameLogic";

interface TouchHandlerProps {
  fingers: Finger[];
  screenColor: string;
  gamePhase: string;
  showImpAnimation: boolean;
  showOnlyWinner: boolean;
  winner: Finger | null;
  isTouchBlocked: (gamePhase: string) => boolean;
  setFingers: (fingers: Finger[]) => void;
  colorIndexRef: React.MutableRefObject<number>;
  countdownRef: React.MutableRefObject<NodeJS.Timeout | null>;
  startCountdown: () => void;
}

export const TouchHandler: React.FC<TouchHandlerProps> = ({
  fingers,
  screenColor,
  gamePhase,
  showImpAnimation,
  showOnlyWinner,
  winner,
  isTouchBlocked,
  setFingers,
  colorIndexRef,
  countdownRef,
  startCountdown
}) => {
  const handleTouchStart = (event: React.TouchEvent) => {
    event.preventDefault();
    
    // Block touches during animation sequence
    if (isTouchBlocked(gamePhase)) return;

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
    
    // Block touches during animation sequence
    if (isTouchBlocked(gamePhase)) return;

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
    
    // Block touches during animation sequence
    if (isTouchBlocked(gamePhase)) return;

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

  return (
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
        // During revealing phase (imp animation), only show winner
        if (gamePhase === 'revealing' && showOnlyWinner && finger.id !== winner?.id) {
          return null;
        }
        
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
            isWinner={isCurrentWinner && (gamePhase === 'hiding-losers' || gamePhase === 'expanding' || gamePhase === 'contracting' || gamePhase === 'revealing')}
          />
        ) : null;
      })}

      {/* Evil imp animation */}
      {showImpAnimation && (
        <ImpAnimation />
      )}
    </div>
  );
};
