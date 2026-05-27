'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, Check, Award, LayoutGrid, Info, ShieldCheck, Save, ArrowRight, Database, Star, AlertCircle, UserCircle, LogOut } from 'lucide-react';
import { GROUPS_DATA, BRACKET_MAPPING } from '../constants/teams';
import { supabase } from '../lib/supabase';

export default function HerdArenaFinalMaster() {
  const [hasMounted, setHasMounted] = useState(false);
  const [isEntryComplete, setIsEntryComplete] = useState(false);
  const [view, setView] = useState('bracket');
  const [isAdmin, setIsAdmin] = useState(false);
  const [bracketName, setBracketName] = useState('');
  const [standings, setStandings] = useState<any>({});
  const [bracketWinners, setBracketWinners] = useState<any>({});
  const [awards, setAwards] = useState({ ball: '', boot: '', gloves: '' });

  useEffect(() => {
    setHasMounted(true);
    const savedName = localStorage.getItem('herd_user_name');
    if (savedName) { setBracketName(savedName); setIsEntryComplete(true); }
  }, []);

  const getTeam = (id: string) => Object.values(GROUPS_DATA).flatMap((g: any) => g.teams).find((t: any) => t.id === id);

  const autoSelectedThirds = useMemo(() => {
    const thirds = Object.keys(GROUPS_DATA).map(gid => {
      const tId = standings[gid]?.[3];
      return tId ? { ...getTeam(tId), group: gid } : null;
    }).filter(Boolean);
    return (thirds as any[]).sort((a: any, b: any) => a.r - b.r).slice(0, 8);
  }, [standings]);

  const resolveTeam = (slot: string) => {
    if (slot.startsWith('W')) return bracketWinners['m' + slot.substring(1)];
    if (slot === 'L101' || slot === 'L102') {
        const mId = 'm' + slot.substring(1);
        const winner = bracketWinners[mId];
        const match = BRACKET_MAPPING.find(x => x.id === mId);
        if (!winner || !match) return { placeholder: `SF ${slot === 'L101' ? '1' : '2'} Loser` };
        const t1 = resolveTeam(match.t1); const t2 = resolveTeam(match.t2);
        return winner.id === t1?.id ? t2 : t1;
    }
    if (slot.startsWith('3RD')) {
        const idx = parseInt(slot.split('-')[1]) - 1;
        const t = autoSelectedThirds[idx];
        return t ? { ...t, label: '3rd Place' } : { placeholder: `3rd Slot ${idx + 1}` };
    }
    const gId = slot[0]; const rank = parseInt(slot.substring(1));
    const tId = standings[gId]?.[rank];
    return tId ? getTeam(tId) : { placeholder: `${rank === 1 ? 'Winner' : '2nd'} Group ${gId}` };
  };

  const handleJoin = () => {
    if (bracketName.trim().length < 2) return alert("Please enter your correct name.");
    localStorage.setItem('herd_user_name', bracketName);
    setIsEntryComplete(true);
  };

  const submitToDatabase = async () => {
    const table = isAdmin ? 'official_results' : 'submissions';
    const payload = {
      bracket_name: isAdmin ? 'OFFICIAL' : bracketName,
      bracket_data: { standings, bracketWinners, thirds: autoSelectedThirds },
      golden_ball: awards.ball, golden_boot: awards.boot, golden_gloves: awards.gloves
    };
    const { error } = await supabase.from(table).insert([payload]);
    if (error) alert(error.message);
    else alert("Success! Your prediction is locked.");
  };

  if (!hasMounted) return null;

  // --- RESTORED WELCOME SCREEN ---
  if (!isEntryComplete) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 font-sans overflow-hidden bg-blue-900">
        
        {/* THE BACKGROUND IMAGE FIX */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center animate-bg-zoom" 
            style={{ 
              backgroundImage: "url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2000')", 
              filter: 'brightness(0.4)' 
            }} 
          />
          <div className="absolute inset-0 bg-blue-600/20 mix-blend-overlay" />
        </div>

        {/* THE MAIN CARD */}
        <div className="relative z-10 bg-white/95 backdrop-blur-xl rounded-[40px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] max-w-4xl w-full flex flex-col md:flex-row overflow-hidden border border-white/20 scale-[0.9] md:scale-100">
          
          {/* LEFT PANEL: RULES */}
          <div className="bg-[#0f172a] p-10 text-white md:w-1/2 relative overflow-hidden">
             <Trophy size={180} className="absolute -bottom-10 -left-10 text-white/[0.03] -rotate-12" />
             <h2 className="text-3xl font-black italic tracking-tighter mb-8 border-b border-blue-500 pb-4 relative z-10 uppercase">Arena Rules</h2>
             <div className="space-y-6 relative z-10">
                <div className="flex gap-4 items-start">
                  <div className="bg-blue-600 p-2 rounded-xl shrink-0"><Info size={20}/></div>
                  <div><p className="font-bold text-md leading-tight">Group Stage</p><p className="text-slate-400 text-xs mt-0.5">+2 Pts per correct rank (1,2,3)</p></div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="bg-indigo-600 p-2 rounded-xl shrink-0"><Check size={20}/></div>
                  <div><p className="font-bold text-md leading-tight">Knockout Wins</p><p className="text-slate-400 text-xs mt-0.5">+5 Pts per correct match result</p></div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="bg-amber-500 p-2 rounded-xl shrink-0"><Award size={20}/></div>
                  <div><p className="font-bold text-md leading-tight">Grand Final</p><p className="text-slate-400 text-xs mt-0.5">+20 Pts for the correct Champion</p></div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="bg-emerald-500 p-2 rounded-xl shrink-0"><Star size={20}/></div>
                  <div><p className="font-bold text-md leading-tight">Player Honors</p><p className="text-slate-400 text-xs mt-0.5">+5 Pts per correct Golden award</p></div>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex gap-3 mt-4">
                   <AlertCircle className="text-red-500 shrink-0" size={18} />
                   <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-relaxed">Disqualification: Use real names. One submission only.</p>
                </div>
             </div>
          </div>

          {/* RIGHT PANEL: JOIN */}
          <div className="p-12 md:w-1/2 flex flex-col justify-center items-center text-center bg-white">
             <Trophy size={64} className="text-blue-600 mb-4 drop-shadow-xl" />
             <h1 className="text-4xl font-black mb-1 italic tracking-tighter text-slate-900 uppercase">Herd <span className="text-blue-600">Arena</span></h1>
             <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-12">Championship 2026</p>
             <div className="space-y-4 w-full max-w-xs">
                <input type="text" placeholder="Full Legal Name" className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 outline-none font-bold text-lg focus:bg-white focus:border-blue-600 transition-all shadow-inner" value={bracketName} onChange={(e) => setBracketName(e.target.value)} />
                <button onClick={handleJoin} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 text-xs tracking-widest uppercase">ENTER ARENA <ArrowRight size={18}/></button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // MAIN APPLICATION UI (Standings, Bracket, Leaderboard)
  return (
    <div className="min-h-screen bg-[#f9fafb] text-slate-900 font-sans pb-40">
      {/* ... (rest of your Nav, Bracket, and Standings code goes here exactly as before) ... */}
      {/* Re-pasting the essential Nav/Main part below to ensure it works */}
      <nav className="bg-white border-b border-slate-100 px-10 py-5 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-100"><Trophy size={18} /></div>
          <h1 className="text-xl font-black tracking-tight italic uppercase">Herd Arena</h1>
        </div>
        <div className="flex gap-4">
           <button onClick={() => setView('bracket')} className={`px-5 py-2 rounded-xl text-xs font-black transition ${view === 'bracket' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>BRACKET</button>
           <button onClick={() => setView('leaderboard')} className={`px-5 py-2 rounded-xl text-xs font-black transition ${view === 'leaderboard' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>STANDINGS</button>
           <button onClick={() => { localStorage.removeItem('herd_user_name'); window.location.reload(); }} className="p-2 text-slate-300 hover:text-red-500 transition"><LogOut size={18}/></button>
        </div>
      </nav>

      {/* RENDER DYNAMIC CONTENT BASED ON VIEW */}
      <main className="max-w-[1900px] mx-auto p-10 space-y-20">
         {/* Insert your existing Bracket and Standings code logic here */}
         <p className="text-center text-slate-400 font-black uppercase tracking-widest">Herd Arena Dashboard: {bracketName}</p>
      </main>
    </div>
  );
}