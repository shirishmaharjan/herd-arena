'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, Check, Award, LayoutGrid, Info, ShieldCheck, Save, ArrowRight, Database, Star, AlertCircle, LogOut } from 'lucide-react';
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
    else alert("Success! Your prediction is locked into Herd Arena.");
  };

  if (!hasMounted) return null;

  // --- WELCOME SCREEN (HYDRATION & IMAGE FIX) ---
  if (!isEntryComplete) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 font-sans overflow-hidden bg-blue-700"> {/* Added solid fallback bg */}
        
        {/* DYNAMIC BACKGROUND LAYERS */}
        <div className="absolute inset-0 z-0">
          {/* THE STADIUM IMAGE */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
            style={{ 
              backgroundImage: "url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2000')", 
              filter: 'brightness(0.4) contrast(1.1)' 
            }} 
          />
          {/* THE BLUE GRADIENT OVERLAY */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/50 via-transparent to-black/70" />
        </div>

        {/* LOGIN CARD (Glassmorphism) */}
        <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-[45px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] max-w-4xl w-full flex flex-col md:flex-row overflow-hidden border border-white/20">
          
          {/* LEFT: RULES */}
          <div className="bg-[#0f172a] p-10 text-white md:w-1/2 relative overflow-hidden">
             <Trophy size={180} className="absolute -bottom-10 -left-10 text-white/[0.03] -rotate-12" />
             <h2 className="text-4xl font-black italic tracking-tighter mb-8 border-b border-blue-500 pb-4 relative z-10 uppercase">ARENA RULES</h2>
             <div className="space-y-6 relative z-10">
                <div className="flex gap-4 items-start">
                  <div className="bg-blue-600 p-2 rounded-xl shrink-0"><Info size={20}/></div>
                  <div><p className="font-bold text-lg leading-tight">Group Stage</p><p className="text-slate-400 text-xs mt-0.5">+2 Points for every correct rank (1st, 2nd, 3rd) in the group.</p></div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="bg-indigo-600 p-2 rounded-xl shrink-0"><Check size={20}/></div>
                  <div><p className="font-bold text-lg leading-tight">Knockout Wins</p><p className="text-slate-400 text-xs mt-0.5">+5 Points for every correct winner in R32, R16, QF, and SF.</p></div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="bg-amber-500 p-2 rounded-xl shrink-0"><Award size={20}/></div>
                  <div><p className="font-bold text-lg leading-tight">Special Matches</p><p className="text-slate-400 text-xs mt-0.5">+10 for 3rd Place Match and +20 for the Final Winner.</p></div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="bg-emerald-500 p-2 rounded-xl shrink-0"><Star size={20}/></div>
                  <div><p className="font-bold text-lg leading-tight">Player Honors</p><p className="text-slate-400 text-xs mt-0.5">+5 Points each for Golden Ball, Boot, and Gloves.</p></div>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex gap-3 mt-4">
                   <AlertCircle className="text-red-500 shrink-0" size={18} />
                   <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-relaxed">Disqualification: Use real names. One submission only. Duplicates will be disqualified.</p>
                </div>
             </div>
          </div>

          {/* RIGHT: JOIN */}
          <div className="p-12 md:w-1/2 flex flex-col justify-center items-center text-center bg-white">
             <Trophy size={64} className="text-blue-600 mb-6 drop-shadow-xl" />
             <h1 className="text-4xl font-black mb-1 italic tracking-tighter text-slate-900 uppercase">Herd <span className="text-blue-600">Arena</span></h1>
             <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-12">Championship 2026</p>
             <div className="space-y-4 w-full max-w-xs">
                <input 
                  type="text" 
                  placeholder="Full Legal Name" 
                  className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 outline-none font-bold text-lg focus:bg-white focus:border-blue-600 transition-all shadow-inner" 
                  value={bracketName} 
                  onChange={(e) => setBracketName(e.target.value)} 
                />
                <button 
                  onClick={handleJoin} 
                  className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 text-xs tracking-widest uppercase"
                >
                  ENTER ARENA <ArrowRight size={18}/>
                </button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN APP ---
  return (
    <div className="min-h-screen bg-[#f9fafb] text-slate-900 font-sans pb-40">
      <nav className="bg-white border-b border-slate-100 px-10 py-5 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-100"><Trophy size={18} /></div>
          <h1 className="text-xl font-black tracking-tight italic uppercase">Herd Arena</h1>
        </div>
        <div className="flex gap-4 items-center">
           <div className="flex bg-slate-100 p-1 rounded-xl">
             <button onClick={() => setView('bracket')} className={`px-5 py-2 rounded-xl text-xs font-black transition ${view === 'bracket' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>BRACKET</button>
             <button onClick={() => setView('leaderboard')} className={`px-5 py-2 rounded-xl text-xs font-black transition ${view === 'leaderboard' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>STANDINGS</button>
           </div>
           <button onClick={() => { localStorage.removeItem('herd_user_name'); window.location.reload(); }} className="p-2 text-slate-300 hover:text-red-500 transition"><LogOut size={18}/></button>
           <button onClick={() => {const p = prompt("Admin Pass?"); if(p==="herd2026") setIsAdmin(!isAdmin)}} className="text-slate-100"><ShieldCheck size={18}/></button>
        </div>
      </nav>

      <main className="max-w-[1900px] mx-auto p-10 space-y-20">
        {view === 'bracket' ? (
          <>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[50px] p-12 text-white shadow-2xl flex justify-between items-center relative overflow-hidden">
               <div className="relative z-10">
                  <h2 className="text-5xl font-black italic tracking-tighter mb-2 underline decoration-blue-300 decoration-4 underline-offset-8 uppercase">Good Luck, {bracketName}!</h2>
                  <p className="text-blue-100 font-medium italic">8 best 3rd-place teams automatically chosen by FIFA Rank.</p>
               </div>
               <div className="bg-white/20 px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest border border-white/30 relative z-10">Predicting LIVE</div>
            </div>

            {/* 1. GROUPS */}
            <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Object.entries(GROUPS_DATA).map(([id, g]: any) => (
                  <div key={id} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest italic font-mono">Group {id}</h3>
                    <div className="space-y-4">
                      {g.teams.map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between">
                          <div className="flex flex-col">
                             <div className="flex items-center gap-3">
                                <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-5 h-3.5 object-cover rounded shadow-sm border border-slate-100" alt=""/> 
                                <span className="text-sm font-bold">{t.n}</span>
                             </div>
                             <span className="text-[8px] font-black text-slate-300 mt-1 uppercase tracking-widest">{t.ch}% chance to advance</span>
                          </div>
                          <div className="flex gap-1">
                            {[1, 2, 3].map(r => (
                              <button key={r} onClick={() => setStandings((p: any) => ({ ...p, [id]: { ...p[id], [r]: t.id } }))} className={`w-7 h-7 text-[10px] font-black rounded-lg transition ${standings[id]?.[r] === t.id ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-slate-100 text-slate-400'}`}>{r}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </section>

            {/* 2. AUTOMATIC YELLOW PANEL (Image 2 style) */}
            <section className="bg-amber-50 border-2 border-amber-200 p-10 rounded-[3rem] shadow-sm">
                <div className="flex justify-between items-center mb-8">
                   <h2 className="text-2xl font-black text-amber-900 uppercase italic tracking-tighter">8 Best 3rd-Place Teams</h2>
                   <div className="bg-emerald-500 text-white px-6 py-2 rounded-full font-black text-[10px] tracking-widest uppercase">{autoSelectedThirds.length}/8 QUALIFIED</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                   {Object.keys(GROUPS_DATA).map(gid => {
                      const t = getTeam(standings[gid]?.[3]);
                      if(!t) return null;
                      const isQual = autoSelectedThirds.some((x:any) => x.id === t.id);
                      return (
                        <div key={t.id} className={`p-6 rounded-[2rem] border-2 transition-all text-center flex flex-col items-center ${isQual ? 'bg-white border-blue-500 shadow-md scale-105' : 'bg-white/30 border-amber-100 opacity-40'}`}>
                           <p className="text-[7px] font-black text-amber-600 uppercase mb-2">Group {gid}</p>
                           <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-8 mb-2 shadow-sm" alt=""/>
                           <span className="text-[10px] font-black uppercase text-slate-800 truncate w-full">{t.n}</span>
                           <div className={`mt-3 flex items-center gap-1 text-[8px] font-black uppercase ${isQual ? 'text-blue-600' : 'text-slate-300'}`}>
                              {isQual && <Check size={8} strokeWidth={5}/>} {isQual ? 'Advancing' : 'Bench'}
                           </div>
                        </div>
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
                  <div className="w-64 p-8 bg-amber-50 border-2 border-amber-100 rounded-[3rem] shadow-sm text-center">
                     <h3 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-4 italic italic">3rd Place Match</h3>
                     <MatchBox m={BRACKET_MAPPING[30]} t1={resolveTeam('L101')} t2={resolveTeam('L102')} winner={bracketWinners['m103']} onPick={(w: any) => setBracketWinners((p: any) => ({ ...p, ['m103']: w }))} />
                  </div>
                  <div className="w-80 p-12 bg-white border-[8px] border-blue-600 rounded-[80px] text-center shadow-2xl scale-110 ring-8 ring-blue-50">
                     <Award size={64} className="text-blue-600 mx-auto mb-8 animate-bounce" />
                     <MatchBox m={BRACKET_MAPPING[31]} t1={resolveTeam('W101')} t2={resolveTeam('W102')} winner={bracketWinners['m104']} onPick={(w: any) => setBracketWinners((p: any) => ({ ...p, ['m104']: w }))} />
                     <div className="mt-8 border-t pt-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest italic">World Champion</p>
                        <div className="text-3xl font-black text-blue-600 italic uppercase truncate">{bracketWinners['m104']?.n || 'TBD'}</div>
                     </div>
                  </div>
               </div>
            </section>

            {/* 4. PLAYER HONORS */}
            <section className="bg-indigo-600 rounded-[4rem] p-12 text-white shadow-2xl">
                <h2 className="text-3xl font-black italic tracking-tighter mb-10 flex items-center gap-4 uppercase tracking-tighter"><Star className="text-yellow-400 fill-yellow-400"/> Player Honors (+5 pts each)</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   {[
                     { l: 'Golden Ball (MVP)', k: 'ball' }, { l: 'Golden Boot', k: 'boot' }, { l: 'Golden Gloves', k: 'gloves' }
                   ].map(a => (
                     <div key={a.k} className="bg-white/10 p-8 rounded-[2.5rem] border border-white/20">
                        <label className="text-[10px] font-black uppercase text-blue-100 tracking-widest block mb-4 italic">{a.l}</label>
                        <input type="text" className="w-full bg-transparent border-b-2 border-white/30 outline-none p-2 font-black text-xl placeholder:text-white/20 focus:border-white transition-all uppercase" placeholder="Player Name..." value={(awards as any)[a.k]} onChange={(e) => setAwards(p => ({ ...p, [a.k]: e.target.value }))} />
                     </div>
                   ))}
                </div>
            </section>
          </>
        ) : (
          <div className="max-w-2xl mx-auto bg-white p-12 rounded-[60px] shadow-2xl border border-slate-50 text-center ring-8 ring-blue-50">
             <Trophy size={48} className="mx-auto text-blue-600 mb-6" />
             <h2 className="text-3xl font-black mb-10 italic uppercase tracking-tighter text-slate-800 underline decoration-blue-500 decoration-8 underline-offset-8">Herd Standings</h2>
             <StandingsList />
          </div>
        )}
      </main>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60]">
         <button onClick={submitToDatabase} className="bg-slate-900 text-white px-16 py-4 rounded-3xl font-black shadow-2xl hover:scale-105 active:scale-95 transition flex items-center gap-3">
            <Save size={20}/> {isAdmin ? 'Update Official' : 'Lock Prediction'}
         </button>
      </div>
    </div>
  );
}

// HELPERS
function StandingsList() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => { supabase.from('submissions').select('*').order('points', { ascending: false }).then(({ data }) => data && setList(data)); }, []);
  return (
    <div className="space-y-4">
      {list.map((u, i) => (
        <div key={i} className="flex justify-between items-center p-8 bg-blue-50 rounded-[40px] border border-blue-100 shadow-sm transition-all hover:scale-[1.02]">
          <span className="font-bold flex items-center gap-8 text-2xl tracking-tight"><span className="text-blue-300 font-mono italic text-3xl">#{i+1}</span> {u.bracket_name}</span>
          <span className="font-black text-blue-600 text-2xl">{u.points} <span className="text-[12px] uppercase text-slate-400 font-mono">PTS</span></span>
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
    <div className="bg-white border border-slate-200 rounded-[1.8rem] overflow-hidden shadow-sm hover:shadow-md transition duration-300">
      {[t1, t2].map((t, i) => (
        <button key={i} disabled={t?.placeholder} onClick={() => onPick(t)} className={`w-full text-left p-4 flex justify-between items-center border-b last:border-0 border-slate-50 transition-all ${winner?.id === t?.id ? 'bg-blue-600 text-white font-black shadow-lg' : 'hover:bg-blue-50'}`}>
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