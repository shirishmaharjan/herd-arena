'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, Check, Award, LayoutGrid, Info, ShieldCheck, Save, ArrowRight, Database, Star, AlertCircle, UserCircle, LogOut } from 'lucide-react';
import { GROUPS_DATA, BRACKET_MAPPING } from '../constants/teams';
import { supabase } from '../lib/supabase';

export default function HerdArenaPro() {
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
        if (!winner || !match) return { placeholder: `Semi-Final ${slot === 'L101' ? '1' : '2'} Loser` };
        const t1 = resolveTeam(match.t1); const t2 = resolveTeam(match.t2);
        return winner.id === t1?.id ? t2 : t1;
    }
    if (slot.startsWith('3RD')) {
        const idx = parseInt(slot.split('-')[1]) - 1;
        const t = autoSelectedThirds[idx];
        return t ? { ...t, label: '3rd Place' } : { placeholder: `Slot ${idx + 1}` };
    }
    const gId = slot[0]; const rank = parseInt(slot.substring(1));
    const tId = standings[gId]?.[rank];
    return tId ? getTeam(tId) : { placeholder: `${rank === 1 ? 'Winner' : '2nd'} Gr. ${gId}` };
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

  // --- PREMIUM WELCOME SCREEN ---
  if (!isEntryComplete) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-6 font-sans overflow-hidden bg-[#0A1128]">
        
        {/* CINEMATIC BACKGROUND */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[40000ms] scale-110 motion-safe:animate-[pulse_10s_infinite]" 
            style={{ 
              backgroundImage: "url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000')", 
              filter: 'brightness(0.3) saturate(1.2) blur(2px)' 
            }} 
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0275C8]/40 via-transparent to-black/80" />
        </div>

        {/* LOGO HEADER */}
        <div className="absolute top-12 left-12 z-20 hidden md:flex items-center gap-4">
            <div className="w-12 h-12 bg-[#0275C8] rounded-xl flex items-center justify-center shadow-lg shadow-[#0275C8]/20">
               <Trophy className="text-white" size={24} />
            </div>
            <div>
               <h2 className="text-white font-black text-xl tracking-tighter uppercase leading-none">Herd International</h2>
               <p className="text-[#0275C8] text-[10px] font-bold tracking-[0.4em] uppercase mt-1">IT Internal Portal</p>
            </div>
        </div>

        {/* MAIN EXECUTIVE CARD */}
        <div className="relative z-10 bg-white/10 backdrop-blur-3xl rounded-[40px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] max-w-5xl w-full flex flex-col md:flex-row overflow-hidden border border-white/10">
          
          {/* LEFT: RULES DASHBOARD */}
          <div className="bg-[#0A1128]/80 p-12 text-white md:w-1/2 border-r border-white/5 relative overflow-hidden">
             <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#0275C8]/10 blur-[100px] rounded-full" />
             
             <h2 className="text-4xl font-black italic tracking-tighter mb-12 uppercase leading-none">
                Arena <span className="text-[#0275C8]">Rules</span>
             </h2>
             
             <div className="grid grid-cols-1 gap-8 relative z-10">
                {[
                    { icon: <LayoutGrid size={18}/>, label: 'Group Stage', desc: '+2 Points per correct rank (1,2,3)', color: 'bg-blue-500' },
                    { icon: <Check size={18}/>, label: 'Knockout Stage', desc: '+5 Points per correct match winner', color: 'bg-indigo-500' },
                    { icon: <Award size={18}/>, label: 'Championship', desc: '+10 Points for 3rd, +20 for Final Winner', color: 'bg-amber-500' },
                    { icon: <Star size={18}/>, label: 'Performance Awards', desc: '+5 Points per correct Golden Honor', color: 'bg-emerald-500' }
                ].map((item, idx) => (
                    <div key={idx} className="flex gap-5 items-center group cursor-default">
                        <div className={`${item.color} p-3 rounded-2xl shadow-lg transition-transform group-hover:scale-110`}>{item.icon}</div>
                        <div>
                           <p className="font-bold text-sm tracking-tight text-white/90">{item.label}</p>
                           <p className="text-white/40 text-xs mt-0.5">{item.desc}</p>
                        </div>
                    </div>
                ))}
             </div>

             <div className="mt-16 pt-8 border-t border-white/10 flex gap-4 items-center opacity-60">
                <AlertCircle size={20} className="text-red-500" />
                <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                   One entry per colleague. Multiple submissions lead to DQ.
                </p>
             </div>
          </div>

          {/* RIGHT: JOIN PANEL */}
          <div className="p-16 md:w-1/2 flex flex-col justify-center items-center text-center bg-white relative">
             <div className="mb-12">
                <div className="inline-block p-4 bg-slate-50 rounded-[2rem] mb-6 shadow-inner border border-slate-100">
                    <Trophy size={48} className="text-[#0275C8] drop-shadow-md" />
                </div>
                <h1 className="text-5xl font-black mb-1 italic tracking-tighter text-slate-900 uppercase">Herd <span className="text-[#0275C8]">Arena</span></h1>
                <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.5em] mt-3">2026 Prediction Portal</p>
             </div>
             
             <div className="space-y-6 w-full max-w-sm">
                <div className="relative group">
                  <UserCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0275C8] transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="Enter Full Legal Name" 
                    className="w-full pl-14 pr-6 py-5 rounded-[2rem] border-2 border-slate-100 bg-slate-50 outline-none font-bold text-md focus:bg-white focus:border-[#0275C8] transition-all shadow-sm placeholder:text-slate-300" 
                    value={bracketName} 
                    onChange={(e) => setBracketName(e.target.value)} 
                  />
                </div>
                <button 
                  onClick={handleJoin} 
                  className="w-full bg-[#0275C8] text-white p-6 rounded-[2rem] font-black shadow-[0_20px_50px_-10px_rgba(2,117,200,0.5)] hover:bg-[#015da1] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 text-xs tracking-[0.3em] uppercase"
                >
                  Join Competition <ArrowRight size={20}/>
                </button>
             </div>
             <p className="mt-16 text-[9px] text-slate-300 font-bold uppercase tracking-widest italic leading-loose">© 2024 Herd International Group</p>
          </div>
        </div>
      </div>
    );
  }

  // --- THE MASTER DASHBOARD (Main App) ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-40">
      
      {/* PROFESSIONAL NAV */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-12 py-5 sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#0275C8] rounded-lg flex items-center justify-center shadow-lg shadow-[#0275C8]/10"><Trophy size={18} className="text-white" /></div>
          <h1 className="text-lg font-black tracking-tighter uppercase italic">Herd <span className="text-[#0275C8]">Arena</span></h1>
        </div>
        <div className="flex gap-6 items-center">
           <div className="flex bg-slate-100 p-1.5 rounded-2xl">
             <button onClick={() => setView('bracket')} className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${view === 'bracket' ? 'bg-white shadow-sm text-[#0275C8]' : 'text-slate-400 hover:text-slate-600'}`}>THE BRACKET</button>
             <button onClick={() => setView('leaderboard')} className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${view === 'leaderboard' ? 'bg-white shadow-sm text-[#0275C8]' : 'text-slate-400 hover:text-slate-600'}`}>OFFICE STANDINGS</button>
           </div>
           <button onClick={() => { localStorage.removeItem('herd_user_name'); window.location.reload(); }} className="text-slate-300 hover:text-red-500 transition-colors p-2"><LogOut size={18}/></button>
        </div>
      </nav>

      <main className="max-w-[1900px] mx-auto p-12 space-y-24">
        {view === 'bracket' ? (
          <>
            {/* BRANDED HERO BANNER */}
            <div className="bg-slate-900 rounded-[50px] p-16 text-white shadow-2xl relative overflow-hidden flex justify-between items-center group">
               <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#0275C8]/20 to-transparent" />
               <div className="relative z-10">
                  <p className="text-[#0275C8] font-black text-xs uppercase tracking-[0.5em] mb-4">Official Submission Portal</p>
                  <h2 className="text-6xl font-black italic tracking-tighter uppercase tracking-tight">Good Luck, {bracketName.split(' ')[0]}!</h2>
                  <p className="text-slate-400 font-medium text-lg mt-4 italic opacity-80 max-w-xl leading-relaxed">
                    Welcome to the Herd International World Cup Arena. Your group stage choices will dictate the flow of the entire 2026 bracket.
                  </p>
               </div>
               <div className="bg-[#0275C8] px-12 py-5 rounded-3xl text-center shadow-[0_15px_40px_rgba(2,117,200,0.3)]">
                  <p className="text-[10px] font-black uppercase opacity-70 mb-1">Status</p>
                  <p className="font-bold text-2xl tracking-tighter uppercase italic">Predicting</p>
               </div>
            </div>

            {/* 1. GROUPS SECTION */}
            <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {Object.entries(GROUPS_DATA).map(([id, g]: any) => (
                  <div key={id} className="bg-white border border-slate-100 rounded-[3rem] p-8 shadow-sm hover:shadow-xl transition-all duration-500">
                    <h3 className="text-[11px] font-black text-slate-300 uppercase mb-6 tracking-[0.3em] text-center font-mono">Group Stage {id}</h3>
                    <div className="space-y-6">
                      {g.teams.map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between group">
                          <div className="flex flex-col">
                             <div className="flex items-center gap-3">
                                <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-5 h-3.5 object-cover rounded shadow-sm grayscale-[0.2] group-hover:grayscale-0 transition-all" alt=""/> 
                                <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{t.n}</span>
                             </div>
                             <span className="text-[8px] font-bold text-slate-300 mt-1 uppercase tracking-widest">{t.ch}% qualification odds</span>
                          </div>
                          <div className="flex gap-1">
                            {[1, 2, 3].map(r => (
                              <button key={r} onClick={() => setStandings((p: any) => ({ ...p, [id]: { ...p[id], [r]: t.id } }))} className={`w-8 h-8 text-[11px] font-black rounded-xl transition-all ${standings[id]?.[r] === t.id ? 'bg-[#0275C8] text-white shadow-lg shadow-[#0275C8]/30 scale-110' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'}`}>{r}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </section>

            {/* 2. AUTOMATIC THIRD-PLACE ENGINE */}
            <section className="bg-amber-50/50 border border-amber-100 p-12 rounded-[4rem] relative overflow-hidden shadow-sm">
                <Trophy size={300} className="absolute -right-20 -top-20 text-amber-500/5 rotate-12" />
                <div className="flex justify-between items-center mb-10 relative z-10">
                   <div>
                      <h2 className="text-3xl font-black text-amber-900 uppercase italic tracking-tighter">Automatic FIFA Qualification Logic</h2>
                      <p className="text-amber-700/60 text-xs font-bold uppercase mt-2 tracking-widest italic leading-relaxed max-w-2xl">
                         The top 8 teams sitting at rank #3 across all 12 groups are automatically selected based on FIFA World Ranking to complete the Round of 32.
                      </p>
                   </div>
                   <div className="bg-white border-2 border-amber-200 text-amber-900 px-10 py-3 rounded-full font-black text-sm tracking-widest shadow-sm">{autoSelectedThirds.length}/8 SLOTS FILLED</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 relative z-10">
                   {Object.keys(GROUPS_DATA).map(gid => {
                      const t = getTeam(standings[gid]?.[3]);
                      if(!t) return null;
                      const isQual = autoSelectedThirds.some((x:any) => x.id === t.id);
                      return (
                        <div key={t.id} className={`p-6 rounded-[2.5rem] border-2 transition-all text-center flex flex-col items-center ${isQual ? 'bg-white border-[#0275C8] shadow-xl scale-105' : 'bg-white/20 border-amber-100/50 opacity-40'}`}>
                           <p className="text-[8px] font-black text-amber-600 uppercase mb-2">3rd Gr. {gid}</p>
                           <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-8 mb-3 shadow-sm border border-slate-100" alt=""/>
                           <span className="text-[11px] font-black uppercase text-slate-800 truncate w-full">{t.n}</span>
                           <div className={`mt-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-tighter ${isQual ? 'text-[#0275C8]' : 'text-slate-300'}`}>
                              {isQual ? <Check size={10} strokeWidth={5}/> : null} {isQual ? 'Qualified' : 'Waitlist'}
                           </div>
                        </div>
                      );
                   })}
                </div>
            </section>

            {/* 3. BRACKET SECTION */}
            <section className="flex gap-12 overflow-x-auto pb-24 no-scrollbar items-start">
               <BracketCol label="Round of 32" slice={[0, 16]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} />
               <BracketCol label="Round of 16" slice={[16, 24]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-32 pt-20" />
               <BracketCol label="Quarter Finals" slice={[24, 28]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-[380px] pt-[220px]" />
               <BracketCol label="Semi Finals" slice={[28, 30]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-[780px] pt-[400px]" />
               
               <div className="flex-shrink-0 pt-[650px] space-y-64">
                  {/* 3rd PLACE MATCH */}
                  <div className="w-64 p-8 bg-slate-50 border border-slate-100 rounded-[3rem] shadow-inner text-center">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 italic">Bronze Play-Off</h3>
                     <MatchBox m={BRACKET_MAPPING[30]} t1={resolveTeam('L101')} t2={resolveTeam('L102')} winner={bracketWinners['m103']} onPick={(w: any) => setBracketWinners((p: any) => ({ ...p, ['m103']: w }))} />
                  </div>
                  {/* GRAND FINAL */}
                  <div className="w-80 p-12 bg-white border-[10px] border-[#0275C8] rounded-[6rem] text-center shadow-2xl scale-110 ring-[15px] ring-blue-50 relative overflow-hidden group hover:scale-[1.15] transition-transform duration-700">
                     <Award size={80} className="text-[#0275C8] mx-auto mb-10 animate-pulse" />
                     <MatchBox m={BRACKET_MAPPING[31]} t1={resolveTeam('W101')} t2={resolveTeam('W102')} winner={bracketWinners['m104']} onPick={(w: any) => setBracketWinners((p: any) => ({ ...p, ['m104']: w }))} />
                     <div className="mt-12 border-t border-slate-100 pt-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-[0.3em] italic">World Champion</p>
                        <div className="text-4xl font-black text-[#0275C8] italic uppercase truncate tracking-tighter drop-shadow-sm leading-none">{bracketWinners['m104']?.n || 'READY'}</div>
                     </div>
                  </div>
               </div>
            </section>

            {/* 4. EXECUTIVE AWARDS */}
            <section className="bg-slate-900 rounded-[4rem] p-16 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#0275C8]/10 blur-[150px] rounded-full -mr-48 -mt-48" />
                <h2 className="text-4xl font-black italic tracking-tighter mb-12 flex items-center gap-6 uppercase"><Star className="text-yellow-400 fill-yellow-400" size={32}/> Individual Player Awards (+5 pts)</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                   {[
                     { l: 'Golden Ball (MVP)', k: 'ball', d: 'Tournament Best Player' }, 
                     { l: 'Golden Boot', k: 'boot', d: 'Tournament Top Scorer' }, 
                     { l: 'Golden Gloves', k: 'gloves', d: 'Tournament Best Keeper' }
                   ].map(a => (
                     <div key={a.k} className="bg-white/5 p-10 rounded-[3rem] border border-white/10 group hover:bg-white/10 transition-all">
                        <label className="text-[11px] font-black uppercase text-[#0275C8] tracking-widest block mb-1 italic">{a.l}</label>
                        <p className="text-[10px] text-white/30 font-bold mb-8 uppercase tracking-tighter">{a.d}</p>
                        <input type="text" className="w-full bg-transparent border-b-2 border-white/20 outline-none p-2 font-black text-2xl placeholder:text-white/10 focus:border-white transition-all uppercase tracking-tighter" placeholder="Name..." value={(awards as any)[a.k]} onChange={(e) => setAwards(p => ({ ...p, [a.k]: e.target.value }))} />
                     </div>
                   ))}
                </div>
            </section>
          </>
        ) : (
          <div className="max-w-3xl mx-auto bg-white p-20 rounded-[80px] shadow-[0_50px_100px_rgba(0,0,0,0.05)] border border-slate-50 text-center ring-1 ring-slate-100">
             <Trophy size={80} className="mx-auto text-[#0275C8] mb-10 animate-bounce" />
             <h2 className="text-5xl font-black mb-16 italic uppercase tracking-tighter text-slate-800 underline decoration-[#0275C8] decoration-[15px] underline-offset-[20px]">Executive Leaderboard</h2>
             <LeaderboardDisplay />
          </div>
        )}
      </main>

      {/* FLOATING SUBMIT SYSTEM */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-6">
         {isAdmin && <button onClick={recalculateScores} className="bg-emerald-600 text-white px-12 py-4 rounded-full font-black shadow-xl hover:scale-105 transition-all flex items-center gap-4 text-xs uppercase border-4 border-white tracking-widest"><Database size={20}/> Calculate Points</button>}
         <button onClick={submitToDatabase} className="bg-[#0A1128] text-white px-28 py-8 rounded-[3rem] font-black shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] hover:bg-black hover:scale-105 active:scale-95 transition-all flex items-center gap-5 tracking-[0.4em] uppercase text-[12px] border border-white/10">
            <Save size={24} strokeWidth={3}/> {isAdmin ? 'Update Master Results' : 'Seal My Prediction'}
         </button>
      </div>
    </div>
  );
}

// HELPERS
function LeaderboardDisplay() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => { supabase.from('submissions').select('*').order('points', { ascending: false }).then(({ data }) => data && setList(data)); }, []);
  return (
    <div className="space-y-6">
      {list.map((u, i) => (
        <div key={i} className={`flex justify-between items-center p-10 rounded-[50px] border transition-all hover:shadow-xl hover:-translate-y-1 ${i === 0 ? 'bg-[#0275C8] text-white border-[#0275C8]' : 'bg-slate-50 border-slate-100 text-slate-800'}`}>
          <div className="flex items-center gap-10">
             <span className={`text-4xl font-black italic font-mono opacity-20 ${i === 0 ? 'text-white' : ''}`}>#{i+1}</span> 
             <span className="font-black text-3xl tracking-tighter uppercase italic">{u.bracket_name}</span>
          </div>
          <div className="text-right">
             <span className={`block font-black text-4xl leading-none ${i === 0 ? 'text-white' : 'text-[#0275C8]'}`}>{u.points}</span>
             <span className={`block text-[10px] font-black uppercase tracking-widest mt-2 ${i === 0 ? 'text-white/50' : 'text-slate-300'}`}>Arena Points</span>
          </div>
        </div>
      ))}
      {list.length === 0 && <p className="text-slate-300 font-black uppercase tracking-widest text-xl italic py-20">Waiting for first submission...</p>}
    </div>
  );
}

function BracketCol({ label, slice, resolve, winners, setWinners, spacing = "space-y-6" }: any) {
  return (
    <div className={`w-72 flex-shrink-0 ${spacing}`}>
      <h4 className="text-[11px] font-black text-slate-400 uppercase text-center mb-10 tracking-[0.5em] italic">{label}</h4>
      {BRACKET_MAPPING.slice(slice[0], slice[1]).map(m => (
        <MatchBox key={m.id} m={m} t1={resolve(m.t1)} t2={resolve(m.t2)} winner={winners[m.id]} onPick={(w: any) => setWinners((p: any) => ({ ...p, [m.id]: w }))} />
      ))}
    </div>
  );
}

function MatchBox({ t1, t2, winner, onPick }: any) {
  return (
    <div className="bg-white border border-slate-100 rounded-[2.2rem] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-2xl hover:border-[#0275C8]/20 transition-all duration-500 group">
      {[t1, t2].map((t, i) => (
        <button key={i} disabled={t?.placeholder} onClick={() => onPick(t)} className={`w-full text-left p-5 flex justify-between items-center border-b last:border-0 border-slate-50 transition-all duration-300 ${winner?.id === t?.id ? 'bg-[#0275C8] text-white font-black shadow-lg z-10' : 'hover:bg-slate-50'}`}>
          <div className="flex items-center gap-4 overflow-hidden">
            {t?.c ? <img src={`https://flagcdn.com/w40/${t.c}.png`} className={`w-6 h-4 object-cover rounded shadow-sm transition-all ${winner?.id === t?.id ? 'brightness-125' : 'grayscale-[0.3]'}`} alt="" /> : <div className="w-6 h-4 bg-slate-100 rounded shadow-inner" />}
            <span className={`text-[12px] font-black uppercase tracking-tight truncate ${t?.placeholder ? 'text-slate-300 italic font-medium' : winner?.id === t?.id ? 'text-white' : 'text-slate-700'}`}>{t?.n || t?.placeholder}</span>
          </div>
          {winner?.id === t?.id && <Check size={18} strokeWidth={6} className="text-white" />}
        </button>
      ))}
    </div>
  );
}