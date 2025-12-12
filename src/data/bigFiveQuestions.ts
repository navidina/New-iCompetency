
export type Trait = 'Openness' | 'Conscientiousness' | 'Extraversion' | 'Agreeableness' | 'Neuroticism';

export interface BigFiveQuestion {
  id: number;
  text: string;
  trait: Trait;
  keyed: 'plus' | 'minus'; // plus: 1->1, 5->5; minus: 1->5, 5->1
}

export const BIG_FIVE_QUESTIONS: BigFiveQuestion[] = [
  // Extraversion
  { id: 1, trait: 'Extraversion', keyed: 'plus', text: 'در جمع‌ها پرانرژی و فعال هستم.' },
  { id: 2, trait: 'Extraversion', keyed: 'minus', text: 'فردی کم‌حرف هستم.' },
  { id: 3, trait: 'Extraversion', keyed: 'plus', text: 'در کنار دیگران احساس راحتی می‌کنم.' },
  { id: 4, trait: 'Extraversion', keyed: 'minus', text: 'ترجیح می‌دهم در حاشیه باشم.' },
  { id: 5, trait: 'Extraversion', keyed: 'plus', text: 'معمولاً من شروع‌کننده گفتگو هستم.' },
  { id: 6, trait: 'Extraversion', keyed: 'minus', text: 'حرف خاصی برای گفتن ندارم.' },
  { id: 7, trait: 'Extraversion', keyed: 'plus', text: 'در مهمانی‌ها با افراد مختلف صحبت می‌کنم.' },
  { id: 8, trait: 'Extraversion', keyed: 'minus', text: 'دوست ندارم مرکز توجه باشم.' },
  { id: 9, trait: 'Extraversion', keyed: 'plus', text: 'از اینکه مرکز توجه باشم بدم نمی‌آید.' },
  { id: 10, trait: 'Extraversion', keyed: 'minus', text: 'در کنار افراد ناآشنا ساکت هستم.' },

  // Agreeableness
  { id: 11, trait: 'Agreeableness', keyed: 'minus', text: 'خیلی درگیر مسائل دیگران نمی‌شوم.' },
  { id: 12, trait: 'Agreeableness', keyed: 'plus', text: 'به انسان‌ها و سرنوشتشان علاقه‌مندم.' },
  { id: 13, trait: 'Agreeableness', keyed: 'minus', text: 'گاهی با دیگران تند برخورد می‌کنم.' },
  { id: 14, trait: 'Agreeableness', keyed: 'plus', text: 'با احساسات دیگران همدردی می‌کنم.' },
  { id: 15, trait: 'Agreeableness', keyed: 'minus', text: 'مشکلات دیگران برایم جذاب نیست.' },
  { id: 16, trait: 'Agreeableness', keyed: 'plus', text: 'قلب مهربانی دارم.' },
  { id: 17, trait: 'Agreeableness', keyed: 'minus', text: 'علاقه چندانی به دیگران ندارم.' },
  { id: 18, trait: 'Agreeableness', keyed: 'plus', text: 'برای کمک به دیگران وقت می‌گذارم.' },
  { id: 19, trait: 'Agreeableness', keyed: 'plus', text: 'احساسات دیگران را به خوبی درک می‌کنم.' },
  { id: 20, trait: 'Agreeableness', keyed: 'plus', text: 'به دیگران احساس راحتی می‌دهم.' },

  // Conscientiousness
  { id: 21, trait: 'Conscientiousness', keyed: 'plus', text: 'همیشه آماده و مجهز هستم.' },
  { id: 22, trait: 'Conscientiousness', keyed: 'minus', text: 'وسایلم را هر جایی رها می‌کنم.' },
  { id: 23, trait: 'Conscientiousness', keyed: 'plus', text: 'به جزئیات دقیق توجه می‌کنم.' },
  { id: 24, trait: 'Conscientiousness', keyed: 'minus', text: 'گاهی کارها را نامرتب انجام می‌دهم.' },
  { id: 25, trait: 'Conscientiousness', keyed: 'plus', text: 'کارها را بلافاصله انجام می‌دهم.' },
  { id: 26, trait: 'Conscientiousness', keyed: 'minus', text: 'اغلب فراموش می‌کنم وسایل را سر جایشان بگذارم.' },
  { id: 27, trait: 'Conscientiousness', keyed: 'plus', text: 'نظم و ترتیب را دوست دارم.' },
  { id: 28, trait: 'Conscientiousness', keyed: 'minus', text: 'گاهی از زیر کار در می‌روم.' },
  { id: 29, trait: 'Conscientiousness', keyed: 'plus', text: 'طبق برنامه عمل می‌کنم.' },
  { id: 30, trait: 'Conscientiousness', keyed: 'plus', text: 'در کارم بسیار دقیق هستم.' },

  // Neuroticism
  { id: 31, trait: 'Neuroticism', keyed: 'plus', text: 'زود دچار استرس می‌شوم.' },
  { id: 32, trait: 'Neuroticism', keyed: 'minus', text: 'اکثر اوقات آرام و خونسرد هستم.' },
  { id: 33, trait: 'Neuroticism', keyed: 'plus', text: 'زیاد نگران مسائل می‌شوم.' },
  { id: 34, trait: 'Neuroticism', keyed: 'minus', text: 'به ندرت احساس غمگینی می‌کنم.' },
  { id: 35, trait: 'Neuroticism', keyed: 'plus', text: 'زود ناراحت یا آشفته می‌شوم.' },
  { id: 36, trait: 'Neuroticism', keyed: 'plus', text: 'زودرنج هستم.' },
  { id: 37, trait: 'Neuroticism', keyed: 'plus', text: 'خلق و خویم مدام تغییر می‌کند.' },
  { id: 38, trait: 'Neuroticism', keyed: 'plus', text: 'نوسانات خلقی زیادی دارم.' },
  { id: 39, trait: 'Neuroticism', keyed: 'plus', text: 'زود از کوره در می‌روم.' },
  { id: 40, trait: 'Neuroticism', keyed: 'plus', text: 'اغلب احساس غم و اندوه دارم.' },

  // Openness
  { id: 41, trait: 'Openness', keyed: 'plus', text: 'دایره لغات گسترده‌ای دارم.' },
  { id: 42, trait: 'Openness', keyed: 'minus', text: 'فهم ایده‌های پیچیده برایم دشوار است.' },
  { id: 43, trait: 'Openness', keyed: 'plus', text: 'قوه تخیل قوی دارم.' },
  { id: 44, trait: 'Openness', keyed: 'minus', text: 'به بحث‌های نظری علاقه‌ای ندارم.' },
  { id: 45, trait: 'Openness', keyed: 'plus', text: 'ایده‌های خلاقانه زیادی دارم.' },
  { id: 46, trait: 'Openness', keyed: 'minus', text: 'تخیل چندان قوی‌ای ندارم.' },
  { id: 47, trait: 'Openness', keyed: 'plus', text: 'مسائل را سریع درک می‌کنم.' },
  { id: 48, trait: 'Openness', keyed: 'plus', text: 'از کلمات پیچیده استفاده می‌کنم.' },
  { id: 49, trait: 'Openness', keyed: 'plus', text: 'وقتم را صرف تفکر عمیق می‌کنم.' },
  { id: 50, trait: 'Openness', keyed: 'plus', text: 'ذهنم پر از ایده است.' },
];
