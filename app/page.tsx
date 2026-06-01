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
  const [thirdsManual, setThirdsManual] = useState<string[]>([]);
  const [awards, setAwards] = useState({ ball: '', boot: '', gloves: '' });

  useEffect(() => {
    setHasMounted(true);
    const savedName = localStorage.getItem('herd_user_name');
    if (savedName) { setBracketName(savedName); setIsEntryComplete(true); }
  }, []);

  const getTeam = (id: string) => Object.values(GROUPS_DATA).flatMap((g: any) => g.teams).find((t: any) => t.id === id);

  const allPotentialThirds = useMemo(() => {
    return Object.keys(GROUPS_DATA).map(gid => {
      const tId = standings[gid]?.[3];
      return tId ? { ...getTeam(tId), group: gid } : null;
    }).filter(Boolean);
  }, [standings]);

  // Logic to determine which 3rds are actually advancing based on manual selection
  const autoSelectedThirds = useMemo(() => {
    return allPotentialThirds.filter((t: any) => thirdsManual.includes(t.id));
  }, [allPotentialThirds, thirdsManual]);

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
        const tId = thirdsManual[idx];
        return tId ? getTeam(tId) : { placeholder: `3rd Slot ${idx + 1}` };
    }
    const gId = slot[0]; const rank = parseInt(slot.substring(1));
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
      bracket_data: { standings, bracketWinners, thirdsManual },
      golden_ball: awards.ball, golden_boot: awards.boot, golden_gloves: awards.gloves
    };
    const { error } = await supabase.from(table).insert([payload]);
    if (error) alert(error.message);
    else alert("Success! Prediction locked.");
  };

  const recalculateScores = async () => {
    const { data: official } = await supabase.from('official_results').select('*').order('created_at', { ascending: false }).limit(1).single();
    if (!official) return alert("Save Official Results first!");
    const { data: subs } = await supabase.from('submissions').select('*');
    if (!subs) return;
    for (const sub of subs) {
      let score = 0; const u = sub.bracket_data; const off = official.bracket_data;
      Object.keys(off.standings || {}).forEach(gid => [1,2,3].forEach(r => { if(u.standings?.[gid]?.[r] === off.standings[gid][r]) score += 2; }));
      Object.keys(off.bracketWinners || {}).forEach(mid => {
        if(u.bracketWinners?.[mid]?.id === off.bracketWinners[mid]?.id) {
          const m = parseInt(mid.substring(1));
          if(m <= 102) score += 5; else if(m === 103) score += 10; else if(m === 104) score += 20;
        }
      });
      if(sub.golden_ball?.toLowerCase() === official.golden_ball?.toLowerCase() && official.golden_ball) score += 5;
      await supabase.from('submissions').update({ points: score }).eq('id', sub.id);
    }
    alert("Standings Updated!"); window.location.reload();
  };

  if (!hasMounted) return null;

  return (
    <div className="min-h-screen relative font-sans bg-slate-50">
      
      {/* GLOBAL BACKGROUND - Always Behind */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40" 
          style={{ backgroundImage: "url('/stadium.jpg')" }} 
        />
        <div className="absolute inset-0 bg-blue-600/10 mix-blend-multiply" />
      </div>

      <div className="relative z-10">
        {!isEntryComplete ? (
          /* --- WELCOME SCREEN --- */
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-[40px] shadow-2xl max-w-4xl w-full flex flex-col md:flex-row overflow-hidden border border-white/20">
              <div className="bg-[#0f172a] p-10 text-white md:w-1/2">
                <h2 className="text-4xl font-black italic mb-8 border-b border-blue-500 pb-4">ARENA RULES</h2>
                <div className="space-y-6 text-sm">
                   <div className="flex gap-4"><Info className="text-blue-500"/> <p><b>Group Stage:</b> +2 Pts per correct rank.</p></div>
                   <div className="flex gap-4"><Check className="text-blue-500"/> <p><b>Knockouts:</b> +5 Pts per correct winner.</p></div>
                   <div className="flex gap-4"><Award className="text-blue-500"/> <p><b>Finals:</b> +20 Pts for correct Champ.</p></div>
                   <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex gap-3">
                      <AlertCircle className="text-red-500 shrink-0" />
                      <p className="text-[10px] font-black uppercase">One submission only. Real names required.</p>
                   </div>
                </div>
              </div>
              <div className="p-12 md:w-1/2 flex flex-col justify-center items-center text-center">
                <Trophy size={64} className="text-blue-600 mb-6 drop-shadow-xl" />
                <h1 className="text-4xl font-black mb-1 italic text-slate-900 uppercase">Herd Arena</h1>
                <div className="mt-8 space-y-4 w-full max-w-xs">
                  <input type="text" placeholder="Full Legal Name" className="w-full p-4 rounded-2xl border-2 border-slate-100 outline-none font-bold" value={bracketName} onChange={(e) => setBracketName(e.target.value)} />
                  <button onClick={handleJoin} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black shadow-lg">ENTER ARENA</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* --- MAIN DASHBOARD --- */
          <div className="pb-40">
            <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-10 py-5 sticky top-0 z-50 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-2 rounded-xl text-white"><Trophy size={18} /></div>
                <h1 className="text-xl font-black italic uppercase">Herd Arena</h1>
              </div>
              <div className="flex gap-4 items-center">
                 <button onClick={() => setView('bracket')} className={`px-5 py-2 rounded-xl text-xs font-black ${view === 'bracket' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>BRACKET</button>
                 <button onClick={() => setView('leaderboard')} className={`px-5 py-2 rounded-xl text-xs font-black ${view === 'leaderboard' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>STANDINGS</button>
                 <button onClick={() => {const p = prompt("Pass?"); if(p==="herd2026") setIsAdmin(!isAdmin)}} className="text-slate-100"><ShieldCheck size={18}/></button>
              </div>
            </nav>

            <main className="max-w-[1900px] mx-auto p-10 space-y-20">
              {view === 'bracket' ? (
                <>
                  <div className="bg-blue-600/90 rounded-[50px] p-12 text-white shadow-2xl flex justify-between items-center">
                     <h2 className="text-5xl font-black italic uppercase">Good Luck, {bracketName}!</h2>
                  </div>

                  {/* 1. GROUPS */}
                  <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {Object.entries(GROUPS_DATA).map(([id, g]: any) => (
                        <div key={id} className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-[2rem] p-6 shadow-sm">
                          <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest text-center italic">Group {id}</h3>
                          <div className="space-y-4">
                            {g.teams.map((t: any) => (
                              <div key={t.id} className="flex items-center justify-between">
                                <span className="text-sm font-bold flex items-center gap-2">
                                  <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-5 h-3.5 object-cover rounded shadow-sm" alt=""/> 
                                  {t.n}
                                </span>
                                <div className="flex gap-1">
                                  {[1, 2, 3].map(r => (
                                    <button key={r} onClick={() => setStandings((p: any) => ({ ...p, [id]: { ...p[id], [r]: t.id } }))} className={`w-7 h-7 text-[10px] font-black rounded-lg transition ${standings[id]?.[r] === t.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>{r}</button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </section>

                  {/* 2. MANUAL BEST 3RDS PANEL */}
                  <section className="bg-amber-50/95 backdrop-blur-sm border-2 border-amber-200 p-10 rounded-[3rem] shadow-sm">
                      <div className="flex justify-between items-center mb-8">
                         <h2 className="text-2xl font-black text-amber-900 uppercase italic">8 Best 3rd-Place Teams</h2>
                         <div className="bg-emerald-500 text-white px-6 py-2 rounded-full font-black text-xs">{thirdsManual.length}/8 SELECTED</div>
                      </div>
                      <p className="text-amber-800 text-xs mb-8 italic">Pick which 8 of your 12 third-place teams advance into the Round of 32.</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                         {Object.keys(GROUPS_DATA).map(gid => {
                            const t = getTeam(standings[gid]?.[3]);
                            if(!t) return null;
                            const isSelected = thirdsManual.includes(t.id);
                            return (
                              <button key={t.id} onClick={() => setThirdsManual(p => isSelected ? p.filter(x => x !== t.id) : (p.length < 8 ? [...p, t.id] : p))} className={`p-6 rounded-[2rem] border-2 transition-all text-center flex flex-col items-center ${isSelected ? 'bg-white border-blue-500 shadow-md scale-105' : 'bg-white/40 border-amber-100 opacity-50'}`}>
                                 <p className="text-[7px] font-black text-amber-600 uppercase mb-2">Group {gid}</p>
                                 <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-8 mb-2 shadow-sm" alt=""/>
                                 <span className="text-[10px] font-black uppercase text-slate-800 truncate w-full">{t.n}</span>
                                 <div className={`mt-3 flex items-center gap-1 text-[8px] font-black uppercase ${isSelected ? 'text-blue-600' : 'text-slate-300'}`}>
                                    {isSelected && <Check size={8} strokeWidth={5}/>} {isSelected ? 'Advancing' : 'Click to advance'}
                                 </div>
                              </button>
                            );
                         })}
                      </div>
                  </section>

                  {/* 3. BRACKET */}
                  <section className="flex gap-10 overflow-x-auto pb-20 no-scrollbar items-start">
                     <BracketCol label="R32" slice={[0, 16]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} />
                     <BracketCol label="R16" slice={[16, 24]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-24 pt-16" />
                     <BracketCol label="Quarters" slice={[24, 28]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-[310px] pt-44" />
                     <BracketCol label="Semis" slice={[28, 30]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-[640px] pt-[280px]" />
                     <div className="flex-shrink-0 pt-[450px] space-y-40">
                        <div className="w-64 p-8 bg-amber-50/95 border-2 border-amber-100 rounded-[3rem] shadow-sm text-center">
                           <h3 className="text-[10px] font-black text-amber-700 uppercase mb-4 italic">3rd Place Match</h3>
                           <MatchBox m={BRACKET_MAPPING[30]} t1={resolveTeam('L101')} t2={resolveTeam('L102')} winner={bracketWinners['m103']} onPick={(w: any) => setBracketWinners((p: any) => ({ ...p, ['m103']: w }))} />
                        </div>
                        <div className="w-80 p-12 bg-white/95 border-[8px] border-blue-600 rounded-[80px] text-center shadow-2xl scale-110">
                           <Award size={64} className="text-blue-600 mx-auto mb-8 animate-bounce" />
                           <MatchBox m={BRACKET_MAPPING[31]} t1={resolveTeam('W101')} t2={resolveTeam('W102')} winner={bracketWinners['m104']} onPick={(w: any) => setBracketWinners((p: any) => ({ ...p, ['m104']: w }))} />
                           <div className="mt-8 border-t pt-6">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest italic">World Champion</p>
                              <div className="text-3xl font-black text-blue-600 italic uppercase truncate">{bracketWinners['m104']?.n || 'TBD'}</div>
                           </div>
                        </div>
                     </div>
                  </section>
                </>
              ) : (
                <div className="max-w-2xl mx-auto bg-white/95 backdrop-blur-xl p-16 rounded-[60px] shadow-2xl border border-slate-50 text-center ring-8 ring-blue-50">
                   <h2 className="text-3xl font-black mb-10 italic uppercase text-slate-800 underline decoration-blue-500 decoration-8 underline-offset-8">Herd Standings</h2>
                   <LeaderboardList />
                </div>
              )}
            </main>

            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-4">
               {isAdmin && <button onClick={recalculateScores} className="bg-emerald-600 text-white px-10 py-3 rounded-full font-black shadow-xl hover:scale-105 transition flex items-center gap-2 text-[10px] uppercase border-4 border-white tracking-widest"><Database size={16}/> Refresh Leaderboard</button>}
               <button onClick={submitToDatabase} className="bg-slate-950 text-white px-24 py-6 rounded-[2.5rem] font-black shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 tracking-[0.2em] uppercase text-xs">
                  <Save size={20}/> {isAdmin ? 'Update Official Results' : 'Lock Prediction'}
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// HELPERS
function LeaderboardList() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => { supabase.from('submissions').select('*').order('points', { ascending: false }).then(({ data }) => data && setList(data)); }, []);
  return (
    <div className="space-y-4">
      {list.map((u, i) => (
        <div key={i} className="flex justify-between items-center p-8 bg-blue-50/90 rounded-[40px] border border-blue-100 shadow-sm">
          <span className="font-bold flex items-center gap-6 text-xl tracking-tight"><span className="text-blue-200 font-mono italic text-3xl">#{i+1}</span> {u.bracket_name}</span>
          <span className="font-black text-blue-600 text-2xl">{u.points} <span className="text-[10px] uppercase text-slate-400 font-mono">PTS</span></span>
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
  return (
    <div className="bg-white border border-slate-200 rounded-[1.8rem] overflow-hidden shadow-sm hover:shadow-md transition duration-300">
      {[t1, t2].map((t, i) => (
        <button key={i} disabled={t?.placeholder} onClick={() => onPick(t)} className={`w-full text-left p-4 flex justify-between items-center border-b last:border-0 border-slate-50 transition-all ${winner?.id === t?.id ? 'bg-blue-600 text-white font-black shadow-lg' : 'hover:bg-blue-50'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            {t?.c ? <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-5 h-3.5 object-cover rounded shadow-sm border border-slate-100" alt="" /> : <div className="w-5 h-3.5 bg-slate-100 rounded-sm" />}
            <span className={`text-[10px] font-black uppercase tracking-tight truncate ${t?.placeholder ? 'text-slate-300 italic font-medium' : 'text-slate-800'}`}>{t?.n || t?.placeholder}</span>
          </div>
          {winner?.id === t?.id && <Check size={16} strokeWidth={5} />}
        </button>
      ))}
    </div>
  );
}