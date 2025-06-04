
import React, { useState, useEffect } from 'react';
import { HelpModal } from "@/components/HelpModal";
import { GameControls } from "@/components/GameControls";
import { TouchHandler } from "@/components/TouchHandler";
import { useGameState } from '@/hooks/useGameState';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useGameAnimation } from '@/hooks/useGameAnimation';

const Index = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  
  const {
    fingers,
    setFingers,
    gamePhase,
    setGamePhase,
    winner,
    setWinner,
    screenColor,
    setScreenColor,
    showImpAnimation,
    setShowImpAnimation,
    showOnlyWinner,
    setShowOnlyWinner,
    countdownRef,
    colorIndexRef,
    resetGame
  } = useGameState();
  
  const { findWinner, isTouchBlocked } = useGameLogic();
  const { executeSelection } = useGameAnimation(
    soundEnabled,
    setGamePhase,
    setScreenColor,
    setShowImpAnimation,
    setShowOnlyWinner,
    resetGame
  );
  
  // Start countdown timer
  const startCountdown = () => {
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
    }
    
    countdownRef.current = setTimeout(() => {
      if (fingers.length > 0) {
        const selectedWinner = findWinner(fingers);
        setWinner(selectedWinner);
        executeSelection(selectedWinner);
      }
    }, 2000);
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
      <TouchHandler 
        fingers={fingers}
        screenColor={screenColor}
        gamePhase={gamePhase}
        showImpAnimation={showImpAnimation}
        showOnlyWinner={showOnlyWinner}
        winner={winner}
        isTouchBlocked={isTouchBlocked}
        setFingers={setFingers}
        colorIndexRef={colorIndexRef}
        countdownRef={countdownRef}
        startCountdown={startCountdown}
      />

      {/* Control buttons */}
      <GameControls 
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        setShowHelp={setShowHelp}
      />

      {/* Help modal */}
      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </div>
  );
};

export default Index;
