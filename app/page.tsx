'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, Check, Award, LayoutGrid, Info, ShieldCheck, Save, ArrowRight } from 'lucide-react';
import { GROUPS_DATA, BRACKET_MAPPING } from '../constants/teams';
import { supabase } from '../lib/supabase';

export default function HerdArena() {
  const [hasMounted, setHasMounted] = useState(false);
  const [isEntryComplete, setIsEntryComplete] = useState(false);
  const [view, setView] = useState('bracket');
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [bracketName, setBracketName] = useState('');
  const [standings, setStandings] = useState<any>({});
  const [bracketWinners, setBracketWinners] = useState<any>({});

  useEffect(() => {
    setHasMounted(true);
    const savedName = typeof window !== 'undefined' ? localStorage.getItem('herd_user_name') : null;
    if (savedName) {
      setBracketName(savedName);
      setIsEntryComplete(true);
    }
  }, []);

  const getTeam = (id: string) => Object.values(GROUPS_DATA).flatMap((g: any) => g.teams).find((t: any) => t.id === id);

  const autoSelectedThirds = useMemo(() => {
    const thirds = Object.keys(GROUPS_DATA).map(gid => {
      const tId = standings[gid]?.[3];
      return tId ? getTeam(tId) : null;
    }).filter(Boolean);
    return thirds.sort((a: any, b: any) => a.r - b.r).slice(0, 8);
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
      bracket_data: { standings, bracketWinners, thirds: autoSelectedThirds }
    };
    const { error } = await supabase.from(table).insert([payload]);
    if (error) alert("Error: " + error.message);
    else alert(`Saved! Good luck, ${bracketName}!`);
  };

  if (!hasMounted) return null;

  if (!isEntryComplete) {
    return (
      <div className="min-h-screen bg-blue-600 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center">
          <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
            <Trophy size={32} />
          </div>
          <h1 className="text-2xl font-black uppercase italic text-slate-800">Herd Arena</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">2026 World Cup Challenge</p>
          <div className="space-y-4 text-left">
            <input 
              type="text" 
              placeholder="Your Full Name"
              className="w-full p-4 rounded-2xl border-2 border-slate-100 outline-none font-bold"
              value={bracketName}
              onChange={(e) => setBracketName(e.target.value)}
            />
            <button onClick={handleJoin} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black flex items-center justify-center gap-2">
              ENTER ARENA <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-40">
      <nav className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white"><Trophy size={16} /></div>
          <h1 className="font-black text-lg uppercase italic">Herd <span className="text-blue-600">Arena</span></h1>
        </div>
        <div className="flex gap-2">
             <button onClick={() => setView('bracket')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition ${view === 'bracket' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>BRACKET</button>
             <button onClick={() => setView('leaderboard')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition ${view === 'leaderboard' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>LEADERBOARD</button>
             <button onClick={() => {const p = prompt("Admin Pass?"); if(p==="herd2026") setIsAdmin(!isAdmin)}} className="text-slate-200"><ShieldCheck size={16}/></button>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-6 space-y-12">
        {view === 'bracket' ? (
          <>
            <div className="bg-blue-600 rounded-[3rem] p-10 text-white flex justify-between items-center shadow-xl">
               <div>
                  <h2 className="text-4xl font-black italic tracking-tighter mb-1 uppercase underline decoration-blue-300 underline-offset-4">Good Luck, {bracketName}!</h2>
                  <p className="text-blue-100 text-xs font-medium italic opacity-80">8 best 3rd-place teams automatically chosen by FIFA Rank.</p>
               </div>
               <button onClick={() => {localStorage.removeItem('herd_user_name'); window.location.reload();}} className="text-[10px] font-bold border border-white/20 px-3 py-1 rounded-full hover:bg-white/10 transition">Change Name</button>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(GROUPS_DATA).map(([id, g]: any) => (
                  <div key={id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase mb-3 italic">Group {id}</h3>
                    <div className="space-y-3">
                      {g.teams.map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between">
                          <span className="text-xs font-bold flex items-center gap-2">
                             <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-4 h-3 object-cover rounded shadow-sm" alt=""/> {t.n}
                          </span>
                          <div className="flex gap-1">
                            {[1, 2, 3].map(r => (
                              <button key={r} onClick={() => setStandings((p: any) => ({ ...p, [id]: { ...p[id], [r]: t.id } }))} className={`w-6 h-6 text-[10px] font-black rounded-md transition ${standings[id]?.[r] === t.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>{r}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </section>

            <section className="flex gap-8 overflow-x-auto pb-10 items-start">
               <BracketCol label="R32" slice={[0, 16]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} />
               <BracketCol label="R16" slice={[16, 24]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-24 pt-16" />
               <BracketCol label="Quarters" slice={[24, 28]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-[310px] pt-44" />
               <BracketCol label="Semis" slice={[28, 30]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-[640px] pt-[280px]" />
               
               <div className="flex-shrink-0 pt-[450px] space-y-40 text-center">
                  <div className="w-80 p-10 bg-white border-4 border-blue-600 rounded-[4rem] shadow-2xl scale-110">
                     <Award size={48} className="text-blue-600 mx-auto mb-6" />
                     <MatchBox m={BRACKET_MAPPING[31]} t1={resolveTeam('W101')} t2={resolveTeam('W102')} winner={bracketWinners['m104']} onPick={(w: any) => setBracketWinners((p: any) => ({ ...p, ['m104']: w }))} />
                     <div className="mt-6 border-t pt-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Champion</p>
                        <div className="text-xl font-black text-blue-600 italic uppercase truncate">{bracketWinners['m104']?.n || 'TBD'}</div>
                     </div>
                  </div>
               </div>
            </section>
          </>
        ) : (
          <div className="max-w-xl mx-auto bg-white p-10 rounded-[3rem] shadow-xl text-center">
             <Trophy size={40} className="mx-auto text-blue-600 mb-4" />
             <h2 className="text-2xl font-black italic uppercase tracking-tighter">Office Standings</h2>
             <div className="mt-8 space-y-3">
                <div className="flex justify-between items-center p-5 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm">
                    <span className="font-bold flex items-center gap-4"><span className="text-blue-300 font-mono italic">#1</span> {bracketName}</span>
                    <span className="font-black text-blue-600">0 pts</span>
                </div>
             </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60]">
         <button onClick={submitToDatabase} className="bg-slate-900 text-white px-12 py-4 rounded-full font-black shadow-2xl hover:scale-105 active:scale-95 transition flex items-center gap-3 uppercase text-[10px] tracking-widest">
            <Save size={16}/> {isAdmin ? 'Save Official Score' : 'Submit Bracket'}
         </button>
      </div>
    </div>
  );
}

function BracketCol({ label, slice, resolve, winners, setWinners, spacing = "space-y-4" }: any) {
  return (
    <div className={`w-56 flex-shrink-0 ${spacing}`}>
      <h4 className="text-[10px] font-black text-slate-400 uppercase text-center mb-4 tracking-widest">{label}</h4>
      {BRACKET_MAPPING.slice(slice[0], slice[1]).map(m => (
        <MatchBox key={m.id} m={m} t1={resolve(m.t1)} t2={resolve(m.t2)} winner={winners[m.id]} onPick={(w: any) => setWinners((p: any) => ({ ...p, [m.id]: w }))} />
      ))}
    </div>
  );
}

function MatchBox({ t1, t2, winner, onPick }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {[t1, t2].map((t, i) => (
        <button key={i} disabled={t?.placeholder} onClick={() => onPick(t)} className={`w-full text-left p-3 flex justify-between items-center border-b last:border-0 border-slate-50 transition-all ${winner?.id === t?.id ? 'bg-blue-600 text-white font-bold' : 'hover:bg-blue-50'}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            {t?.c ? <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-4 h-3 object-cover rounded-sm" alt="" /> : <div className="w-4 h-3 bg-slate-100 rounded-sm" />}
            <span className={`text-[9px] font-black uppercase truncate ${t?.placeholder ? 'text-slate-300 italic' : 'text-slate-700'}`}>{t?.n || t?.placeholder}</span>
          </div>
          {winner?.id === t?.id && <Check size={12} strokeWidth={4} />}
        </button>
      ))}
    </div>
  );
}