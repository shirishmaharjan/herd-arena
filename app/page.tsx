'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, Check, Award, LayoutGrid, Info, ShieldCheck, Save, ArrowRight, Database, Star, AlertCircle, Search, Users } from 'lucide-react';
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
  const [selectedThirdsIds, setSelectedThirdsIds] = useState<string[]>([]); // NEW: Manual selection state
  const [awards, setAwards] = useState({ ball: '', boot: '', gloves: '' });

  useEffect(() => {
    setHasMounted(true);
    const savedName = localStorage.getItem('herd_user_name');
    if (savedName) { setBracketName(savedName); setIsEntryComplete(true); }
  }, []);

  const getTeam = (id: string) => Object.values(GROUPS_DATA).flatMap((g: any) => g.teams).find((t: any) => t.id === id);

  // Get all current 3rd place teams based on user standings
  const allCurrentThirds = useMemo(() => {
    return Object.keys(GROUPS_DATA).map(gid => {
      const tId = standings[gid]?.[3];
      return tId ? { ...getTeam(tId), group: gid } : null;
    }).filter(Boolean);
  }, [standings]);

  // Toggle selection for Best 3rd Place Teams
  const toggleThirdPlace = (teamId: string) => {
    setSelectedThirdsIds(prev => {
      if (prev.includes(teamId)) return prev.filter(id => id !== teamId);
      if (prev.length >= 8) return prev; // Limit to 8
      return [...prev, teamId];
    });
  };

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
        const tId = selectedThirdsIds[idx];
        const t = tId ? getTeam(tId) : null;
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
    if (selectedThirdsIds.length < 8) return alert("Please select exactly 8 best 3rd-place teams first!");
    
    const table = isAdmin ? 'official_results' : 'submissions';
    const payload = {
      bracket_name: isAdmin ? 'OFFICIAL' : bracketName,
      bracket_data: { standings, bracketWinners, thirds: selectedThirdsIds },
      golden_ball: awards.ball, golden_boot: awards.boot, golden_gloves: awards.gloves
    };
    const { error } = await supabase.from(table).insert([payload]);
    if (error) alert(error.message);
    else alert("Success! Your prediction is locked into the database.");
  };

  // ... (recalculateScores logic remains the same)

  if (!hasMounted) return null;

  if (!isEntryComplete) {
    return (
      <div className="min-h-screen bg-blue-600 flex items-center justify-center p-4 font-sans">
        {/* Welcome Screen remains identical to your design */}
        <div className="bg-white rounded-[40px] shadow-2xl max-w-4xl w-full flex flex-col md:flex-row overflow-hidden overflow-y-auto max-h-[95vh]">
          <div className="bg-slate-900 p-10 text-white md:w-1/2">
             <h2 className="text-4xl font-black italic tracking-tighter mb-8 border-b border-blue-500 pb-4">ARENA RULES</h2>
             <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="bg-blue-600 p-2 rounded-xl h-fit"><Info size={20}/></div>
                  <div><p className="font-bold text-lg">Group Stage</p><p className="text-slate-400 text-sm">+2 Points for correct rank.</p></div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-emerald-500 p-2 rounded-xl h-fit"><Star size={20}/></div>
                  <div><p className="font-bold text-lg">Player Honors</p><p className="text-slate-400 text-sm">+5 Points each. Use EXACT names from Google.</p></div>
                </div>
                <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl flex gap-3">
                   <AlertCircle className="text-red-500 shrink-0" />
                   <p className="text-[11px] font-bold text-red-500 uppercase tracking-widest leading-relaxed">Colleagues must use real names. One entry per person.</p>
                </div>
             </div>
          </div>
          <div className="p-12 md:w-1/2 flex flex-col justify-center">
             <Trophy size={48} className="text-blue-600 mb-6" />
             <h1 className="text-3xl font-black mb-2 italic">Herd <span className="text-blue-600">Arena</span></h1>
             <input type="text" placeholder="Full Legal Name" className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 outline-none font-bold text-lg focus:bg-white focus:border-blue-600 transition-all mb-4" value={bracketName} onChange={(e) => setBracketName(e.target.value)} />
             <button onClick={handleJoin} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 tracking-widest text-xs">ENTER THE ARENA <ArrowRight size={18}/></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-40">
      {/* Nav Bar code remains the same */}
      
      <main className="max-w-[1900px] mx-auto p-10 space-y-20">
        {view === 'bracket' ? (
          <>
            <div className="bg-blue-600 rounded-[50px] p-12 text-white shadow-2xl flex justify-between items-center relative overflow-hidden">
               <div className="relative z-10">
                  <h2 className="text-5xl font-black italic tracking-tighter mb-2 underline decoration-blue-300 decoration-4 underline-offset-8 uppercase">Good Luck, {bracketName}!</h2>
                  <p className="text-blue-100 font-medium italic">Manually pick your 8 best 3rd-place teams below.</p>
               </div>
            </div>

            {/* 1. GROUPS */}
            <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Object.entries(GROUPS_DATA).map(([id, g]: any) => (
                  <div key={id} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 italic">Group {id}</h3>
                    <div className="space-y-4">
                      {g.teams.map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-5 h-3.5 object-cover rounded" alt=""/> 
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

            {/* 2. MANUAL BEST 3RDS PANEL */}
            <section className="bg-amber-50 border-2 border-amber-200 p-10 rounded-[3rem] shadow-sm">
                <div className="flex justify-between items-center mb-8">
                   <div>
                     <h2 className="text-2xl font-black text-amber-900 uppercase italic tracking-tighter">8 Best 3rd-Place Teams</h2>
                     <p className="text-xs text-amber-700 font-bold">Select the 8 teams from your 3rd-place picks to advance.</p>
                   </div>
                   <div className={`px-6 py-2 rounded-full font-black text-xs tracking-widest ${selectedThirdsIds.length === 8 ? 'bg-emerald-500 text-white' : 'bg-amber-200 text-amber-800'}`}>
                      {selectedThirdsIds.length}/8 SELECTED
                   </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                   {Object.keys(GROUPS_DATA).map(gid => {
                      const tId = standings[gid]?.[3];
                      const t = tId ? getTeam(tId) : null;
                      if(!t) return (
                        <div key={gid} className="p-6 rounded-[2rem] border-2 border-dashed border-amber-200 flex flex-col items-center justify-center opacity-40">
                           <p className="text-[8px] font-black uppercase">Group {gid}</p>
                           <p className="text-[10px] font-bold">Pick 3rd first</p>
                        </div>
                      );
                      const isSelected = selectedThirdsIds.includes(t.id);
                      return (
                        <button key={t.id} onClick={() => toggleThirdPlace(t.id)} className={`p-6 rounded-[2rem] border-2 transition-all text-center flex flex-col items-center group relative ${isSelected ? 'bg-blue-600 border-blue-700 shadow-xl scale-105' : 'bg-white border-amber-100 hover:border-amber-300'}`}>
                           <p className={`text-[7px] font-black uppercase mb-2 ${isSelected ? 'text-blue-100' : 'text-amber-600'}`}>Group {gid}</p>
                           <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-8 mb-2 shadow-sm" alt=""/>
                           <span className={`text-[10px] font-black uppercase truncate w-full ${isSelected ? 'text-white' : 'text-slate-800'}`}>{t.n}</span>
                           <div className={`mt-3 flex items-center gap-1 text-[8px] font-black uppercase ${isSelected ? 'text-white' : 'text-blue-600'}`}>
                              {isSelected ? <Check size={10} strokeWidth={4}/> : <div className="w-2 h-2 rounded-full border border-blue-200"/>} {isSelected ? 'Advancing' : 'Click to Pick'}
                           </div>
                        </button>
                      );
                   })}
                </div>
            </section>

            {/* 3. BRACKET (Remains the same, uses the new resolve logic) */}
            <section className="flex gap-10 overflow-x-auto pb-20 no-scrollbar items-start">
               <BracketCol label="R32" slice={[0, 16]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} />
               {/* ... R16, QF, SF columns continue ... */}
            </section>

            {/* 4. PLAYER AWARDS + SCOUTING REPORT */}
            <section className="space-y-8">
              <div className="bg-indigo-600 rounded-[4rem] p-12 text-white shadow-2xl">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                      <h2 className="text-3xl font-black italic tracking-tighter flex items-center gap-4"><Star className="text-yellow-400 fill-yellow-400"/> Player Honors (+5 pts each)</h2>
                      <div className="mt-2 flex items-center gap-2 text-indigo-200 text-xs font-bold uppercase tracking-widest">
                        <Search size={14}/> <span>Tip: Google the full player name to ensure 100% accuracy for scoring.</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      { l: 'Golden Ball (MVP)', k: 'ball', icon: <Trophy size={16}/> }, 
                      { l: 'Golden Boot', k: 'boot', icon: <Star size={16}/> }, 
                      { l: 'Golden Gloves', k: 'gloves', icon: <ShieldCheck size={16}/> }
                    ].map(a => (
                      <div key={a.k} className="bg-white/10 p-8 rounded-[2.5rem] border border-white/20">
                          <label className="text-[10px] font-black uppercase text-indigo-200 tracking-widest block mb-4 italic flex items-center gap-2">{a.icon} {a.l}</label>
                          <input type="text" className="w-full bg-transparent border-b-2 border-white/30 outline-none p-2 font-black text-xl placeholder:text-white/20 focus:border-white transition-all uppercase" placeholder="FULL NAME..." value={(awards as any)[a.k]} onChange={(e) => setAwards(p => ({ ...p, [a.k]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
              </div>

              {/* NEW: INTERESTING SECTION FOR COLLEAGUES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-10 rounded-[3rem] border border-slate-200">
                      <h3 className="text-lg font-black italic mb-6 flex items-center gap-2 text-blue-600"><Users /> Scouting Report: Players to Watch</h3>
                      <div className="grid grid-cols-2 gap-4">
                          {[
                            { n: 'Vinícius Júnior', t: 'Brazil', r: 'The favorite for Golden Ball' },
                            { n: 'Kylian Mbappé', t: 'France', r: 'Always a Golden Boot threat' },
                            { n: 'Jude Bellingham', t: 'England', r: 'The engine room' },
                            { n: 'Lamine Yamal', t: 'Spain', r: 'The young phenom' }
                          ].map((p, i) => (
                            <div key={i} className="p-4 bg-slate-50 rounded-2xl">
                                <p className="font-black text-sm">{p.n}</p>
                                <p className="text-[10px] font-bold text-blue-600 uppercase">{p.t}</p>
                                <p className="text-[10px] text-slate-500 mt-1">{p.r}</p>
                            </div>
                          ))}
                      </div>
                  </div>
                  <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col justify-center">
                      <h3 className="text-2xl font-black italic mb-4">The "Herd" Wisdom</h3>
                      <p className="text-slate-400 text-sm mb-6">Will you play it safe with the FIFA ranks, or go for the underdog story? Remember: the 3rd Place Play-off is worth <span className="text-amber-400 font-black">+10 points</span> – don't ignore it!</p>
                      <div className="flex gap-3">
                         <div className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-blue-600/30">#Arena2026</div>
                         <div className="bg-indigo-600/20 text-indigo-400 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-indigo-600/30">#NoDraws</div>
                      </div>
                  </div>
              </div>
            </section>
          </>
        ) : (
          <div className="max-w-2xl mx-auto bg-white p-12 rounded-[60px] shadow-2xl border border-slate-50 text-center ring-8 ring-blue-50">
             <Trophy size={48} className="mx-auto text-blue-600 mb-6" />
             <h2 className="text-3xl font-black mb-10 italic uppercase tracking-tighter text-slate-800">Herd Standings</h2>
             <LeaderboardList />
          </div>
        )}
      </main>

      {/* Footer / Submit bar remains the same */}
    </div>
  );
}