'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, Check, Award, LayoutGrid, Info, ShieldCheck, Save, LogOut, LogIn, UserCircle } from 'lucide-react';
import { GROUPS_DATA, BRACKET_MAPPING } from '../constants/teams';
import { supabase } from '../lib/supabase';

export default function HerdArena() {
  // UI and Lifecycle State
  const [hasMounted, setHasMounted] = useState(false);
  const [isEntryComplete, setIsEntryComplete] = useState(false);
  const [view, setView] = useState('bracket');
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Bracket State
  const [bracketName, setBracketName] = useState('');
  const [standings, setStandings] = useState<any>({});
  const [bracketWinners, setBracketWinners] = useState<any>({});

  // 1. SOLVE HYDRATION & INITIAL LOAD
  useEffect(() => {
    setHasMounted(true);

    // Check if name is already in LocalStorage
    const savedName = localStorage.getItem('herd_user_name');
    if (savedName) {
      setBracketName(savedName);
      setIsEntryComplete(true);
    }

    // Get Auth Session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  // 2. LOGIC ENGINE
  const getTeam = (id: string) => Object.values(GROUPS_DATA).flatMap((g: any) => g.teams).find((t: any) => t.id === id);

  const autoSelectedThirds = useMemo(() => {
    const thirds = Object.keys(GROUPS_DATA).map(gid => {
      const tId = standings[gid]?.[3];
      return tId ? getTeam(tId) : null;
    }).filter(Boolean);
    // Sort by FIFA Rank (Lowest number = better rank) and take top 8
    return thirds.sort((a: any, b: any) => a.r - b.r).slice(0, 8);
  }, [standings]);

  const resolveTeam = (slot: string) => {
    if (slot.startsWith('W')) return bracketWinners['m' + slot.substring(1)];
    
    // Logic for 3rd Place Match Losers
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

    // Direct Group Rank (A1, B2, etc.)
    const gId = slot[0]; 
    const rank = parseInt(slot.substring(1));
    const tId = standings[gId]?.[rank];
    return tId ? getTeam(tId) : { placeholder: `${rank === 1 ? 'Winner' : '2nd'} Group ${gId}` };
  };

  // 3. ACTIONS
  const handleJoin = () => {
    if (bracketName.trim().length < 2) return alert("Please enter your name to start.");
    localStorage.setItem('herd_user_name', bracketName);
    setIsEntryComplete(true);
  };

  const submitToDatabase = async () => {
    const table = isAdmin ? 'official_results' : 'submissions';
    const payload = {
      bracket_name: isAdmin ? 'OFFICIAL_RESULTS' : bracketName,
      user_id: user?.id || null,
      bracket_data: { standings, bracketWinners, thirds: autoSelectedThirds }
    };
    const { error } = await supabase.from(table).insert([payload]);
    if (error) alert(error.message);
    else alert(`Successfully saved to ${table}! Good luck, ${bracketName}!`);
  };

  if (!hasMounted) return null;

  // --- WELCOME SCREEN (SMART ENTRY) ---
  if (!isEntryComplete) {
    return (
      <div className="min-h-screen bg-blue-600 flex items-center justify-center p-6 text-white font-sans">
        <div className="bg-white p-12 rounded-[40px] shadow-2xl max-w-md w-full text-center text-slate-900 animate-in fade-in zoom-in duration-500">
          <div className="bg-blue-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Trophy size={40} className="text-blue-600" />
          </div>
          <h1 className="text-3xl font-black mb-2 tracking-tighter uppercase italic text-slate-800">Herd <span className="text-blue-600">Arena</span></h1>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-10">2026 World Cup Challenge</p>
          
          <div className="space-y-4 text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Enter Your Full Name</label>
            <input 
              type="text" 
              placeholder="e.g. Shirish Maharjan"
              className="w-full p-5 rounded-[1.5rem] border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-lg"
              value={bracketName}
              onChange={(e) => setBracketName(e.target.value)}
            />
            <button 
              onClick={handleJoin}
              className="w-full bg-blue-600 text-white p-5 rounded-[1.5rem] font-black shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              START MY PREDICTION <ArrowRight size={20} />
            </button>
          </div>
          <p className="mt-8 text-xs text-slate-300 font-medium italic">Compete with 60 colleagues at Herd International</p>
        </div>
      </div>
    );
  }

  // --- MAIN APP UI ---
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-40">
      <nav className="bg-white border-b border-slate-100 px-10 py-5 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-100"><Trophy size={20} /></div>
          <h1 className="text-xl font-black tracking-tight">HERD <span className="text-blue-600 italic uppercase">Arena</span></h1>
        </div>
        <div className="flex gap-4 items-center">
           <div className="flex bg-slate-100 p-1 rounded-xl">
             <button onClick={() => setView('bracket')} className={`px-5 py-2 rounded-xl text-[10px] font-black transition ${view === 'bracket' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>BRACKET</button>
             <button onClick={() => setView('leaderboard')} className={`px-5 py-2 rounded-xl text-[10px] font-black transition ${view === 'leaderboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>LEADERBOARD</button>
           </div>
           <button onClick={() => {const p = prompt("Admin Pass?"); if(p==="herd2026") setIsAdmin(!isAdmin)}} className={`p-2 rounded-lg ${isAdmin ? 'text-blue-600 bg-blue-50' : 'text-slate-200 hover:text-blue-400'}`}><ShieldCheck size={18}/></button>
        </div>
      </nav>

      <main className="max-w-[1900px] mx-auto p-10 space-y-20">
        {view === 'bracket' ? (
          <>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-800 rounded-[50px] p-12 text-white shadow-2xl shadow-blue-100 flex justify-between items-center">
               <div>
                  <h2 className="text-5xl font-black italic tracking-tighter mb-2 underline decoration-blue-300 decoration-4 underline-offset-8 uppercase">Good Luck, {bracketName}!</h2>
                  <p className="text-blue-100 font-medium italic">8 best 3rd-place teams automatically chosen by FIFA Rank.</p>
                  <button onClick={() => setIsEntryComplete(false)} className="mt-4 text-[10px] font-black uppercase text-blue-200 hover:text-white transition flex items-center gap-2">Not you? Change Name</button>
               </div>
               <div className="bg-white/20 px-8 py-3 rounded-3xl border border-white/30 text-[10px] font-black uppercase tracking-widest">Predicting</div>
            </div>

            {/* 1. GROUPS */}
            <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Object.entries(GROUPS_DATA).map(([id, g]: any) => (
                  <div key={id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest italic font-mono">Group {id}</h3>
                    <div className="space-y-4">
                      {g.teams.map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between">
                          <span className="text-sm font-bold flex items-center gap-3">
                             <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-5 h-3.5 object-cover rounded shadow-sm border border-slate-100" alt=""/> 
                             {t.n}
                          </span>
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
            </section>

            {/* 2. AUTO-THIRDS PREVIEW */}
            <div className="bg-blue-50 border-2 border-dashed border-blue-200 p-8 rounded-[40px] flex items-center gap-6">
                <div className="bg-white p-4 rounded-3xl text-blue-600 shadow-sm"><Info /></div>
                <div className="flex-1">
                   <h4 className="font-black text-blue-900 uppercase text-[10px] tracking-widest mb-3 italic">System Logic: Top 8 Third-Place Teams (FIFA Rank)</h4>
                   <div className="flex gap-2 flex-wrap">
                      {autoSelectedThirds.map(t => <span key={t.id} className="bg-white px-3 py-1 rounded-lg text-[10px] font-bold shadow-sm border border-blue-100 flex items-center gap-2 animate-in fade-in zoom-in duration-300"><img src={`https://flagcdn.com/w20/${t.c}.png`} className="w-3" alt=""/> {t.n}</span>)}
                      {autoSelectedThirds.length === 0 && <p className="text-blue-300 text-[10px] uppercase font-bold italic">Select rank 3 teams in the groups to populate...</p>}
                   </div>
                </div>
            </div>

            {/* 3. THE BRACKET */}
            <section className="flex gap-10 overflow-x-auto pb-20 no-scrollbar items-start">
               <BracketCol label="R32" slice={[0, 16]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} />
               <BracketCol label="R16" slice={[16, 24]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-24 pt-16" />
               <BracketCol label="Quarters" slice={[24, 28]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-[310px] pt-44" />
               <BracketCol label="Semis" slice={[28, 30]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-[640px] pt-[280px]" />
               
               <div className="flex-shrink-0 pt-[450px] space-y-40">
                  <div className="w-64 p-6 bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-[40px]">
                     <p className="text-[9px] font-black text-blue-600 text-center mb-4 uppercase tracking-[0.3em]">3rd Place Play-off</p>
                     <MatchBox m={BRACKET_MAPPING[30]} t1={resolveTeam('L101')} t2={resolveTeam('L102')} winner={bracketWinners['m103']} onPick={(w: any) => setBracketWinners((p: any) => ({ ...p, ['m103']: w }))} />
                  </div>
                  <div className="w-80 p-12 bg-white border-[6px] border-blue-600 rounded-[80px] text-center shadow-2xl scale-110 ring-8 ring-blue-50">
                     <Award size={64} className="text-blue-600 mx-auto mb-8 animate-pulse" />
                     <MatchBox m={BRACKET_MAPPING[31]} t1={resolveTeam('W101')} t2={resolveTeam('W102')} winner={bracketWinners['m104']} onPick={(w: any) => setBracketWinners((p: any) => ({ ...p, ['m104']: w }))} />
                     <div className="mt-8 border-t pt-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Grand Champion</p>
                        <div className="text-3xl font-black text-blue-600 italic uppercase truncate tracking-tight">{bracketWinners['m104']?.n || 'READY TO CROWN'}</div>
                     </div>
                  </div>
               </div>
            </section>
          </>
        ) : (
          <div className="max-w-2xl mx-auto bg-white p-12 rounded-[60px] shadow-2xl border border-slate-50 text-center">
             <Trophy size={48} className="mx-auto text-blue-600 mb-6" />
             <h2 className="text-4xl font-black mb-10 italic uppercase tracking-tighter text-slate-800">Office Standings</h2>
             <div className="space-y-4">
                <div className="flex justify-between items-center p-8 bg-blue-50 rounded-[40px] border border-blue-100 shadow-sm">
                    <span className="font-bold flex items-center gap-6 text-xl"><span className="text-blue-300 font-mono italic text-2xl">#1</span> {bracketName}</span>
                    <span className="font-black text-blue-600 text-3xl">0 <span className="text-[12px] uppercase text-slate-400 ml-1 font-mono">pts</span></span>
                </div>
             </div>
             <p className="mt-10 text-slate-400 text-xs italic">Live updates coming soon as real matches begin!</p>
          </div>
        )}
      </main>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60]">
         <button onClick={submitToDatabase} className="bg-slate-900 text-white px-20 py-5 rounded-[2.5rem] font-black shadow-[0_30px_70px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 tracking-[0.2em] uppercase text-[11px]">
            <Save size={18}/> {isAdmin ? 'Save Official Results' : 'Submit Bracket'}
         </button>
      </div>
    </div>
  );
}

// SHARED COMPONENTS
function BracketCol({ label, slice, resolve, winners, setWinners, spacing = "space-y-4" }: any) {
  return (
    <div className={`w-64 flex-shrink-0 ${spacing}`}>
      <h4 className="text-[10px] font-black text-slate-400 uppercase text-center mb-6 tracking-[0.4em]">{label}</h4>
      {BRACKET_MAPPING.slice(slice[0], slice[1]).map(m => (
        <MatchBox key={m.id} m={m} t1={resolve(m.t1)} t2={resolve(m.t2)} winner={winners[m.id]} onPick={(w: any) => setWinners((p: any) => ({ ...p, [m.id]: w }))} />
      ))}
    </div>
  );
}

function MatchBox({ t1, t2, winner, onPick }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group">
      {[t1, t2].map((t, i) => (
        <button key={i} disabled={t?.placeholder} onClick={() => onPick(t)} className={`w-full text-left p-4 flex justify-between items-center border-b last:border-0 border-slate-50 transition-all ${winner?.id === t?.id ? 'bg-blue-600 text-white font-bold' : 'hover:bg-blue-50'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            {t?.c ? <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-5 h-3.5 object-cover rounded shadow-sm" alt="" /> : <div className="w-5 h-3.5 bg-slate-100 rounded-sm" />}
            <span className={`text-[10px] font-black uppercase tracking-tight truncate ${t?.placeholder ? 'text-slate-300 italic font-medium' : 'text-slate-800'}`}>{t?.n || t?.placeholder}</span>
          </div>
          {winner?.id === t?.id && <Check size={16} strokeWidth={4} />}
        </button>
      ))}
    </div>
  );
}