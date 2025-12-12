import React from 'react';

interface TimerProps {
  timeLeft: number; // in ms
  totalTime?: number; // in ms, for progress bar calculation
  showWarning?: boolean;
}

const Timer: React.FC<TimerProps> = ({ timeLeft, totalTime, showWarning }) => {
  const seconds = Math.ceil(timeLeft / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const formattedTime = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;

  const progress = totalTime ? (timeLeft / totalTime) * 100 : 100;

  return (
    <div className={`flex flex-col items-center justify-center p-2 rounded-lg ${showWarning ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-700'}`}>
      <span className="text-xl font-mono font-bold">{formattedTime}</span>
      {totalTime && (
        <div className="w-full h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${showWarning ? 'bg-red-500' : 'bg-blue-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default Timer;
