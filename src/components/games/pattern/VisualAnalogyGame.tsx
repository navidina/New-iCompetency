import React, { useState } from 'react';
import { ScoreExplanation, toTScoreWithExplanation } from '../../../utils/scoring';
import { ScoreExplanationCard } from '../../common/ScoreExplanationCard';
import { toPersianNum } from '../../../utils';
import { ArrowRight, Circle, Square, Triangle, Hexagon, Star } from 'lucide-react';
import { sfx } from '../../../../services/audioService';

const SHAPES = ['circle', 'square', 'triangle', 'hexagon', 'star'];
const COLORS = ['text-red-500', 'text-blue-500', 'text-green-500', 'text-yellow-500', 'text-purple-500'];

const generateAnalogy = (level: number) => {
    // A : B :: C : ?

    let ruleType = 'shape';
    if (level <= 2) ruleType = 'shape';
    else if (level <= 4) ruleType = 'color';
    else ruleType = 'both';

    const baseShapeIdx = Math.floor(Math.random() * SHAPES.length);
    const targetShapeIdx = (baseShapeIdx + Math.floor(Math.random() * (SHAPES.length - 1)) + 1) % SHAPES.length;

    const baseColorIdx = Math.floor(Math.random() * COLORS.length);
    const targetColorIdx = (baseColorIdx + Math.floor(Math.random() * (COLORS.length - 1)) + 1) % COLORS.length;

    let a, b, c, correct;

    if (ruleType === 'shape') {
        // A (S1, C1) -> B (S2, C1) :: C (S1, C2) -> D (S2, C2)
        // Wait, analogy usually implies A and B share a relation that C and D share.
        // Rule: Shape changes S1 -> S2. Color stays.
        const cColorIdx = (baseColorIdx + 1) % COLORS.length;

        a = { type: SHAPES[baseShapeIdx], color: COLORS[baseColorIdx] };
        b = { type: SHAPES[targetShapeIdx], color: COLORS[baseColorIdx] };
        c = { type: SHAPES[baseShapeIdx], color: COLORS[cColorIdx] };
        correct = { type: SHAPES[targetShapeIdx], color: COLORS[cColorIdx] };

    } else if (ruleType === 'color') {
        // Rule: Color changes C1 -> C2. Shape stays.
        const cShapeIdx = (baseShapeIdx + 1) % SHAPES.length;

        a = { type: SHAPES[baseShapeIdx], color: COLORS[baseColorIdx] };
        b = { type: SHAPES[baseShapeIdx], color: COLORS[targetColorIdx] };
        c = { type: SHAPES[cShapeIdx], color: COLORS[baseColorIdx] };
        correct = { type: SHAPES[cShapeIdx], color: COLORS[targetColorIdx] };

    } else {
        // Rule: Both change. S1->S2 AND C1->C2.
        // A(S1, C1) -> B(S2, C2)
        // C(S3, C3) -> D(S4, C4) where relation is consistent?
        // Usually analogy is: S1->S2 is the transformation.
        // So C should be S3 (random) and D becomes S4 (S3 applied same transformation).
        // Let's keep it simpler: A->B is specific transformation. C->D is SAME transformation.

        // Transform: Shape shift +1, Color shift +1
        const sShift = 1;
        const cShift = 1;

        const cShapeIdx = (baseShapeIdx + 2) % SHAPES.length; // Different base for C
        const cColorIdx = (baseColorIdx + 2) % COLORS.length;

        a = { type: SHAPES[baseShapeIdx], color: COLORS[baseColorIdx] };
        b = { type: SHAPES[(baseShapeIdx + sShift) % SHAPES.length], color: COLORS[(baseColorIdx + cShift) % COLORS.length] };

        c = { type: SHAPES[cShapeIdx], color: COLORS[cColorIdx] };
        correct = { type: SHAPES[(cShapeIdx + sShift) % SHAPES.length], color: COLORS[(cColorIdx + cShift) % COLORS.length] };
    }

    // Generate Distractors
    const options = [correct];
    while(options.length < 4) {
        const rndShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        const rndColor = COLORS[Math.floor(Math.random() * COLORS.length)];

        const isDuplicate = options.some(o => o.type === rndShape && o.color === rndColor);
        if (!isDuplicate) {
            options.push({ type: rndShape, color: rndColor });
        }
    }

    return {
        a, b, c, correct,
        options: options.sort(() => Math.random() - 0.5)
    };
};

export const VisualAnalogyGame: React.FC<{ onComplete: (score: number) => void }> = ({ onComplete }) => {
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [question, setQuestion] = useState(generateAnalogy(1));
    const [gameOver, setGameOver] = useState(false);
    const [explanation, setExplanation] = useState<ScoreExplanation | null>(null);

    const handleAnswer = (opt: any) => {
        if (opt.type === question.correct.type && opt.color === question.correct.color) {
            sfx.playSuccess();
            const nextLevel = level + 1;
            setScore(s => s + 20 + (level * 2));
            setLevel(nextLevel);
            setQuestion(generateAnalogy(nextLevel));
            if (nextLevel > 15) handleGameOver();
        } else {
            sfx.playError();
            handleGameOver();
        }
    };

    const handleGameOver = () => {
        setGameOver(true);
        if (score > 0) sfx.playWin();
        const result = toTScoreWithExplanation(score, 50, 10, 'Analogy Score');
        setExplanation(result.explanation);
    };

    const renderShape = (item: any) => {
        const props = { className: item.color, size: 48 };
        if (item.type === 'circle') return <Circle {...props} />;
        if (item.type === 'square') return <Square {...props} />;
        if (item.type === 'triangle') return <Triangle {...props} />;
        if (item.type === 'hexagon') return <Hexagon {...props} />;
        if (item.type === 'star') return <Star {...props} />;
        return <div className={`w-12 h-12 ${item.color} bg-current rounded-full opacity-50`} />;
    };

    if (gameOver && explanation) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6">پایان قیاس</h2>
              <div className="w-full max-w-md mb-8">
                  <ScoreExplanationCard explanation={explanation} />
              </div>
              <button onClick={() => onComplete(explanation.finalScore)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold">پایان</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
            <h3 className="text-xl font-bold mb-4 text-slate-700 dark:text-slate-200">
                رابطه را پیدا کنید (سطح {toPersianNum(level)})
            </h3>

            <div className="flex items-center gap-4 md:gap-8 mb-12">
                <div className="flex items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                    {renderShape(question.a)}
                    <ArrowRight className="text-slate-400" />
                    {renderShape(question.b)}
                </div>
                <div className="text-2xl font-bold text-slate-400">::</div>
                <div className="flex items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                    {renderShape(question.c)}
                    <ArrowRight className="text-slate-400" />
                    <div className="w-12 h-12 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-xl font-bold text-slate-400">?</div>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
                {question.options.map((opt, idx) => (
                    <button key={idx} onClick={() => handleAnswer(opt)} className="p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-center transition-all active:scale-95">
                        {renderShape(opt)}
                    </button>
                ))}
            </div>
        </div>
    );
};
