'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, Check, Award, LayoutGrid, Info, ShieldCheck, Save, ArrowRight, Database } from 'lucide-react';
import { GROUPS_DATA, BRACKET_MAPPING } from '../constants/teams';
import { supabase } from '../lib/supabase';

export default function HerdArenaMaster() {
  const [hasMounted, setHasMounted] = useState(false);
  const [isEntryComplete, setIsEntryComplete] = useState(false);
  const [view, setView] = useState('bracket'); // 'bracket' or 'leaderboard'
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [bracketName, setBracketName] = useState('');
  const [standings, setStandings] = useState<any>({});
  const [bracketWinners, setBracketWinners] = useState<any>({});

  // 1. INITIALIZATION & HYDRATION FIX
  useEffect(() => {
    setHasMounted(true);
    const savedName = localStorage.getItem('herd_user_name');
    if (savedName) { 
      setBracketName(savedName); 
      setIsEntryComplete(true); 
    }
  }, []);

  const getTeam = (id: string) => Object.values(GROUPS_DATA).flatMap((g: any) => g.teams).find((t: any) => t.id === id);

  // 2. AUTO-SELECT 8 BEST 3rds BY FIFA RANK
  const autoSelectedThirds = useMemo(() => {
    const thirds = Object.keys(GROUPS_DATA).map(gid => {
      const tId = standings[gid]?.[3];
      return tId ? { ...getTeam(tId), group: gid } : null;
    }).filter(Boolean);
    return (thirds as any[]).sort((a: any, b: any) => a.r - b.r).slice(0, 8);
  }, [standings]);

  // 3. BRACKET RESOLUTION LOGIC
  const resolveTeam = (slot: string) => {
    if (slot.startsWith('W')) return bracketWinners['m' + slot.substring(1)];
    if (slot === 'L101' || slot === 'L102') {
        const mId = 'm' + slot.substring(1);
        const winner = bracketWinners[mId];
        const match = BRACKET_MAPPING.find(x => x.id === mId);
        if (!winner || !match) return { placeholder: `Semi-Final ${slot === 'L101' ? '1' : '2'} Loser` };
        const t1 = resolveTeam(match.t1); const t2 = resolveTeam(match.t2);
        return winner.id === t1?.id ? t2 : t1;
    }
    if (slot.startsWith('3RD')) {
        const idx = parseInt(slot.split('-')[1]) - 1;
        const t = autoSelectedThirds[idx];
        return t ? { ...t, label: '3rd Place' } : { placeholder: `3rd Place Slot ${idx + 1}` };
    }
    const gId = slot[0]; const rank = parseInt(slot.substring(1));
    const tId = standings[gId]?.[rank];
    return tId ? getTeam(tId) : { placeholder: `${rank === 1 ? 'Winner' : '2nd'} Group ${gId}` };
  };

  // 4. ACTIONS
  const handleJoin = () => {
    if (bracketName.trim().length < 2) return alert("Please enter your name.");
    localStorage.setItem('herd_user_name', bracketName);
    setIsEntryComplete(true);
  };

  const submitToDatabase = async () => {
    const table = isAdmin ? 'official_results' : 'submissions';
    const payload = {
      bracket_name: isAdmin ? 'OFFICIAL_RESULTS' : bracketName,
      bracket_data: { standings, bracketWinners, thirds: autoSelectedThirds }
    };

    const { error } = await supabase.from(table).insert([payload]);
    if (error) alert("Error: " + error.message);
    else alert(`Saved to ${table}! Data is now in Supabase.`);
  };

  if (!hasMounted) return null;

  // ENTRY SCREEN
  if (!isEntryComplete) {
    return (
      <div className="min-h-screen bg-blue-600 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full text-center">
          <Trophy size={48} className="text-blue-600 mx-auto mb-6" />
          <h1 className="text-2xl font-black uppercase italic text-slate-800 tracking-tighter">Herd Arena 2026</h1>
          <div className="mt-8 space-y-4 text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Full Name</label>
            <input type="text" placeholder="Your Name" className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none font-bold text-lg" value={bracketName} onChange={(e) => setBracketName(e.target.value)} />
            <button onClick={handleJoin} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs">START <ArrowRight size={16}/></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] text-slate-900 font-sans pb-40">
      {/* HEADER */}
      <nav className="bg-white border-b border-slate-100 px-10 py-5 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-100"><Trophy size={18} /></div>
          <h1 className="text-xl font-black tracking-tight italic uppercase">Herd Arena</h1>
        </div>
        <div className="flex gap-4">
           <button onClick={() => setView('bracket')} className={`px-5 py-2 rounded-xl text-xs font-black transition ${view === 'bracket' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>BRACKET</button>
           <button onClick={() => setView('leaderboard')} className={`px-5 py-2 rounded-xl text-xs font-black transition ${view === 'leaderboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>STANDINGS</button>
           <button onClick={() => {const p = prompt("Admin?"); if(p==="herd2026") setIsAdmin(!isAdmin)}} className="text-slate-100"><ShieldCheck size={18}/></button>
        </div>
      </nav>

      <main className="max-w-[1900px] mx-auto p-10 space-y-20">
        {view === 'bracket' ? (
          <>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[50px] p-12 text-white shadow-2xl flex justify-between items-center">
               <div>
                  <h2 className="text-5xl font-black italic tracking-tighter mb-2 underline decoration-blue-300 decoration-4 underline-offset-8 uppercase">Good Luck, {bracketName}!</h2>
                  <p className="text-blue-100 font-medium italic">Auto-selecting top 8 thirds based on FIFA Rank.</p>
               </div>
               <div className="bg-white/20 px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest border border-white/30">{isAdmin ? 'Admin Mode' : 'Predicting'}</div>
            </div>

            {/* 1. GROUPS */}
            <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Object.entries(GROUPS_DATA).map(([id, g]: any) => (
                  <div key={id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest italic font-mono">Group {id}</h3>
                    <div className="space-y-4">
                      {g.teams.map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between">
                          <div className="flex flex-col">
                             <div className="flex items-center gap-3">
                                <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-5 h-3.5 object-cover rounded shadow-sm" alt=""/> 
                                <span className="text-sm font-bold">{t.n}</span>
                             </div>
                             <span className="text-[8px] font-bold text-slate-300 mt-1 uppercase tracking-widest">{t.ch}% chance to advance</span>
                          </div>
                          <div className="flex gap-1">
                            {[1, 2, 3].map(r => (
                              <button key={r} onClick={() => setStandings((p: any) => ({ ...p, [id]: { ...p[id], [r]: t.id } }))} className={`w-7 h-7 text-[10px] font-black rounded-lg transition ${standings[id]?.[r] === t.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{r}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </section>

            {/* 2. BEST 3RDS PANEL */}
            <section className="bg-amber-50 border-2 border-amber-200 p-10 rounded-[40px] shadow-sm">
                <h2 className="text-2xl font-black text-amber-900 uppercase italic mb-6">8 Best 3rd-Place Teams</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                   {autoSelectedThirds.map((t: any) => (
                      <div key={t.id} className="bg-white border-2 border-amber-200 p-5 rounded-3xl">
                         <p className="text-[8px] font-black text-amber-600 uppercase mb-2">3rd Group {t.group}</p>
                         <div className="flex items-center gap-3"><img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-5" alt=""/><span className="text-xs font-black uppercase">{t.n}</span></div>
                      </div>
                   ))}
                </div>
            </section>

            {/* 3. BRACKET */}
            <section className="flex gap-10 overflow-x-auto pb-20 no-scrollbar items-start">
               <BracketCol label="R32" slice={[0, 16]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} />
               <BracketCol label="R16" slice={[16, 24]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-24 pt-16" />
               <BracketCol label="Quarters" slice={[24, 28]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-[310px] pt-44" />
               <BracketCol label="Semis" slice={[28, 30]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-[640px] pt-[280px]" />
               
               <div className="flex-shrink-0 pt-[450px] space-y-40">
                  <div className="w-64 p-8 bg-amber-50 border-2 border-amber-100 rounded-[3rem] shadow-sm text-center">
                     <h3 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-4 italic">3rd Place Play-Off</h3>
                     <MatchBox m={BRACKET_MAPPING[30]} t1={resolveTeam('L101')} t2={resolveTeam('L102')} winner={bracketWinners['m103']} onPick={(w: any) => setBracketWinners((p: any) => ({ ...p, ['m103']: w }))} />
                  </div>
                  <div className="w-80 p-12 bg-white border-[8px] border-blue-600 rounded-[5rem] text-center shadow-2xl scale-110">
                     <Award size={64} className="text-blue-600 mx-auto mb-8 animate-bounce" />
                     <MatchBox m={BRACKET_MAPPING[31]} t1={resolveTeam('W101')} t2={resolveTeam('W102')} winner={bracketWinners['m104']} onPick={(w: any) => setBracketWinners((p: any) => ({ ...p, ['m104']: w }))} />
                     <div className="mt-10 border-t pt-8">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Champion</p>
                        <div className="text-3xl font-black text-blue-600 uppercase truncate">{bracketWinners['m104']?.n || 'TBD'}</div>
                     </div>
                  </div>
               </div>
            </section>
          </>
        ) : (
          /* --- DYNAMIC LEADERBOARD VIEW --- */
          <div className="max-w-3xl mx-auto space-y-8">
             <div className="text-center">
                <Trophy size={64} className="mx-auto text-blue-600 mb-4 drop-shadow-lg" />
                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-800">Standings</h2>
             </div>
             <div className="bg-white p-4 rounded-[3rem] shadow-2xl border border-slate-50 overflow-hidden">
                <LeaderboardList />
             </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60]">
         <button onClick={submitToDatabase} className="bg-slate-950 text-white px-24 py-6 rounded-[2.5rem] font-black shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 tracking-[0.2em] uppercase text-xs">
            <Save size={20}/> {isAdmin ? 'Update Official Results' : 'Lock Prediction'}
         </button>
      </div>
    </div>
  );
}

// 5. HELPER COMPONENTS
function LeaderboardList() {
  const [list, setList] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const getData = async () => {
      const { data } = await supabase.from('submissions').select('bracket_name, points').order('points', { ascending: false });
      if (data) setList(data);
      setLoading(false);
    };
    getData();
  }, []);

  if (loading) return <div className="p-20 text-center font-black text-slate-200 animate-pulse">LOADING...</div>;
  
  return (
    <div className="divide-y divide-slate-50">
      {list.map((u, i) => (
        <div key={i} className="flex justify-between items-center p-6 hover:bg-blue-50/30 transition-colors">
          <div className="flex items-center gap-6">
             <span className="text-2xl font-black italic font-mono text-slate-200">0{i+1}</span>
             <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg bg-slate-100 text-slate-500">{u.bracket_name[0].toUpperCase()}</div>
             <span className="font-bold text-slate-700 text-lg">{u.bracket_name}</span>
          </div>
          <div className="text-right">
             <span className="block font-black text-2xl text-blue-600">{u.points}</span>
             <span className="block text-[9px] font-black text-slate-300 uppercase tracking-widest">Points</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function BracketCol({ label, slice, resolve, winners, setWinners, spacing = "space-y-4" }: any) {
  return (
    <div className={`w-64 flex-shrink-0 ${spacing}`}>
      <h4 className="text-[10px] font-black text-slate-400 uppercase text-center mb-8 tracking-widest italic">{label}</h4>
      {BRACKET_MAPPING.slice(slice[0], slice[1]).map(m => (
        <MatchBox key={m.id} m={m} t1={resolve(m.t1)} t2={resolve(m.t2)} winner={winners[m.id]} onPick={(w: any) => setWinners((p: any) => ({ ...p, [m.id]: w }))} />
      ))}
    </div>
  );
}

function MatchBox({ t1, t2, winner, onPick }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-[1.8rem] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      {[t1, t2].map((t, i) => (
        <button key={i} disabled={t?.placeholder} onClick={() => onPick(t)} className={`w-full text-left p-4 flex justify-between items-center border-b last:border-0 border-slate-50 transition-all ${winner?.id === t?.id ? 'bg-blue-600 text-white font-black' : 'hover:bg-blue-50'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            {t?.c ? <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-5 h-3.5 object-cover rounded shadow-sm border border-slate-100" alt="" /> : <div className="w-5 h-3.5 bg-slate-50 rounded-sm" />}
            <span className={`text-[10px] font-black uppercase tracking-tight truncate ${t?.placeholder ? 'text-slate-300 italic font-medium' : 'text-slate-800'}`}>{t?.n || t?.placeholder}</span>
          </div>
          {winner?.id === t?.id && <Check size={16} strokeWidth={5} />}
        </button>
      ))}
    </div>
  );
}