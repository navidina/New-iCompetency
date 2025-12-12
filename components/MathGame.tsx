import React from 'react';
import MathGameImpl from '../src/components/games/math/MathGame';

interface Props {
  onExit: () => void;
  onComplete: (score: number) => void;
}

const MathGame: React.FC<Props> = ({ onExit, onComplete }) => {
  return (
    <MathGameImpl
      onFinish={(score) => {
        onComplete(score);
      }}
    />
  );
};

export default MathGame;
