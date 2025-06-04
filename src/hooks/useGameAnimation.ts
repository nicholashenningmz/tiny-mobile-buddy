
import { useAudio } from './useAudio';
import { GamePhase } from './useGameState';

export const useGameAnimation = (
  soundEnabled: boolean,
  setGamePhase: (phase: GamePhase) => void,
  setScreenColor: (color: string) => void,
  setShowImpAnimation: (show: boolean) => void,
  setShowOnlyWinner: (show: boolean) => void,
  resetGame: () => void
) => {
  const { playEvilGiggle, vibrate } = useAudio(soundEnabled);

  // Execute the selection animation sequence
  const executeSelection = (winner: any) => {
    if (!winner) return;
    
    // Phase 1: Hide losing circles (0.5 seconds)
    setGamePhase('hiding-losers');
    setShowOnlyWinner(true);
    
    setTimeout(() => {
      // Phase 2: Expand winner color to fill screen (0.5 seconds)
      setGamePhase('expanding');
      setScreenColor(winner.color);
      
      setTimeout(() => {
        // Phase 3: Contract back to circle with vibration (0.5 seconds)
        setGamePhase('contracting');
        setScreenColor('#000000');
        vibrate();
        
        setTimeout(() => {
          // Phase 4: Keep winning circle on screen for an additional half second
          setTimeout(() => {
            // Phase 5: Fade the winning circle (0.5 seconds)
            setGamePhase('fading');
            
            setTimeout(() => {
              // Phase 6: Wait 1 second, then show imp animation
              setTimeout(() => {
                setGamePhase('revealing');
                setScreenColor('#1a1a1a');
                setShowImpAnimation(true);
                setShowOnlyWinner(false);
                playEvilGiggle();
                
                setTimeout(() => {
                  // Phase 7: Reset everything
                  resetGame();
                }, 3000);
              }, 1000);
            }, 500);
          }, 500); // Added delay to keep the circle visible longer
        }, 500);
      }, 500);
    }, 500);
  };

  return { executeSelection };
};
