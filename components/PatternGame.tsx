import React from 'react';
import { PatternGame as PatternGameImpl } from '../src/components/games/pattern/PatternGame';

interface Props {
  onExit: () => void;
  onComplete: (score: number) => void;
}

const PatternGame: React.FC<Props> = ({ onExit, onComplete }) => {
  return (
    <PatternGameImpl
      onExit={onExit}
      onComplete={onComplete}
    />
  );
};

export default PatternGame;
