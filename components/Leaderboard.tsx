
import React from 'react';
import { UserProfile } from '../types';
import { Crown, Shield, TrendingUp } from 'lucide-react';

interface Props {
    user: UserProfile;
}

const Leaderboard: React.FC<Props> = ({ user }) => {
    const fakeUsers = [
        { name: 'سارا مدیر', xp: 3200, level: 8, avatar: 'bg-pink-400' },
        { name: 'علی رهنما', xp: 2950, level: 7, avatar: 'bg-blue-400' },
        { name: user.name, xp: user.currentXp + (user.levelNumber * 1000), level: user.levelNumber, avatar: 'bg-amber-400', isMe: true },
        { name: 'رضا تحلیلگر', xp: 2100, level: 5, avatar: 'bg-emerald-400' },
        { name: 'مریم کوشا', xp: 1800, level: 4, avatar: 'bg-purple-400' },
    ].sort((a, b) => b.xp - a.xp);

    return (
        <div className="h-full bg-slate-50 p-4 md:p-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-10 animate-scale-in">
                    <div className="w-20 h-20 bg-gradient-to-b from-yellow-300 to-yellow-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-xl shadow-yellow-200 animate-float">
                        <Crown size={40} className="text-white" fill="currentColor" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 animate-fade-in-up delay-100">تالار مشاهیر</h1>
                    <p className="text-slate-500 font-bold animate-fade-in-up delay-200">رقابت برای بهترین تحلیلگر ماه</p>
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden animate-fade-in-up delay-300">
                    {fakeUsers.map((u, idx) => (
                        <div 
                            key={idx} 
                            style={{ animationDelay: `${300 + (idx * 100)}ms` }}
                            className={`flex items-center gap-4 p-6 border-b last:border-b-0 transition-all hover:bg-slate-50 animate-slide-in-right ${u.isMe ? 'bg-violet-50 border-l-4 border-l-violet-500' : ''}`}
                        >
                            <div className="w-8 font-black text-xl text-slate-400 text-center">
                                {idx === 0 ? <span className="text-3xl animate-pop delay-500">🥇</span> : idx === 1 ? <span className="text-2xl">🥈</span> : idx === 2 ? <span className="text-2xl">🥉</span> : idx + 1}
                            </div>
                            
                            <div className={`w-12 h-12 rounded-full ${u.avatar} shadow-md flex items-center justify-center font-bold text-white transform transition-transform hover:scale-110`}>
                                {u.name.charAt(0)}
                            </div>
                            
                            <div className="flex-1">
                                <h3 className={`font-bold ${u.isMe ? 'text-violet-700' : 'text-slate-800'}`}>
                                    {u.name} {u.isMe && '(شما)'}
                                </h3>
                                <div className="text-xs font-medium text-slate-400">سطح {u.level} • شوالیه تحلیل</div>
                            </div>

                            <div className="text-right">
                                <div className="font-black text-lg text-slate-700">{u.xp.toLocaleString('fa-IR')} XP</div>
                                {idx < 3 && (
                                    <div className="flex justify-end items-center gap-1 text-xs font-bold text-emerald-500 animate-pulse">
                                        <TrendingUp size={12} /> پیشتاز
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
