import React from 'react';
import { ScoreExplanation } from '../../utils/scoring';
import { ChevronDown, ChevronUp, Calculator } from 'lucide-react';

interface ScoreExplanationProps {
  explanation: ScoreExplanation;
  title?: string;
}

export const ScoreExplanationCard: React.FC<ScoreExplanationProps> = ({ explanation, title = 'محاسبات امتیاز' }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-primary font-medium">
          <Calculator className="w-5 h-5" />
          <span>{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
      </button>

      {isOpen && (
        <div className="p-4 space-y-4">
          {/* Formula */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 text-sm font-mono text-center text-blue-800 dark:text-blue-200" dir="ltr">
            {explanation.formula}
          </div>

          {/* Variables Table */}
          {Object.keys(explanation.variables).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(explanation.variables).map(([key, val]) => (
                <div key={key} className="flex flex-col p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{key}</span>
                  <span className="font-bold text-gray-800 dark:text-white" dir="ltr">{val}</span>
                </div>
              ))}
            </div>
          )}

          {/* Steps */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">مراحل محاسبه:</h4>
            {explanation.steps.map((step, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="flex flex-col">
                  <span className="text-gray-800 dark:text-gray-200">{step.label}</span>
                  {step.description && <span className="text-xs text-gray-500">{step.description}</span>}
                </div>
                <div className="flex items-center gap-2">
                   {step.operation && <span className="text-gray-400 font-mono">{step.operation}</span>}
                   <span className="font-mono font-medium text-primary" dir="ltr">{step.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Final Result */}
          <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center font-bold text-lg">
            <span className="text-gray-900 dark:text-white">امتیاز نهایی</span>
            <span className="text-primary" dir="ltr">{Number(explanation.finalScore).toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
