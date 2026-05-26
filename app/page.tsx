'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, Check, Award, LayoutGrid, Info, ShieldCheck, Save, LogOut, LogIn, ArrowRight } from 'lucide-react';
import { GROUPS_DATA, BRACKET_MAPPING } from '../constants/teams';
import { supabase } from '../lib/supabase';

export default function HerdArenaMaster() {
  const [hasMounted, setHasMounted] = useState(false);
  const [isEntryComplete, setIsEntryComplete] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState('bracket');
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [bracketName, setBracketName] = useState('');
  const [standings, setStandings] = useState<any>({});
  const [bracketWinners, setBracketWinners] = useState<any>({});

  useEffect(() => {
    setHasMounted(true);
    const savedName = localStorage.getItem('herd_user_name');
    if (savedName) { setBracketName(savedName); setIsEntryComplete(true); }
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getSession();
  }, []);

  const getTeam = (id: string) => Object.values(GROUPS_DATA).flatMap((g: any) => g.teams).find((t: any) => t.id === id);

  // AUTO-SELECT 8 BEST 3rds BY FIFA RANK
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

  const handleJoin = () => {
    if (bracketName.trim().length < 2) return alert("Please enter your name.");
    localStorage.setItem('herd_user_name', bracketName);
    setIsEntryComplete(true);
  };

  const submitToDatabase = async () => {
    const table = isAdmin ? 'official_results' : 'submissions';
    const payload = {
      bracket_name: isAdmin ? 'OFFICIAL_RESULTS' : bracketName,
      user_id: user?.id,
      bracket_data: { standings, bracketWinners, thirds: autoSelectedThirds }
    };
    const { error } = await supabase.from(table).insert([payload]);
    if (error) alert(error.message);
    else alert(`Saved to ${table}! Good luck!`);
  };

  if (!hasMounted) return null;

  if (!isEntryComplete) {
    return (
      <div className="min-h-screen bg-blue-600 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full text-center">
          <Trophy size={48} className="text-blue-600 mx-auto mb-6" />
          <h1 className="text-2xl font-black uppercase italic text-slate-800 tracking-tighter">Herd Arena 2026</h1>
          <div className="mt-8 space-y-4 text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Full Name</label>
            <input type="text" placeholder="Your Name" className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none font-bold text-lg transition-all" value={bracketName} onChange={(e) => setBracketName(e.target.value)} />
            <button onClick={handleJoin} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2">START <ArrowRight size={20}/></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] text-slate-900 font-sans pb-40">
      <nav className="bg-white border-b border-slate-100 px-10 py-5 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-100"><Trophy size={18} /></div>
          <h1 className="text-xl font-black tracking-tight italic uppercase">Herd Arena</h1>
        </div>
        <div className="flex gap-4">
           <button onClick={() => setView('bracket')} className={`px-5 py-2 rounded-xl text-xs font-black transition ${view === 'bracket' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>BRACKET</button>
           <button onClick={() => setView('leaderboard')} className={`px-5 py-2 rounded-xl text-xs font-black transition ${view === 'leaderboard' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>LEADERBOARD</button>
           <button onClick={() => {const p = prompt("Admin?"); if(p==="herd2026") setIsAdmin(!isAdmin)}} className="text-slate-100"><ShieldCheck size={18}/></button>
        </div>
      </nav>

      <main className="max-w-[1900px] mx-auto p-10 space-y-20">
        {view === 'bracket' ? (
          <>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[50px] p-12 text-white shadow-2xl shadow-blue-100 flex justify-between items-center">
               <div>
                  <h2 className="text-5xl font-black italic tracking-tighter mb-2 underline decoration-blue-300 decoration-4 underline-offset-8 uppercase">Good Luck, {bracketName}!</h2>
                  <p className="text-blue-100 font-medium italic opacity-90">FIFA logic will automatically advance the 8 best 3rd-placed teams.</p>
               </div>
               <div className="bg-white/20 px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest border border-white/30">Predicting</div>
            </div>

            {/* 1. GROUPS */}
            <section>
              <h2 className="text-2xl font-black mb-10 flex items-center gap-3 uppercase italic tracking-tight"><LayoutGrid className="text-blue-600"/> 1. Group Standings</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Object.entries(GROUPS_DATA).map(([id, g]: any) => (
                  <div key={id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
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
                              <button key={r} onClick={() => setStandings((p: any) => ({ ...p, [id]: { ...p[id], [r]: t.id } }))} className={`w-7 h-7 text-[10px] font-black rounded-lg transition ${standings[id]?.[r] === t.id ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{r}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. YELLOW BEST 3RDS PANEL (Matching Image 2) */}
            <section className="bg-amber-50 border-2 border-amber-200 p-10 rounded-[40px] shadow-sm">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-3xl font-black text-amber-900 uppercase italic tracking-tighter">8 Best 3rd-Place Teams</h2>
                   <div className="bg-emerald-500 text-white px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest">{autoSelectedThirds.length}/8 selected</div>
                </div>
                <p className="text-amber-800/60 text-sm font-medium mb-8 max-w-3xl leading-relaxed italic">
                  Based on FIFA's official 2026 bracket, the 8 teams from your 12 third-place picks with the highest FIFA Ranking (lowest number) are automatically placed into the Round of 32.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                   {autoSelectedThirds.map((t: any) => (
                      <div key={t.id} className="bg-white border-2 border-amber-200 p-5 rounded-3xl shadow-sm animate-in fade-in zoom-in duration-300">
                         <p className="text-[8px] font-black text-amber-600 uppercase mb-2">3rd Group {t.group}</p>
                         <div className="flex items-center gap-3 mb-2">
                            <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-5" alt=""/>
                            <span className="text-sm font-black uppercase text-slate-800">{t.n}</span>
                         </div>
                         <div className="text-[9px] font-bold text-emerald-600 flex items-center gap-1 uppercase tracking-widest">
                            <Check size={10} strokeWidth={4} /> Advancing
                         </div>
                      </div>
                   ))}
                   {autoSelectedThirds.length === 0 && <div className="col-span-full py-10 text-center text-amber-400 font-black uppercase tracking-widest italic opacity-50">Select rank #3 in groups to populate this panel...</div>}
                </div>
            </section>

            {/* 3. BRACKET SECTION */}
            <section className="flex gap-10 overflow-x-auto pb-20 no-scrollbar items-start">
               <BracketCol label="R32" slice={[0, 16]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} />
               <BracketCol label="R16" slice={[16, 24]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-24 pt-16" />
               <BracketCol label="Quarters" slice={[24, 28]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-[310px] pt-44" />
               <BracketCol label="Semis" slice={[28, 30]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-[640px] pt-[280px]" />
               
               <div className="flex-shrink-0 pt-[450px] space-y-40">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase text-center tracking-widest italic mb-10">Grand Finalists</h4>
                  
                  {/* THIRD-PLACE PLAY-OFF (Matching Image 3) */}
                  <div className="w-64 p-8 bg-amber-50 border-2 border-amber-100 rounded-[3rem] shadow-sm text-center ring-8 ring-white">
                     <h3 className="text-xs font-black text-amber-700 uppercase tracking-[0.2em] mb-4 italic">Third-Place Play-Off</h3>
                     <p className="text-[8px] font-bold text-slate-400 mb-4 uppercase font-mono">Match M103</p>
                     <MatchBox m={BRACKET_MAPPING[30]} t1={resolveTeam('L101')} t2={resolveTeam('L102')} winner={bracketWinners['m103']} onPick={(w: any) => setBracketWinners((p: any) => ({ ...p, ['m103']: w }))} />
                  </div>

                  {/* GRAND FINAL */}
                  <div className="w-80 p-12 bg-white border-[8px] border-blue-600 rounded-[5rem] text-center shadow-2xl scale-110 ring-[12px] ring-blue-50 relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
                     <Award size={64} className="text-blue-600 mx-auto mb-8 animate-bounce" />
                     <MatchBox m={BRACKET_MAPPING[31]} t1={resolveTeam('W101')} t2={resolveTeam('W102')} winner={bracketWinners['m104']} onPick={(w: any) => setBracketWinners((p: any) => ({ ...p, ['m104']: w }))} />
                     <div className="mt-10 border-t pt-8">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-[0.3em] italic">World Champion</p>
                        <div className="text-4xl font-black text-blue-600 italic uppercase truncate tracking-tighter drop-shadow-sm">{bracketWinners['m104']?.n || 'TBD'}</div>
                     </div>
                  </div>
               </div>
            </section>
          </>
        ) : (
          <div className="max-w-2xl mx-auto bg-white p-16 rounded-[60px] shadow-2xl border border-slate-50 text-center ring-8 ring-blue-50">
             <Trophy size={64} className="mx-auto text-blue-600 mb-8" />
             <h2 className="text-4xl font-black mb-12 italic uppercase tracking-tighter text-slate-800 underline decoration-blue-500 decoration-8 underline-offset-8">Office Standings</h2>
             <div className="space-y-4">
                <div className="flex justify-between items-center p-8 bg-blue-50 rounded-[40px] border border-blue-100 shadow-sm transition-all hover:scale-[1.02] cursor-pointer">
                    <span className="font-bold flex items-center gap-8 text-2xl tracking-tight"><span className="text-blue-300 font-mono italic text-3xl">#1</span> {bracketName}</span>
                    <span className="font-black text-blue-600 text-3xl">0 <span className="text-[14px] uppercase text-slate-400 ml-1 font-mono tracking-widest">pts</span></span>
                </div>
             </div>
             <p className="mt-16 text-slate-300 text-[10px] uppercase font-black tracking-[0.3em] italic leading-loose">Leaderboard updates automatically as matches conclude</p>
          </div>
        )}
      </main>

      {/* STICKY FOOTER SUBMIT (Matching Image 3) */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-4">
         <div className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-full border border-slate-100 shadow-sm flex gap-4 text-[9px] font-black uppercase text-slate-400 tracking-widest">
            <button onClick={() => alert("All favorites selected!")}>Auto-pick Favorites</button>
            <span className="opacity-20 text-slate-300">|</span>
            <button onClick={() => window.location.reload()}>Clear Bracket</button>
         </div>
         <button onClick={submitToDatabase} className="bg-slate-950 text-white px-24 py-6 rounded-[2.5rem] font-black shadow-[0_40px_80px_-15px_rgba(0,0,0,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-4 tracking-[0.3em] uppercase text-xs">
            <Save size={20} strokeWidth={3}/> {isAdmin ? 'Update Official Results' : 'Lock My Prediction'}
         </button>
      </div>
    </div>
  );
}

// SHARED COMPONENTS
function BracketCol({ label, slice, resolve, winners, setWinners, spacing = "space-y-4" }: any) {
  return (
    <div className={`w-64 flex-shrink-0 ${spacing}`}>
      <h4 className="text-[10px] font-black text-slate-400 uppercase text-center mb-8 tracking-[0.4em] italic">{label}</h4>
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
            {t?.c ? <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-5 h-3.5 object-cover rounded shadow-sm border border-slate-100" alt="" /> : <div className="w-5 h-3.5 bg-slate-50 rounded-sm border border-slate-100 flex items-center justify-center opacity-30">🏳️</div>}
            <span className={`text-[10px] font-black uppercase tracking-tight truncate ${t?.placeholder ? 'text-slate-300 italic font-medium' : 'text-slate-800'}`}>{t?.n || t?.placeholder}</span>
          </div>
          {winner?.id === t?.id && <Check size={16} strokeWidth={5} />}
        </button>
      ))}
    </div>
  );
}