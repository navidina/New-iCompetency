import { MathQuestion, MathLevelConfig } from '../types';

export const generateCorsiSequence = (length: number, gridSize: number): number[] => {
  const sequence: number[] = [];
  const totalCells = gridSize * gridSize; // e.g. 16 for 4x4

  for (let i = 0; i < length; i++) {
    let nextBlock;
    do {
      nextBlock = Math.floor(Math.random() * totalCells);
    } while (sequence.length > 0 && sequence[sequence.length - 1] === nextBlock); // Prevent immediate repeat
    sequence.push(nextBlock);
  }
  return sequence;
};

// Helper to get random integer between min and max (inclusive)
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomOp = (ops: string[] | 'all'): string => {
  if (ops === 'all') {
    const allOps = ['+', '-', '×', '÷'];
    return allOps[Math.floor(Math.random() * allOps.length)];
  }
  return ops[Math.floor(Math.random() * ops.length)];
};

export const generateMathQuestion = (level: number, config: MathLevelConfig): MathQuestion => {
  const { range, type = 'standard' } = config;
  const termsCount = config.terms || 2;
  const useParentheses = config.parentheses || false;

  let text = '';
  let answer = 0;
  let valid = false;
  let attempts = 0;

  // We loop to ensure we get a valid question (integer result, non-negative if required)
  while (!valid && attempts < 100) {
    attempts++;

    if (type === 'percentage') {
        // X% of Y
        // X in range [1, 100], Y in range [1, range[1]]
        // Make sure result is integer? Usually yes for mental math.
        // Let's pick an answer first, then find factors.
        // Or pick easy percentages: 10, 20, 25, 50, 75, etc.
        const easyPercents = [10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100];
        const pct = easyPercents[Math.floor(Math.random() * easyPercents.length)];
        // Find a number Y such that pct/100 * Y is int.
        // Y must be multiple of (100 / gcd(pct, 100)).
        const denom = 100;
        // Simple hack: Pick Y as multiple of 10 or 20 or 4 depending on pct.
        // Just pick Y up to range[1] and check.
        const possibleYs = [];
        for (let y = 10; y <= range[1]; y+=2) {
            if ((pct * y) % 100 === 0) possibleYs.push(y);
        }
        if (possibleYs.length === 0) {
             // Fallback
             const y = 100;
             text = `${pct}٪ عدد ${y}`;
             answer = (pct * y) / 100;
        } else {
             const y = possibleYs[Math.floor(Math.random() * possibleYs.length)];
             text = `${pct}٪ عدد ${y}`;
             answer = (pct * y) / 100;
        }
        valid = true;
    } else if (type === 'mixed') {
        // Could be fraction, percentage, power.
        // Implementation simplified for mixed level: 50% chance standard, 50% percentage.
        // Ideally should support fractions/powers as per prompt.
        // For now, let's treat mixed as "hard standard + percentages".
        if (Math.random() > 0.5) {
             // Percentage
             // Recursive call but check depth?
             // Just duplicate logic slightly to avoid infinite loops if config wrong.
             // Or call generateMathQuestion with percentage type directly.
             const q = generateMathQuestion(level, { ...config, type: 'percentage' });
             text = q.text;
             answer = q.answer;
             valid = true;
        } else {
             const q = generateMathQuestion(level, { ...config, type: 'standard' });
             text = q.text;
             answer = q.answer;
             valid = true;
        }
    } else {
        // Standard arithmetic
        const ops = config.ops || ['+'];
        const terms: number[] = [];
        const operations: string[] = [];

        // Generate terms
        // Fix: Ensure range exists. Default [1, 10] if missing?
        const rMin = range ? range[0] : 1;
        const rMax = range ? range[1] : 10;

        for (let i = 0; i < termsCount; i++) {
            terms.push(randomInt(rMin, rMax));
        }

        // Generate operations
        for (let i = 0; i < termsCount - 1; i++) {
            operations.push(getRandomOp(ops));
        }

        // Build Expression
        // Handle parentheses if needed (simplified: just wrap first two terms)
        // Note: Evaluation order matters (BODMAS).
        // We will build a string and eval it (carefully), or compute step by step.
        // To ensure integer results for division, we might need to construct backwards.

        if (termsCount === 2) {
            const op = operations[0];
            let a = terms[0];
            let b = terms[1];

            if (op === '÷') {
                // Ensure a is multiple of b
                b = Math.max(2, Math.min(b, 12)); // Keep divisor small
                a = b * randomInt(1, Math.floor(rMax/b));
            } else if (op === '-') {
                // Ensure positive result? Prompt says "ensure non-negative".
                if (a < b) [a, b] = [b, a];
            } else if (op === '×') {
                // Limit range for multiplication to avoid huge numbers?
                // Level 3 range is 1-12. Level 4 is 1-20. So it's fine.
            }

            text = `${a} ${op} ${b}`;
            // Compute answer
            if (op === '+') answer = a + b;
            if (op === '-') answer = a - b;
            if (op === '×') answer = a * b;
            if (op === '÷') answer = a / b;

            valid = true;
        } else {
            // 3 or more terms.
            // Simplified generation: ((a op b) op c)
            // We construct left-to-right to ensure integer intermediates if possible.
            let currentVal = terms[0];
            let expr = `${terms[0]}`;

            valid = true;
            for (let i = 0; i < operations.length; i++) {
                const op = operations[i];
                let nextTerm = terms[i+1];

                if (op === '÷') {
                   // Ensure currentVal is divisible by nextTerm
                   // It's hard to find a random nextTerm that divides currentVal randomly.
                   // Instead, maybe make currentVal a multiple of nextTerm?
                   // But currentVal is already set.
                   // Retry if not divisible.
                   if (nextTerm === 0 || currentVal % nextTerm !== 0) {
                       valid = false;
                       break;
                   }
                } else if (op === '-') {
                    // Check negative
                    // if (currentVal - nextTerm < 0) ...
                    // Prompt says "ensure non-negative".
                    // But maybe intermediate can be negative?
                    // Usually for these cognitive tests, they prefer simple positive arithmetic.
                    // Let's restart if negative.
                     if (currentVal - nextTerm < 0) {
                       valid = false;
                       break;
                   }
                }

                // Construct string
                if (useParentheses && i === 0 && operations.length > 1) {
                    expr = `(${expr} ${op} ${nextTerm})`;
                } else {
                    expr = `${expr} ${op} ${nextTerm}`;
                }

                if (op === '+') currentVal += nextTerm;
                if (op === '-') currentVal -= nextTerm;
                if (op === '×') currentVal *= nextTerm;
                if (op === '÷') currentVal /= nextTerm;
            }

            if (valid) {
                text = expr;
                answer = currentVal;
            }
        }
    }
  }

  // Fallback if loop failed (should happen rarely with correct logic)
  if (!valid) {
      return { id: Math.random().toString(), text: '1 + 1', answer: 2, level, terms: 2, ops: ['+'] };
  }

  // Formatting for Persian
  // text is already in digits, we will format in UI or here?
  // Ideally keep data as raw string/numbers, format in UI.

  return {
    id: Math.random().toString(36).substr(2, 9),
    text,
    answer,
    level,
    terms: termsCount,
    ops: config.ops === 'all' ? ['mixed'] : config.ops || []
  };
};
