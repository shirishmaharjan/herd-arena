'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, Check, Award, LayoutGrid, Info, ShieldCheck, Save, ArrowRight, Database, Star, AlertCircle, UserCircle, LogOut, Zap, Target, Shield } from 'lucide-react';
import { GROUPS_DATA, BRACKET_MAPPING } from '../constants/teams';
import { supabase } from '../lib/supabase';

// --- PLAYERS TO WATCH DATA ---
const PLAYERS_TO_WATCH = [
  { n: 'Kylian Mbappé', c: 'fr', team: 'France', pos: 'FW', stat: '46 Goals', img: 'https://images.unsplash.com/photo-1552318975-27db474ef116?q=80&w=400' },
  { n: 'Vinícius Júnior', c: 'br', team: 'Brazil', pos: 'FW', stat: '22 Assists', img: 'https://images.unsplash.com/photo-1518091043644-c1d445bb5196?q=80&w=400' },
  { n: 'Jude Bellingham', c: 'gb-eng', team: 'England', pos: 'MF', stat: '14 Goals', img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=400' },
  { n: 'Lamine Yamal', c: 'es', team: 'Spain', pos: 'RW', stat: 'U21 Star', img: 'https://images.unsplash.com/photo-1511886929837-399a8a117a49?q=80&w=400' },
  { n: 'Jamal Musiala', c: 'de', team: 'Germany', pos: 'AM', stat: '87% Dribble', img: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?q=80&w=400' },
  { n: 'Lionel Messi', c: 'ar', team: 'Argentina', pos: 'CF', stat: 'World Champ', img: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=400' },
];

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

  return (
    <div className="min-h-screen relative font-sans">
      
      {/* 1. PERMANENT STADIUM BACKGROUND */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2000')", 
            filter: 'brightness(0.35) contrast(1.1)' 
          }} 
        />
        <div className="absolute inset-0 bg-[#0275C8]/20 mix-blend-overlay" />
      </div>

      <div className="relative z-10">
        {!isEntryComplete ? (
          /* --- WELCOME SCREEN --- */
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white/95 backdrop-blur-3xl rounded-[50px] shadow-2xl max-w-4xl w-full flex flex-col md:flex-row overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-500">
               {/* LEFT: RULES */}
               <div className="bg-[#0f172a] p-10 text-white md:w-1/2 relative overflow-hidden">
                  <Trophy size={180} className="absolute -bottom-10 -left-10 text-white/[0.03] -rotate-12" />
                  <h2 className="text-4xl font-black italic tracking-tighter mb-8 border-b border-[#0275C8] pb-4 uppercase leading-none">Arena Rules</h2>
                  <div className="space-y-6">
                     <RuleRow i={<Info/>} l="Group Stage" p="+2 Pts per correct rank" />
                     <RuleRow i={<Check/>} l="Knockout Stage" p="+5 Pts per correct winner" />
                     <RuleRow i={<Award/>} l="Finals" p="+20 Pts for correct Champ" />
                     <RuleRow i={<Star/>} l="Player Awards" p="+5 Pts each" />
                     <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex gap-3 mt-4">
                        <AlertCircle className="text-red-500 shrink-0" size={20} />
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-relaxed">Submit once with real name. Duplicates are disqualified.</p>
                     </div>
                  </div>
               </div>
               {/* RIGHT: JOIN */}
               <div className="p-12 md:w-1/2 flex flex-col justify-center items-center text-center bg-white/50">
                  <Trophy size={64} className="text-[#0275C8] mb-6 drop-shadow-xl animate-bounce" />
                  <h1 className="text-4xl font-black mb-1 italic tracking-tighter text-slate-900 uppercase">Herd <span className="text-[#0275C8]">Arena</span></h1>
                  <div className="mt-12 space-y-4 w-full max-w-xs text-left">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Your Professional Name</label>
                     <input type="text" placeholder="Full Name" className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 bg-white/50 outline-none font-bold text-lg focus:border-[#0275C8] transition-all" value={bracketName} onChange={(e) => setBracketName(e.target.value)} />
                     <button onClick={handleJoin} className="w-full bg-[#0275C8] text-white p-5 rounded-2xl font-black shadow-xl hover:bg-[#015da1] transition-all flex items-center justify-center gap-3 text-xs tracking-widest">ENTER ARENA <ArrowRight size={18}/></button>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          /* --- MAIN APPLICATION UI --- */
          <div className="pb-40">
            <nav className="bg-white/90 backdrop-blur-xl border-b border-slate-100 px-10 py-5 sticky top-0 z-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="bg-[#0275C8] p-2 rounded-xl text-white shadow-lg shadow-[#0275C8]/20"><Trophy size={18} /></div>
                <h1 className="text-xl font-black tracking-tight italic uppercase">Herd <span className="text-[#0275C8]">Arena</span></h1>
              </div>
              <div className="flex gap-4 items-center">
                 <div className="flex bg-slate-100 p-1 rounded-xl">
                   <button onClick={() => setView('bracket')} className={`px-5 py-2 rounded-xl text-xs font-black transition ${view === 'bracket' ? 'bg-[#0275C8] text-white shadow-md' : 'text-slate-400'}`}>BRACKET</button>
                   <button onClick={() => setView('leaderboard')} className={`px-5 py-2 rounded-xl text-xs font-black transition ${view === 'leaderboard' ? 'bg-[#0275C8] text-white shadow-md' : 'text-slate-400'}`}>STANDINGS</button>
                 </div>
                 <button onClick={() => { localStorage.removeItem('herd_user_name'); window.location.reload(); }} className="p-2 text-slate-300 hover:text-red-500 transition"><LogOut size={18}/></button>
              </div>
            </nav>

            <main className="max-w-[1900px] mx-auto p-10 space-y-24">
              {view === 'bracket' ? (
                <>
                  <div className="bg-[#0275C8]/90 backdrop-blur-lg rounded-[50px] p-12 text-white shadow-2xl flex justify-between items-center border border-white/20">
                     <div>
                        <h2 className="text-5xl font-black italic tracking-tighter mb-2 underline decoration-white/30 decoration-4 underline-offset-8 uppercase">Good Luck, {bracketName}!</h2>
                        <p className="text-blue-100 font-medium italic">Automatic FIFA Qualification logic is active for your 3rd place picks.</p>
                     </div>
                     <div className="bg-black/20 px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest border border-white/10">Scouting LIVE</div>
                  </div>

                  {/* 1. GROUPS */}
                  <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                      {Object.entries(GROUPS_DATA).map(([id, g]: any) => (
                        <div key={id} className="bg-white/95 backdrop-blur-sm border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all duration-500">
                          <h3 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest italic font-mono text-center">Group {id}</h3>
                          <div className="space-y-5">
                            {g.teams.map((t: any) => (
                              <div key={t.id} className="flex items-center justify-between">
                                <div className="flex flex-col">
                                   <div className="flex items-center gap-3">
                                      <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-5 h-3.5 object-cover rounded shadow-sm" alt=""/> 
                                      <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{t.n}</span>
                                   </div>
                                   <span className="text-[8px] font-black text-[#0275C8] mt-1.5 uppercase tracking-widest opacity-60">{t.ch}% chance</span>
                                </div>
                                <div className="flex gap-1">
                                  {[1, 2, 3].map(r => (
                                    <button key={r} onClick={() => setStandings((p: any) => ({ ...p, [id]: { ...p[id], [r]: t.id } }))} className={`w-8 h-8 text-[11px] font-black rounded-xl transition ${standings[id]?.[r] === t.id ? 'bg-[#0275C8] text-white shadow-lg' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'}`}>{r}</button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </section>

                  {/* BRACKET SECTION */}
                  <section className="flex gap-10 overflow-x-auto pb-20 no-scrollbar items-start">
                     <BracketCol label="R32" slice={[0, 16]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} />
                     <BracketCol label="R16" slice={[16, 24]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-24 pt-16" />
                     <BracketCol label="Quarters" slice={[24, 28]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-[310px] pt-44" />
                     <BracketCol label="Semis" slice={[28, 30]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-[640px] pt-[280px]" />
                     <div className="flex-shrink-0 pt-[450px] space-y-40">
                        <div className="w-64 p-8 bg-amber-50/90 backdrop-blur-sm border-2 border-amber-100 rounded-[3rem] shadow-sm text-center">
                           <h3 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-4 italic">3rd Place Play-Off</h3>
                           <MatchBox m={BRACKET_MAPPING[30]} t1={resolveTeam('L101')} t2={resolveTeam('L102')} winner={bracketWinners['m103']} onPick={(w: any) => setBracketWinners((p: any) => ({ ...p, ['m103']: w }))} />
                        </div>
                        <div className="w-80 p-12 bg-white border-[10px] border-[#0275C8] rounded-[5rem] text-center shadow-2xl scale-110 ring-8 ring-blue-50/50">
                           <Award size={64} className="text-[#0275C8] mx-auto mb-8 animate-bounce" />
                           <MatchBox m={BRACKET_MAPPING[31]} t1={resolveTeam('W101')} t2={resolveTeam('W102')} winner={bracketWinners['m104']} onPick={(w: any) => setBracketWinners((p: any) => ({ ...p, ['m104']: w }))} />
                           <div className="mt-8 border-t pt-6">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest italic">Champion</p>
                              <div className="text-3xl font-black text-[#0275C8] italic uppercase truncate">{bracketWinners['m104']?.n || 'TBD'}</div>
                           </div>
                        </div>
                     </div>
                  </section>

                  {/* --- NEW: PLAYERS TO WATCH SLIDER --- */}
                  <section className="bg-white/80 backdrop-blur-xl rounded-[4rem] p-16 shadow-2xl border border-white/20 overflow-hidden">
                      <div className="flex justify-between items-center mb-12">
                          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Scouting Report <span className="text-[#0275C8]">2026</span></h2>
                          <div className="flex items-center gap-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
                              <Zap size={16} className="text-[#0275C8]" /> Top Players to Watch
                          </div>
                      </div>
                      <div className="relative">
                          <div className="animate-marquee gap-8">
                              {[...PLAYERS_TO_WATCH, ...PLAYERS_TO_WATCH].map((p, idx) => (
                                  <div key={idx} className="w-80 bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer border border-white/5 shadow-2xl">
                                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"><Target size={120} /></div>
                                      <img src={p.img} className="w-24 h-24 rounded-3xl object-cover mb-6 border-2 border-[#0275C8] shadow-lg" alt="" />
                                      <div className="flex items-center gap-3 mb-2">
                                          <img src={`https://flagcdn.com/w40/${p.c}.png`} className="w-5 h-3.5 object-cover rounded shadow-sm" alt=""/>
                                          <span className="text-[10px] font-black uppercase text-[#0275C8] tracking-widest">{p.team}</span>
                                      </div>
                                      <h4 className="text-2xl font-black italic tracking-tight mb-4">{p.n}</h4>
                                      <div className="flex justify-between border-t border-white/10 pt-4">
                                          <div><p className="text-[8px] font-black uppercase text-slate-500">Position</p><p className="font-bold text-[#0275C8]">{p.pos}</p></div>
                                          <div className="text-right"><p className="text-[8px] font-black uppercase text-slate-500">Key Stat</p><p className="font-bold">{p.stat}</p></div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </section>
                </>
              ) : (
                <div className="max-w-2xl mx-auto bg-white/95 backdrop-blur-xl p-16 rounded-[60px] shadow-2xl border border-slate-50 text-center ring-8 ring-blue-50">
                   <Trophy size={48} className="mx-auto text-[#0275C8] mb-6" />
                   <h2 className="text-3xl font-black mb-10 italic uppercase tracking-tighter text-slate-800 underline decoration-[#0275C8] decoration-8 underline-offset-8">Herd Standings</h2>
                   <LeaderboardList />
                </div>
              )}
            </main>

            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-4">
               <button onClick={submitToDatabase} className="bg-slate-900 text-white px-24 py-6 rounded-[2.5rem] font-black shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 tracking-[0.2em] uppercase text-xs">
                  <Save size={20}/> LOCK PREDICTION
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// HELPERS
function RuleRow({ i, l, p }: any) {
  return (
    <div className="flex gap-4 items-center group">
      <div className="bg-[#0275C8] p-2.5 rounded-xl h-fit group-hover:scale-110 transition-transform shadow-lg shadow-[#0275C8]/20 text-white">{i}</div>
      <div><p className="font-bold text-lg leading-tight uppercase tracking-tight">{l}</p><p className="text-slate-400 text-xs mt-0.5">{p}</p></div>
    </div>
  );
}

function LeaderboardList() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => { supabase.from('submissions').select('*').order('points', { ascending: false }).then(({ data }) => data && setList(data)); }, []);
  return (
    <div className="space-y-4">
      {list.map((u, i) => (
        <div key={i} className="flex justify-between items-center p-8 bg-blue-50 rounded-[40px] border border-blue-100 shadow-sm transition-all hover:scale-[1.02]">
          <span className="font-bold flex items-center gap-6 text-xl tracking-tight"><span className="text-blue-300 font-mono italic text-3xl">#{i+1}</span> {u.bracket_name}</span>
          <span className="font-black text-[#0275C8] text-2xl">{u.points} <span className="text-[10px] uppercase text-slate-400 font-mono ml-1">pts</span></span>
        </div>
      ))}
    </div>
  );
}

function BracketCol({ label, slice, resolve, winners, setWinners, spacing = "space-y-6" }: any) {
  return (
    <div className={`w-64 flex-shrink-0 ${spacing}`}>
      <h4 className="text-[10px] font-black text-white md:text-slate-400 uppercase text-center mb-8 tracking-[0.4em] italic">{label}</h4>
      {BRACKET_MAPPING.slice(slice[0], slice[1]).map(m => (
        <MatchBox key={m.id} m={m} t1={resolve(m.t1)} t2={resolve(m.t2)} winner={winners[m.id]} onPick={(w: any) => setWinners((p: any) => ({ ...p, [m.id]: w }))} />
      ))}
    </div>
  );
}

function MatchBox({ t1, t2, winner, onPick }: any) {
  return (
    <div className="bg-white/95 border border-slate-200 rounded-[1.8rem] overflow-hidden shadow-sm hover:shadow-md transition duration-300">
      {[t1, t2].map((t, i) => (
        <button key={i} disabled={t?.placeholder} onClick={() => onPick(t)} className={`w-full text-left p-4 flex justify-between items-center border-b last:border-0 border-slate-50 transition-all ${winner?.id === t?.id ? 'bg-[#0275C8] text-white font-black' : 'hover:bg-blue-50'}`}>
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