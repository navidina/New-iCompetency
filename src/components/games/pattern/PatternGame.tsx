import React, { useState, useEffect } from 'react';
import GameShell from '../../../../components/GameShell';
import { NumberMatrixGame } from './NumberMatrixGame';
import { VisualSequenceGame } from './VisualSequenceGame';
import { VisualAnalogyGame } from './VisualAnalogyGame';
import { BrainCircuit } from 'lucide-react';

interface PatternGameProps {
  onComplete: (score: number) => void;
  onExit: () => void;
}

export const PatternGame: React.FC<PatternGameProps> = ({ onComplete, onExit }) => {
  const [subGame, setSubGame] = useState<'matrix' | 'sequence' | 'analogy' | 'intro'>('intro');
  const [totalScore, setTotalScore] = useState(0);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'paused' | 'finished'>('intro');

  const handleSubGameComplete = (score: number) => {
    const newTotal = totalScore + score;
    setTotalScore(newTotal);

    if (subGame === 'matrix') setSubGame('sequence');
    else if (subGame === 'sequence') setSubGame('analogy');
    else if (subGame === 'analogy') onComplete(Math.round(newTotal / 3));
  };

  // Sync Start
  useEffect(() => {
    if (gameState === 'playing' && subGame === 'intro') {
        setSubGame('matrix');
    }
  }, [gameState, subGame]);

  const renderContent = () => {
    switch (subGame) {
      case 'intro':
        return null; // Handled by GameShell Intro
      case 'matrix': return <NumberMatrixGame onComplete={handleSubGameComplete} />;
      case 'sequence': return <VisualSequenceGame onComplete={handleSubGameComplete} />;
      case 'analogy': return <VisualAnalogyGame onComplete={handleSubGameComplete} />;
      default: return null;
    }
  };

  return (
    <GameShell
      title="تشخیص الگو (A10+)"
      description="مجموعه‌ای از بازی‌های شناختی شامل ماتریس اعداد، دنباله تصویری و قیاس تصویری برای سنجش هوش استدلالی."
      instructions={[
        "در بازی ماتریس، عدد گم شده را پیدا کنید.",
        "در بازی دنباله، شکل بعدی را حدس بزنید.",
        "در بازی قیاس، رابطه بین اشکال را کشف کنید."
      ]}
      icon={<BrainCircuit />}
      stats={{
        score: totalScore,
        lives: 3,
        level: subGame === 'matrix' ? 1 : subGame === 'sequence' ? 2 : 3
      }}
      gameState={gameState}
      setGameState={setGameState}
      colorTheme="indigo"
      onExit={onExit}
    >
      {renderContent()}
    </GameShell>
  );
};
