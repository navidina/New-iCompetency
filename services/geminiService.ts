
import { GoogleGenAI, Type } from "@google/genai";
import type { Schema } from "@google/genai";
import { Scenario, EvaluationResult, UserResponse, UserProfile, FiveWhysData, SwotData, CynefinData } from "../types";

// Lazy initialization singleton
let aiInstance: GoogleGenAI | null = null;
const model = "gemini-2.5-flash";

const getAI = (): GoogleGenAI => {
    if (aiInstance) return aiInstance;

    let apiKey: string | undefined;
    try {
        // Safe access to process.env
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env) {
            // @ts-ignore
            apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        }
    } catch (e) {
        console.warn("Environment variable access failed:", e);
    }

    if (!apiKey) {
        throw new Error("Gemini API Key is missing. Please check your environment variables.");
    }

    aiInstance = new GoogleGenAI({ apiKey });
    return aiInstance;
};

/**
 * Generates a new Problem Solving Scenario based on configuration
 */
export const generateScenario = async (
  difficulty: string,
  industry: string,
  focusArea: string,
  methodology: 'Polya' | 'SixSigma' = 'Polya'
): Promise<Scenario> => {
  
  let methodologyPrompt = "";

  if (methodology === 'SixSigma') {
    methodologyPrompt = `
      Methodology: Six Sigma (DMAIC).
      The scenario must have 5 distinct phases:
      1. Define (تعریف): Define the problem and project goals.
      2. Measure (اندازه‌گیری): Quantify the problem and current performance.
      3. Analyze (تحلیل): Identify root causes.
      4. Improve (بهبود): Implement and verify the solution.
      5. Control (کنترل): Maintain the solution.
    `;
  } else {
    methodologyPrompt = `
      Methodology: Polya (Understand, Plan, Execute, Review).
      The scenario must have 4 distinct phases corresponding to Polya's method.
    `;
  }

  const prompt = `
    You are an expert Persian Problem Solving Scenario Generator.
    Create a detailed, gamified business scenario for an employee in the "${industry}" industry.
    Difficulty Level: ${difficulty}.
    Focus Skill: ${focusArea}.
    ${methodologyPrompt}
    
    IMPORTANT: All titles, descriptions, and questions MUST be in PERSIAN (Farsi).
    Keep the JSON keys in English, but the values must be Persian.

    Return the response in strict JSON format fitting the following schema:
    {
      "id": "string (uuid)",
      "title": "عنوان سناریو (فارسی)",
      "difficulty": "${difficulty}",
      "industry": "${industry}",
      "description": "توضیحات کامل سناریو به فارسی...",
      "timeLimitMinutes": number,
      "methodology": "${methodology}",
      "phases": [
        {
          "id": "phase_1",
          "title": "عنوان مرحله (مثلا تعریف یا درک مسئله)",
          "description": "توضیحات این مرحله...",
          "question": "سوال اصلی که کاربر باید پاسخ دهد",
          "type": "text"
        }
        ... (create phases based on methodology)
      ]
    }
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      title: { type: Type.STRING },
      difficulty: { type: Type.STRING },
      industry: { type: Type.STRING },
      description: { type: Type.STRING },
      timeLimitMinutes: { type: Type.INTEGER },
      methodology: { type: Type.STRING },
      phases: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            question: { type: Type.STRING },
            type: { type: Type.STRING },
          },
          required: ["id", "title", "description", "question", "type"]
        }
      }
    },
    required: ["id", "title", "phases", "difficulty", "description", "timeLimitMinutes"]
  };

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from Gemini");
    
    return JSON.parse(text) as Scenario;
  } catch (error) {
    console.error("Error generating scenario:", error);
    
    // Fallback logic based on methodology
    const phases = methodology === 'SixSigma' ? [
        { id: "d1", title: "تعریف (Define)", description: "مشکل را شفاف کنید", question: "مشکل اصلی چیست و چه تاثیری بر مشتری دارد؟", type: "text" },
        { id: "d2", title: "اندازه‌گیری (Measure)", description: "جمع‌آوری داده", question: "چه متریک‌هایی وضعیت فعلی را نشان می‌دهند؟", type: "text" },
        { id: "d3", title: "تحلیل (Analyze)", description: "یافتن ریشه", question: "علت اصلی انحراف از استاندارد چیست؟", type: "text" },
        { id: "d4", title: "بهبود (Improve)", description: "ارائه راهکار", question: "چه راه حلی برای حذف علت ریشه‌ای پیشنهاد می‌دهید؟", type: "text" },
        { id: "d5", title: "کنترل (Control)", description: "پایداری", question: "چگونه مطمئن می‌شوید مشکل باز نمی‌گردد؟", type: "text" }
    ] : [
        { id: "p1", title: "درک مسئله", description: "شناسایی مشکل اصلی", question: "دقیقا چه اتفاقی افتاده و چه کسانی تحت تاثیر هستند؟", type: "text" },
        { id: "p2", title: "برنامه‌ریزی", description: "تدوین استراتژی", question: "چه گزینه‌هایی برای بازگردانی سرویس دارید؟", type: "text" },
        { id: "p3", title: "اجرا", description: "پیاده‌سازی راه‌حل", question: "دستورات اجرایی شما به تیم چیست؟", type: "text" },
        { id: "p4", title: "بازنگری", description: "تحلیل پس از حادثه", question: "چگونه از تکرار این مشکل جلوگیری می‌کنید؟", type: "text" }
    ];

    return {
      id: "fallback_1",
      title: methodology === 'SixSigma' ? "بهینه‌سازی خط تولید" : "مدیریت بحران سرورهای شرکت",
      difficulty: "Medium",
      industry: "General",
      description: "سیستم تولید هوشمند دچار مشکل شده است (حالت آفلاین).",
      timeLimitMinutes: 15,
      methodology: methodology,
      phases: phases as any
    };
  }
};

/**
 * Evaluates the user's responses against the scenario
 */
export const evaluateSession = async (
  scenario: Scenario,
  responses: UserResponse[]
): Promise<EvaluationResult> => {
  
  const userInputs = responses.map(r => `Phase: ${r.phaseId} | Answer: "${r.answer}" | TimeSpent: ${r.timeSpentSeconds}s`).join("\n");

  const prompt = `
    Role: Fair and Constructive Expert Problem Solving Coach (Persian Language).
    Methodology: ${scenario.methodology} (${scenario.methodology === 'SixSigma' ? 'DMAIC Model' : 'Polya Model'}).
    
    Scenario Context:
    Title: ${scenario.title}
    Description: ${scenario.description}

    User Responses:
    ${userInputs}

    EVALUATION GUIDELINES:
    1. **Fairness**: Give credit for relevant keywords and logical steps. Do not expect expert-level jargon unless the answer is clearly excellent.
    2. **Constructive Feedback**: Always provide actionable advice. If the user failed, explain *how* they can improve simply.
    3. **Context**: The user is likely under time pressure. Brief but accurate answers are acceptable.
    
    Scoring Rubric:
    - 0-20: Irrelevant or nonsense.
    - 21-50: Basic understanding, missing details.
    - 51-80: Good understanding, solid plan.
    - 81-100: Excellent, comprehensive, innovative.

    Return ONLY valid JSON.

    JSON Format:
    {
      "score": number (0-100),
      "level": "string (Novice, Basic, Intermediate, Advanced, Expert)",
      "breakdown": {
        "understanding": number,
        "planning": number,
        "execution": number,
        "review": number,
        "creativity": number
      },
      "feedback": {
        "strengths": ["نقطه قوت ۱ (فارسی)", "نقطه قوت ۲ (فارسی)"],
        "weaknesses": ["نقطه ضعف ۱ (فارسی)", "نقطه ضعف ۲ (فارسی)"],
        "recommendations": ["پیشنهاد ۱ (فارسی)", "پیشنهاد ۲ (فارسی)"]
      },
      "timeAnalysis": {
        "totalTime": number,
        "efficiencyScore": number
      }
    }
  `;

  try {
    const ai = getAI();
    // We remove strict schema validation here to prevent hanging on validation errors
    // and rely on the model's ability to generate JSON.
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3, // Slightly higher temp for more nuanced feedback
      }
    });

    const text = response.text;
    if (!text) throw new Error("No evaluation returned");
    
    return JSON.parse(text) as EvaluationResult;

  } catch (error) {
    console.error("Error evaluating:", error);
    
    // --- IMPROVED FALLBACK LOGIC ---
    // Previous logic gave 8/100 for 28 char answers. This is too harsh.
    
    const totalChars = responses.reduce((acc, r) => acc + r.answer.trim().length, 0);
    const avgCharsPerPhase = totalChars / Math.max(responses.length, 1);
    const totalTime = responses.reduce((acc, r) => acc + r.timeSpentSeconds, 0);
    
    // Base score for completing all phases
    let baseScore = 45; 
    
    // Bonus for length (rough proxy for effort in fallback mode)
    // 50 chars avg = +10 points, 100 chars = +20 points
    const lengthBonus = Math.min(30, avgCharsPerPhase / 3); 
    
    // Penalty for extremely short answers (< 5 chars)
    const penalty = avgCharsPerPhase < 5 ? 20 : 0;

    let calculatedScore = Math.min(100, Math.max(10, baseScore + lengthBonus - penalty));
    
    let fallbackLevel = "Novice";
    if (calculatedScore > 40) fallbackLevel = "Basic";
    if (calculatedScore > 60) fallbackLevel = "Intermediate";
    if (calculatedScore > 80) fallbackLevel = "Advanced";

    return {
      score: Math.floor(calculatedScore),
      level: fallbackLevel,
      breakdown: {
        understanding: Math.floor(calculatedScore * 0.9),
        planning: Math.floor(calculatedScore * 0.8),
        execution: Math.floor(calculatedScore * 0.85),
        review: Math.floor(calculatedScore * 0.7),
        creativity: Math.floor(calculatedScore * 0.6) // Creativity is harder to judge offline
      },
      feedback: {
        strengths: [
            "تلاش برای تکمیل تمام مراحل فرآیند حل مسئله",
            "پایبندی به ساختار کلی متدولوژی"
        ],
        weaknesses: [
            "در حالت آفلاین امکان تحلیل دقیق محتوایی وجود ندارد",
            "جزئیات ارائه شده می‌توانست دقیق‌تر باشد"
        ],
        recommendations: [
            "برای دریافت بازخورد دقیق‌تر، اتصال اینترنت خود را بررسی کنید",
            "در پاسخ‌های بعدی از مثال‌های عینی استفاده کنید"
        ]
      },
      timeAnalysis: {
        totalTime: totalTime,
        efficiencyScore: Math.min(100, Math.max(40, 100 - (totalTime / 30))) // Rough efficiency calc
      }
    };
  }
};

export const getCoachingTip = async (profile: UserProfile): Promise<string> => {
    const prompt = `
      Based on these skills: Analysis ${profile.skills.analysis}, Creativity ${profile.skills.creativity}, Speed ${profile.skills.speed}.
      Give a one-sentence motivational coaching tip for a corporate professional in PERSIAN (Farsi).
      Example: "امروز روی خلاقیت خود تمرکز کن!"
    `;
    try {
        const ai = getAI();
        const result = await ai.models.generateContent({ model, contents: prompt });
        return result.text || "به تلاش ادامه دهید!";
    } catch (e) {
        return "هر روز فرصتی برای یادگیری است.";
    }
}

// --- Mini Game Generators ---

export const generateFiveWhysData = async (): Promise<FiveWhysData> => {
  const prompt = `
    Generate a "5 Whys" problem solving game in PERSIAN (Farsi).
    Start with a surface level business or technical problem.
    Create 5 levels of "Why" questions.
    For each level, provide 3 options where only 1 is the correct causal link to the next level.
    The 5th level should be the root cause.
    
    All text (problemStatement, questions, options, explanation) MUST be in Persian.
    
    Return JSON:
    {
      "problemStatement": "string (Farsi)",
      "levels": [
        { "level": 1, "question": "چرا [رویداد قبلی] رخ داد؟", "options": ["علت درست", "علت غلط ۱", "علت غلط ۲"], "correctIndex": 0, "explanation": "توضیح به فارسی" }
        ... (5 levels)
      ]
    }
  `;
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      problemStatement: { type: Type.STRING },
      levels: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            level: { type: Type.INTEGER },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["level", "question", "options", "correctIndex", "explanation"]
        }
      }
    },
    required: ["problemStatement", "levels"]
  };

  try {
    const ai = getAI();
    const result = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: schema }
    });
    return JSON.parse(result.text!) as FiveWhysData;
  } catch (e) {
    console.error(e);
    // Fallback data in Persian
    return {
      problemStatement: "سایت شرکت در حین فروش ویژه جمعه سیاه از دسترس خارج شد.",
      levels: [
        { level: 1, question: "چرا سایت از دسترس خارج شد؟", options: ["بار زیاد سرور", "حمله هکرها", "قطعی برق دیتاسنتر"], correctIndex: 0, explanation: "ترافیک بالا از ظرفیت فراتر رفت." },
        { level: 2, question: "چرا بار سرور بیش از حد بود؟", options: ["عدم مقیاس‌پذیری خودکار", "تعداد زیاد محصولات", "اینترنت کند"], correctIndex: 0, explanation: "سیستم سرورهای جدید اضافه نکرد." },
        { level: 3, question: "چرا مقیاس‌پذیری خودکار کار نکرد؟", options: ["آستانه غلط تنظیم شده بود", "ارائه‌دهنده ابری قطع بود", "محدودیت بودجه"], correctIndex: 0, explanation: "تریگر روی عدد خیلی بالایی تنظیم شده بود." },
        { level: 4, question: "چرا آستانه غلط تنظیم شده بود؟", options: ["تست بار انجام نشده بود", "خطای کپی پیست", "مستندات قدیمی"], correctIndex: 0, explanation: "تیم برای بارهای اوج تست نکرده بود." },
        { level: 5, question: "چرا تست بار انجام نشده بود؟", options: ["مدیریت پروژه ویژگی‌ها را اولویت داد", "فراموش کردند", "ابزار نداشتند"], correctIndex: 0, explanation: "فشار برای تحویل سریع باعث حذف تست شد." }
      ]
    };
  }
};

export const generateSwotData = async (): Promise<SwotData> => {
  const prompt = `
    Generate a SWOT analysis game data in PERSIAN (Farsi).
    1. Create a fictional company context (e.g. A traditional bookstore moving online).
    2. List 10 internal or external factors mixed up.
    3. Assign each to Strength (S), Weakness (W), Opportunity (O), or Threat (T).
    
    All text (companyContext, items text, reason) MUST be in Persian.
    
    Return JSON.
  `;
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      companyContext: { type: Type.STRING },
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            category: { type: Type.STRING, enum: ["S", "W", "O", "T"] },
            reason: { type: Type.STRING }
          },
          required: ["text", "category", "reason"]
        }
      }
    },
    required: ["companyContext", "items"]
  };

  try {
    const ai = getAI();
    const result = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: schema }
    });
    return JSON.parse(result.text!) as SwotData;
  } catch (e) {
    console.error(e);
    return {
      companyContext: "اکوراید - استارتاپ تولید اسکوتر برقی",
      items: [
        { text: "تکنولوژی باتری با دوام ثبت شده", category: "S", reason: "ویژگی مثبت داخلی" },
        { text: "هزینه بالای تولید", category: "W", reason: "ویژگی منفی داخلی" },
        { text: "افزایش قیمت بنزین", category: "O", reason: "روند مثبت خارجی" },
        { text: "قوانین سختگیرانه جدید شهری", category: "T", reason: "روند منفی خارجی" }
      ]
    };
  }
};

export const generateCynefinData = async (): Promise<CynefinData> => {
  const prompt = `
    Generate 5 distinct problem scenarios for a Cynefin framework game in PERSIAN (Farsi).
    Each scenario must clearly fit into one of: Simple, Complicated, Complex, or Chaotic.
    Provide the domain and the reasoning in Persian.
    
    Return JSON.
  `;
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      scenarios: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            domain: { type: Type.STRING, enum: ["Simple", "Complicated", "Complex", "Chaotic"] },
            reason: { type: Type.STRING }
          },
          required: ["description", "domain", "reason"]
        }
      }
    },
    required: ["scenarios"]
  };

  try {
    const ai = getAI();
    const result = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: schema }
    });
    return JSON.parse(result.text!) as CynefinData;
  } catch (e) {
     console.error(e);
     return {
       scenarios: [
         { description: "پردازش درخواست مرجوعی استاندارد", domain: "Simple", reason: "بهترین روش (Best Practice) وجود دارد." },
         { description: "ساخت موتور موشک", domain: "Complicated", reason: "نیاز به تحلیل کارشناسی دارد." }
       ]
     };
  }
}
