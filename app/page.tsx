'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, Check, Award, LayoutGrid, Info, ShieldCheck, Save, ArrowRight, Database, Star, AlertCircle } from 'lucide-react';
import { GROUPS_DATA, BRACKET_MAPPING } from '../constants/teams';
import { supabase } from '../lib/supabase';

export default function HerdArenaFinalMaster() {
  const [hasMounted, setHasMounted] = useState(false);
  const [isEntryComplete, setIsEntryComplete] = useState(false);
  const [view, setView] = useState('bracket');
  const [isAdmin, setIsAdmin] = useState(false);
  const [bracketName, setBracketName] = useState('');
  
  // CORE DATA STATE
  const [standings, setStandings] = useState<any>({});
  const [bracketWinners, setBracketWinners] = useState<any>({});
  const [selectedThirds, setSelectedThirds] = useState<string[]>([]); // Array of team IDs

  useEffect(() => {
    setHasMounted(true);
    const savedName = localStorage.getItem('herd_user_name');
    if (savedName) { 
        setBracketName(savedName); 
        setIsEntryComplete(true); 
    }
  }, []);

  const getTeam = (id: string) => Object.values(GROUPS_DATA).flatMap((g: any) => g.teams).find((t: any) => t.id === id);

  // Toggle selection of a 3rd place team (Max 8)
  const toggleThirdPlace = (teamId: string) => {
    setSelectedThirds(prev => {
        if (prev.includes(teamId)) return prev.filter(id => id !== teamId);
        if (prev.length < 8) return [...prev, teamId];
        return prev;
    });
  };

  // Logic to fill the bracket slots
  const resolveTeam = (slot: string) => {
    if (!slot) return null;
    if (slot.startsWith('W')) return bracketWinners['m' + slot.substring(1)];
    
    if (slot === 'L101' || slot === 'L102') {
        const mId = 'm' + slot.substring(1);
        const winner = bracketWinners[mId];
        const match = BRACKET_MAPPING.find(x => x.id === mId);
        if (!winner || !match) return { placeholder: `SF ${slot === 'L101' ? '1' : '2'} Loser` };
        const t1 = resolveTeam(match.t1); 
        const t2 = resolveTeam(match.t2);
        return winner.id === t1?.id ? t2 : t1;
    }

    if (slot.startsWith('3RD')) {
        const idx = parseInt(slot.split('-')[1]) - 1;
        const tId = selectedThirds[idx];
        return tId ? getTeam(tId) : { placeholder: `3rd Slot ${idx + 1}` };
    }

    const gId = slot[0]; 
    const rank = parseInt(slot.substring(1));
    const tId = standings[gId]?.[rank];
    return tId ? getTeam(tId) : { placeholder: `${rank === 1 ? 'Winner' : '2nd'} Group ${gId}` };
  };

  const handleJoin = () => {
    if (bracketName.trim().length < 2) return alert("Please enter your name.");
    localStorage.setItem('herd_user_name', bracketName);
    setIsEntryComplete(true);
  };

  const submitToDatabase = async () => {
    const table = isAdmin ? 'official_results' : 'submissions';
    const payload = {
      bracket_name: isAdmin ? 'OFFICIAL' : bracketName,
      bracket_data: { standings, bracketWinners, selectedThirds }
    };
    const { error } = await supabase.from(table).insert([payload]);
    if (error) alert(error.message);
    else alert(isAdmin ? "Official Results Saved!" : "Prediction Locked!");
  };

  const recalculateScores = async () => {
    const { data: official } = await supabase.from('official_results').select('*').order('created_at', { ascending: false }).limit(1).single();
    if (!official) return alert("Admin: Set official scores first!");
    const { data: subs } = await supabase.from('submissions').select('*');
    if (!subs) return;

    const offData = official.bracket_data;
    for (const sub of subs) {
      let score = 0; 
      const u = sub.bracket_data;

      // 1. Group Standings (+2 pts)
      Object.keys(offData.standings || {}).forEach(gid => {
        [1,2,3].forEach(r => { if(u.standings?.[gid]?.[r] === offData.standings[gid][r]) score += 2; });
      });

      // 2. Knockout Winners
      Object.keys(offData.bracketWinners || {}).forEach(mid => {
        if(u.bracketWinners?.[mid]?.id === offData.bracketWinners[mid]?.id) {
          if (mid === 'm103') score += 10;
          else if (mid === 'm104') score += 20;
          else score += 5;
        }
      });

      await supabase.from('submissions').update({ points: score }).eq('id', sub.id);
    }
    alert("Scores updated!"); window.location.reload();
  };

  if (!hasMounted) return null;

  if (!isEntryComplete) {
    return (
      <div className="min-h-screen bg-blue-600 flex items-center justify-center p-4 font-sans text-slate-900">
        <div className="bg-white rounded-[40px] shadow-2xl max-w-4xl w-full flex flex-col md:flex-row overflow-hidden">
          <div className="bg-slate-900 p-10 text-white md:w-1/2">
             <h2 className="text-4xl font-black italic tracking-tighter mb-8 border-b border-blue-500 pb-4">ARENA RULES</h2>
             <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="bg-blue-600 p-2 rounded-xl h-fit"><Info size={20}/></div>
                  <div><p className="font-bold text-lg text-white">Group Stage</p><p className="text-slate-400 text-sm">+2 Points for correct rank.</p></div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-amber-500 p-2 rounded-xl h-fit"><Award size={20}/></div>
                  <div><p className="font-bold text-lg text-white">Knockouts</p><p className="text-slate-400 text-sm">+5 for R32/16/QF/SF, +10 for 3rd Place, +20 for Final.</p></div>
                </div>
             </div>
          </div>
          <div className="p-12 md:w-1/2 flex flex-col justify-center">
             <h1 className="text-3xl font-black mb-10 italic">Herd <span className="text-blue-600">Arena</span></h1>
             <input type="text" placeholder="Full Legal Name" className="w-full p-4 rounded-2xl border-2 border-slate-100 mb-4 font-bold" value={bracketName} onChange={(e) => setBracketName(e.target.value)} />
             <button onClick={handleJoin} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest text-xs">Enter Arena</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-40">
      <nav className="bg-white border-b border-slate-100 px-10 py-5 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-black italic uppercase">Herd Arena</h1>
        <div className="flex gap-4">
           <button onClick={() => setView('bracket')} className={`px-5 py-2 rounded-xl text-xs font-black transition ${view === 'bracket' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>BRACKET</button>
           <button onClick={() => setView('leaderboard')} className={`px-5 py-2 rounded-xl text-xs font-black transition ${view === 'leaderboard' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>STANDINGS</button>
           <button onClick={() => {const p = prompt("Admin?"); if(p==="herd2026") setIsAdmin(!isAdmin)}} className="text-slate-200"><ShieldCheck size={18}/></button>
        </div>
      </nav>

      <main className="max-w-[1900px] mx-auto p-10 space-y-16">
        {view === 'bracket' ? (
          <>
            {/* 1. GROUPS */}
            <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Object.entries(GROUPS_DATA).map(([id, g]: any) => (
                  <div key={id} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 italic">Group {id}</h3>
                    <div className="space-y-4">
                      {g.teams.map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-5 h-3.5 object-cover rounded shadow-sm" alt=""/> 
                             <span className="text-sm font-bold">{t.n}</span>
                          </div>
                          <div className="flex gap-1">
                            {[1, 2, 3].map(r => (
                              <button key={r} onClick={() => setStandings((p: any) => ({ ...p, [id]: { ...p[id], [r]: t.id } }))} className={`w-7 h-7 text-[10px] font-black rounded-lg transition ${standings[id]?.[r] === t.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{r}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </section>

            {/* 2. MANUAL 3RDS SELECTION PANEL (Matching your image style) */}
            <section className="bg-amber-50 border-[3px] border-amber-100 p-12 rounded-[4rem] shadow-sm">
                <div className="flex justify-between items-center mb-10">
                   <h2 className="text-3xl font-black text-amber-900 uppercase italic tracking-tighter">8 Best 3rd-Place Teams (Manual)</h2>
                   <div className={`px-8 py-3 rounded-full font-black text-xs tracking-widest text-white transition-all ${selectedThirds.length === 8 ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                      {selectedThirds.length}/8 QUALIFIED
                   </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                   {Object.keys(GROUPS_DATA).map(gid => {
                      const tId = standings[gid]?.[3];
                      const t = getTeam(tId);
                      if(!t) return <div key={gid} className="bg-white/30 border-2 border-dashed border-amber-200 rounded-[2.5rem] h-32 flex items-center justify-center text-[10px] font-bold text-amber-400 uppercase px-4 text-center">Set 3rd in Group {gid}</div>;
                      
                      const isSelected = selectedThirds.includes(t.id);
                      
                      return (
                        <button 
                          key={t.id} 
                          onClick={() => toggleThirdPlace(t.id)}
                          className={`relative p-8 rounded-[2.5rem] border-[3px] transition-all flex flex-col items-center gap-3 group
                            ${isSelected 
                              ? 'bg-white border-blue-600 shadow-xl scale-105 z-10' 
                              : 'bg-white/50 border-transparent opacity-60 hover:opacity-100 hover:bg-white hover:border-amber-200'}`}
                        >
                           <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Group {gid}</p>
                           <img src={`https://flagcdn.com/w80/${t.c}.png`} className="w-12 h-8 object-cover rounded shadow-md mb-2" alt=""/>
                           <span className="text-xs font-black uppercase text-slate-800 text-center leading-tight h-8 flex items-center">{t.n}</span>
                           
                           <div className={`mt-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter ${isSelected ? 'text-blue-600' : 'text-slate-300'}`}>
                              {isSelected ? (
                                <><Check size={12} strokeWidth={4}/> <span>Advancing</span></>
                              ) : (
                                <span>Bench</span>
                              )}
                           </div>
                        </button>
                      );
                   })}
                </div>
            </section>

            {/* 3. BRACKET */}
            <section className="flex gap-10 overflow-x-auto pb-20 no-scrollbar items-start">
               <BracketCol label="Round of 32" slice={[0, 16]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} />
               <BracketCol label="Round of 16" slice={[16, 24]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-24 pt-16" />
               <BracketCol label="Quarters" slice={[24, 28]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-[310px] pt-44" />
               <BracketCol label="Semis" slice={[28, 30]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-[640px] pt-[280px]" />
               
               <div className="flex-shrink-0 pt-[450px] space-y-40">
                  <div className="w-64 p-8 bg-amber-50 border-2 border-amber-100 rounded-[3rem] text-center">
                     <h3 className="text-[10px] font-black text-amber-700 uppercase mb-4 italic">3rd Place</h3>
                     <MatchBox m={BRACKET_MAPPING[30]} t1={resolveTeam('L101')} t2={resolveTeam('L102')} winner={bracketWinners['m103']} onPick={(w: any) => setBracketWinners((p: any) => ({ ...p, ['m103']: w }))} />
                  </div>
                  <div className="w-80 p-12 bg-white border-[8px] border-blue-600 rounded-[80px] text-center shadow-2xl scale-110">
                     <Award size={64} className="text-blue-600 mx-auto mb-8 animate-bounce" />
                     <MatchBox m={BRACKET_MAPPING[31]} t1={resolveTeam('W101')} t2={resolveTeam('W102')} winner={bracketWinners['m104']} onPick={(w: any) => setBracketWinners((p: any) => ({ ...p, ['m104']: w }))} />
                     <div className="mt-8 border-t pt-6">
                        <div className="text-3xl font-black text-blue-600 italic uppercase truncate">{bracketWinners['m104']?.n || 'TBD'}</div>
                     </div>
                  </div>
               </div>
            </section>
          </>
        ) : (
          <div className="max-w-2xl mx-auto bg-white p-12 rounded-[60px] shadow-2xl text-center">
             <Trophy size={48} className="mx-auto text-blue-600 mb-6" />
             <h2 className="text-3xl font-black mb-10 italic uppercase">Herd Standings</h2>
             <LeaderboardList />
          </div>
        )}
      </main>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-4">
         {isAdmin && <button onClick={recalculateScores} className="bg-emerald-600 text-white px-10 py-3 rounded-full font-black shadow-xl text-[10px] uppercase tracking-widest border-4 border-white"><Database size={16}/> Recalculate</button>}
         <button onClick={submitToDatabase} className="bg-slate-950 text-white px-24 py-6 rounded-[2.5rem] font-black shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 tracking-[0.2em] uppercase text-xs">
            <Save size={20}/> {isAdmin ? 'Set Results' : 'Lock Prediction'}
         </button>
      </div>
    </div>
  );
}

// COMPONENTS
function LeaderboardList() {
  const [list, setList] = React.useState<any[]>([]);
  useEffect(() => { supabase.from('submissions').select('*').order('points', { ascending: false }).then(({ data }) => data && setList(data)); }, []);
  return (
    <div className="space-y-4">
      {list.map((u, i) => (
        <div key={i} className="flex justify-between items-center p-8 bg-blue-50 rounded-[40px] border border-blue-100">
          <span className="font-bold flex items-center gap-6 text-xl tracking-tight"><span className="text-blue-200 font-mono italic text-2xl">#{i+1}</span> {u.bracket_name}</span>
          <span className="font-black text-blue-600 text-2xl">{u.points} <span className="text-[10px] uppercase text-slate-400">pts</span></span>
        </div>
      ))}
    </div>
  );
}

function BracketCol({ label, slice, resolve, winners, setWinners, spacing = "space-y-4" }: any) {
  return (
    <div className={`w-64 flex-shrink-0 ${spacing}`}>
      <h4 className="text-[10px] font-black text-slate-400 uppercase text-center mb-6 tracking-widest italic">{label}</h4>
      {BRACKET_MAPPING.slice(slice[0], slice[1]).map(m => (
        <MatchBox key={m.id} m={m} t1={resolve(m.t1)} t2={resolve(m.t2)} winner={winners[m.id]} onPick={(w: any) => setWinners((p: any) => ({ ...p, [m.id]: w }))} />
      ))}
    </div>
  );
}

function MatchBox({ t1, t2, winner, onPick }: any) {
  const isPlaceholder = (t: any) => !t || t.placeholder;
  return (
    <div className="bg-white border border-slate-200 rounded-[1.8rem] overflow-hidden shadow-sm">
      {[t1, t2].map((t, i) => (
        <button key={i} disabled={isPlaceholder(t)} onClick={() => onPick(t)} className={`w-full text-left p-4 flex justify-between items-center border-b last:border-0 border-slate-50 transition-all ${winner?.id === t?.id && !isPlaceholder(t) ? 'bg-blue-600 text-white font-black' : 'hover:bg-blue-50'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            {t?.c ? <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-5 h-3.5 object-cover rounded shadow-sm" alt="" /> : <div className="w-5 h-3.5 bg-slate-100 rounded-sm" />}
            <span className={`text-[10px] font-black uppercase tracking-tight truncate ${isPlaceholder(t) ? 'text-slate-300 italic' : ''}`}>{t?.n || t?.placeholder}</span>
          </div>
          {winner?.id === t?.id && !isPlaceholder(t) && <Check size={16} strokeWidth={5} />}
        </button>
      ))}
    </div>
  );
}