'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, Check, Award, Info, ShieldCheck, Save, ArrowRight, Database, Star, Search, Users, AlertCircle, Loader2, Target } from 'lucide-react';
import { GROUPS_DATA, BRACKET_MAPPING } from '../constants/teams';
import { supabase } from '../lib/supabase';

export default function HerdArenaFinalMaster() {
  const [hasMounted, setHasMounted] = useState(false);
  const [isEntryComplete, setIsEntryComplete] = useState(false);
  const [view, setView] = useState('bracket');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [bracketName, setBracketName] = useState('');
  
  // USER PREDICTION STATE
  const [standings, setStandings] = useState<any>({});
  const [bracketWinners, setBracketWinners] = useState<any>({});
  const [selectedThirdsIds, setSelectedThirdsIds] = useState<string[]>([]);
  const [awards, setAwards] = useState({ ball: '', boot: '', gloves: '' });

  useEffect(() => {
    setHasMounted(true);
    const savedName = localStorage.getItem('herd_user_name');
    if (savedName) { setBracketName(savedName); setIsEntryComplete(true); }
  }, []);

  const getTeam = (id: string) => Object.values(GROUPS_DATA).flatMap((g: any) => g.teams).find((t: any) => t.id === id);

  const toggleThirdPlaceSelection = (teamId: string) => {
    setSelectedThirdsIds(prev => {
      if (prev.includes(teamId)) return prev.filter(id => id !== teamId);
      if (prev.length >= 8) return prev;
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

  // SUBMIT DATA (Handles Admin vs User automatically)
  const submitToDatabase = async () => {
    if (selectedThirdsIds.length < 8 && !isAdmin) return alert("Please select exactly 8 best 3rd-place teams!");
    
    const table = isAdmin ? 'official_results' : 'submissions';
    // Storing awards inside bracket_data to avoid "missing column" errors
    const payload = {
      bracket_name: isAdmin ? 'OFFICIAL_KEY' : bracketName,
      bracket_data: { 
        standings, 
        bracketWinners, 
        thirds: selectedThirdsIds,
        awards // Awards included in the JSON block
      }
    };

    const { error } = await supabase.from(table).insert([payload]);
    if (error) alert(error.message);
    else alert(isAdmin ? "Official Key Set Successfully!" : "Prediction Locked! Good Luck.");
  };

  // ADMIN CALCULATION LOGIC
  const recalculateScores = async () => {
    setIsCalculating(true);
    try {
      const { data: official } = await supabase.from('official_results').select('*').order('created_at', { ascending: false }).limit(1).single();
      if (!official) throw new Error("No official results found!");
      
      const { data: subs } = await supabase.from('submissions').select('*');
      if (!subs) return;

      for (const sub of subs) {
        let currentPoints = 0;
        let potentialPoints = 0;
        const user = sub.bracket_data;
        const off = official.bracket_data;

        // 1. Group Standings (+2 pts)
        Object.keys(GROUPS_DATA).forEach(gid => {
          [1, 2, 3].forEach(r => {
            const offId = off.standings?.[gid]?.[r];
            const userId = user.standings?.[gid]?.[r];
            if (!offId) potentialPoints += 2;
            else if (userId === offId) currentPoints += 2;
          });
        });

        // 2. Knockout Bracket
        BRACKET_MAPPING.forEach(match => {
          const mid = match.id;
          const mNum = parseInt(mid.replace('m',''));
          const value = mNum === 104 ? 20 : mNum === 103 ? 10 : 5;

          const offWinnerId = off.bracketWinners?.[mid]?.id;
          const userWinnerId = user.bracketWinners?.[mid]?.id;

          if (!offWinnerId) potentialPoints += value;
          else if (userWinnerId === offWinnerId) currentPoints += value;
        });

        // 3. Player Honors (+5 pts)
        const normalize = (s) => (s || '').toLowerCase().trim();
        const offAwards = off.awards || {};
        const userAwards = user.awards || {};

        ['ball', 'boot', 'gloves'].forEach(key => {
            if (!offAwards[key]) potentialPoints += 5;
            else if (normalize(userAwards[key]) === normalize(offAwards[key])) currentPoints += 5;
        });

        await supabase.from('submissions').update({ 
            points: currentPoints, 
            potential: currentPoints + potentialPoints 
        }).eq('id', sub.id);
      }
      alert("Standings Updated! Everyone's score was reset and verified.");
      window.location.reload();
    } catch (err) { alert(err.message); } finally { setIsCalculating(false); }
  };

  if (!hasMounted) return null;

  // ─── LOGIN ───────────────────────────────────────────────────────────────
  if (!isEntryComplete) {
    return (
      <div className="min-h-screen bg-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-[40px] shadow-2xl max-w-4xl w-full flex flex-col md:flex-row overflow-hidden">
          <div className="bg-slate-900 p-10 text-white md:w-1/2">
            <h2 className="text-3xl font-black italic mb-8 border-b border-blue-500 pb-4">ARENA RULES</h2>
            <div className="space-y-6">
               <div className="flex gap-4"><div className="bg-blue-600 p-2 rounded-xl h-fit"><Info size={20}/></div><div><p className="font-bold">Groups: +2 pts</p><p className="text-slate-400 text-xs">Per correct 1st, 2nd, 3rd rank.</p></div></div>
               <div className="flex gap-4"><div className="bg-indigo-600 p-2 rounded-xl h-fit"><Check size={20}/></div><div><p className="font-bold">Knockouts: +5 pts</p><p className="text-slate-400 text-xs">Correct winners from R32 to SF.</p></div></div>
               <div className="flex gap-4"><div className="bg-amber-500 p-2 rounded-xl h-fit"><Award size={20}/></div><div><p className="font-bold">Finals & 3rd: +10/20</p><p className="text-slate-400 text-xs">High stakes for the final weekend.</p></div></div>
            </div>
          </div>
          <div className="p-12 md:w-1/2 flex flex-col justify-center">
            <Trophy size={48} className="text-blue-600 mb-4" />
            <h1 className="text-3xl font-black mb-1 italic">Herd <span className="text-blue-600">Arena</span></h1>
            <p className="text-slate-400 mb-10 italic">Colleague Championship Prediction Arena</p>
            <input type="text" placeholder="Your Full Name" className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 outline-none font-bold text-lg mb-4" value={bracketName} onChange={(e) => setBracketName(e.target.value)} />
            <button onClick={handleJoin} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black shadow-xl hover:bg-blue-700 transition uppercase tracking-widest text-xs">Enter Arena <ArrowRight size={18} /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-40">
      <nav className="bg-white border-b border-slate-100 px-10 py-5 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg"><Trophy size={18} /></div>
          <h1 className="text-xl font-black italic uppercase">Herd Arena</h1>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setView('bracket')} className={`px-5 py-2 rounded-xl text-xs font-black transition ${view === 'bracket' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>BRACKET</button>
          <button onClick={() => setView('leaderboard')} className={`px-5 py-2 rounded-xl text-xs font-black transition ${view === 'leaderboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>STANDINGS</button>
          <button onClick={() => { const p = prompt("Admin Pass?"); if (p === "herd2026") setIsAdmin(!isAdmin); }} className={`p-2 rounded-lg transition-all ${isAdmin ? 'bg-red-500 text-white shadow-lg' : 'text-slate-100'}`}><ShieldCheck size={18} /></button>
        </div>
      </nav>

      {isAdmin && (
        <div className="bg-red-600 text-white p-2 text-center text-[10px] font-black uppercase tracking-[0.3em] sticky top-[76px] z-40">
          Admin Control Enabled: Updating Official Key
        </div>
      )}

      <main className="max-w-[1900px] mx-auto p-10 space-y-20">
        {view === 'bracket' ? (
          <>
            <div className="bg-blue-600 rounded-[50px] p-12 text-white shadow-2xl flex justify-between items-center relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-5xl font-black italic tracking-tighter mb-2 uppercase underline decoration-4 decoration-blue-300 underline-offset-8">Arena: {bracketName}</h2>
                <p className="text-blue-100 font-medium italic">Predict the world. Lock your choices below.</p>
              </div>
            </div>

            {/* 1. GROUPS */}
            <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Object.entries(GROUPS_DATA).map(([id, g]: any) => (
                <div key={id} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 italic font-mono">Group {id}</h3>
                  <div className="space-y-4">
                    {g.teams.map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-5 h-3.5 object-cover rounded" alt="" />
                          <span className="text-sm font-bold">{t.n}</span>
                        </div>
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

            {/* 2. MANUAL BEST 3RDS */}
            <section className="bg-amber-50 border-2 border-amber-200 p-10 rounded-[3rem]">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-amber-900 uppercase italic tracking-tighter">8 Best 3rd-Place Teams</h2>
                  <p className="text-xs text-amber-700 font-bold max-w-lg">Pick exactly 8 teams from your 3rd-place finishers to advance to R32.</p>
                </div>
                <div className={`px-6 py-2 rounded-full font-black text-xs tracking-widest ${selectedThirdsIds.length === 8 ? 'bg-emerald-500 text-white' : 'bg-amber-200 text-amber-900'}`}>{selectedThirdsIds.length}/8 SELECTED</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Object.keys(GROUPS_DATA).map(gid => {
                  const tId = standings[gid]?.[3];
                  const t = tId ? getTeam(tId) : null;
                  if (!t) return <div key={gid} className="p-6 rounded-[2rem] border-2 border-dashed border-amber-200 flex items-center justify-center opacity-40"><p className="text-[8px] font-black text-amber-400">PICK 3RD G-{gid}</p></div>;
                  const isSelected = selectedThirdsIds.includes(t.id);
                  return (
                    <button key={t.id} onClick={() => toggleThirdPlaceSelection(t.id)} className={`p-6 rounded-[2rem] border-2 transition-all text-center flex flex-col items-center group ${isSelected ? 'bg-blue-600 border-blue-700 shadow-xl scale-105' : 'bg-white border-amber-100 hover:border-amber-300'}`}>
                      <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-8 mb-2" alt="" />
                      <span className={`text-[10px] font-black uppercase truncate w-full ${isSelected ? 'text-white' : 'text-slate-800'}`}>{t.n}</span>
                      <div className={`mt-3 text-[8px] font-black uppercase ${isSelected ? 'text-white' : 'text-blue-600'}`}>{isSelected ? '✓ Selected' : 'Promote'}</div>
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
                <div className="w-64 p-8 bg-amber-50 border-2 border-amber-100 rounded-[3rem] text-center">
                  <h3 className="text-[10px] font-black text-amber-700 uppercase mb-4 italic">3rd Place Match</h3>
                  <MatchBox m={BRACKET_MAPPING[30]} t1={resolveTeam('L101')} t2={resolveTeam('L102')} winner={bracketWinners['m103']} onPick={(w: any) => setBracketWinners((p: any) => ({ ...p, ['m103']: w }))} />
                </div>
                <div className="w-80 p-12 bg-white border-[8px] border-blue-600 rounded-[80px] text-center shadow-2xl scale-110">
                  <Award size={64} className="text-blue-600 mx-auto mb-8 animate-bounce" />
                  <MatchBox m={BRACKET_MAPPING[31]} t1={resolveTeam('W101')} t2={resolveTeam('W102')} winner={bracketWinners['m104']} onPick={(w: any) => setBracketWinners((p: any) => ({ ...p, ['m104']: w }))} />
                  <div className="mt-8 border-t pt-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2 italic">World Champion</p>
                    <div className="text-3xl font-black text-blue-600 italic uppercase">{bracketWinners['m104']?.n || 'TBD'}</div>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. PLAYER HONORS */}
            <section className="space-y-8">
              <div className="bg-indigo-600 rounded-[4rem] p-12 text-white shadow-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                  <h2 className="text-3xl font-black italic tracking-tighter flex items-center gap-4"><Star className="text-yellow-400 fill-yellow-400" /> Player Honors (+5 pts each)</h2>
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-[10px] font-bold uppercase border border-white/20">
                    <Search size={14} /> Tip: Google exact full names to match scoring results.
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[ { l: 'Golden Ball (MVP)', k: 'ball' }, { l: 'Golden Boot', k: 'boot' }, { l: 'Golden Gloves', k: 'gloves' } ].map(a => (
                    <div key={a.k} className="bg-white/10 p-8 rounded-[2.5rem] border border-white/20">
                      <label className="text-[10px] font-black uppercase text-indigo-200 block mb-4 italic tracking-widest">{a.l}</label>
                      <input type="text" className="w-full bg-transparent border-b-2 border-white/30 outline-none p-2 font-black text-xl placeholder:text-white/20 focus:border-white transition-all uppercase" placeholder="NAME..." value={(awards as any)[a.k]} onChange={(e) => setAwards(p => ({ ...p, [a.k]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Scouting Report */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200">
                  <h3 className="text-lg font-black italic mb-6 flex items-center gap-2 text-blue-600 uppercase tracking-tighter"><Users /> Scouting Report: Ones to Watch</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { n: 'Vinícius Júnior', t: 'Brazil', r: "Elite playmaking" },
                      { n: 'Kylian Mbappé', t: 'France', r: 'Tournament killer' },
                      { n: 'Jude Bellingham', t: 'England', r: 'Dynamic presence' },
                      { n: 'Lamine Yamal', t: 'Spain', r: 'generational' },
                      { n: 'Erling Haaland', t: 'Norway', r: 'Lethal striker' },
                      { n: 'Lionel Messi', t: 'Argentina', r: 'Last Dance' }
                    ].map((p, i) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-2xl">
                        <p className="font-black text-sm">{p.n}</p>
                        <p className="text-[9px] font-bold text-blue-600 uppercase mb-1">{p.t}</p>
                        <p className="text-[10px] text-slate-500">{p.r}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col justify-center">
                   <h3 className="text-2xl font-black italic mb-4 uppercase tracking-tighter italic">Points Logic</h3>
                   <p className="text-slate-400 text-sm leading-relaxed mb-6">Winning the Final earns <span className="text-white font-black">+20 pts</span>. That's worth 10 group ranks! One big game can win you the whole office pool.</p>
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="max-w-2xl mx-auto bg-white p-12 rounded-[60px] shadow-2xl text-center ring-8 ring-blue-50">
            <Trophy size={48} className="mx-auto text-blue-600 mb-6" />
            <h2 className="text-3xl font-black mb-10 italic uppercase text-slate-800 tracking-tighter">Leaderboard</h2>
            <LeaderboardList />
          </div>
        )}
      </main>

      {/* Floating Actions */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-4">
        {isAdmin && (
          <button onClick={recalculateScores} disabled={isCalculating} className="bg-emerald-600 text-white px-10 py-3 rounded-full font-black shadow-xl hover:scale-105 transition flex items-center gap-2 text-[10px] uppercase border-4 border-white tracking-widest disabled:opacity-50">
            {isCalculating ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />} 
            {isCalculating ? 'Recalculating...' : 'Apply Official Scoring'}
          </button>
        )}
        <button onClick={submitToDatabase} className={`px-24 py-6 rounded-[2.5rem] font-black shadow-2xl hover:scale-105 active:scale-95 transition flex items-center gap-4 tracking-[0.2em] uppercase text-xs text-white ${isAdmin ? 'bg-red-600' : 'bg-slate-950'}`}>
          <Save size={20} /> {isAdmin ? 'Update Official Key' : 'Lock My Prediction'}
        </button>
      </div>
    </div>
  );
}

// SHARED LIST
function LeaderboardList() {
  const [list, setList] = React.useState<any[]>([]);
  React.useEffect(() => { supabase.from('submissions').select('*').order('points', { ascending: false }).then(({ data }) => data && setList(data)); }, []);
  return (
    <div className="space-y-4">
      {list.map((u, i) => (
        <div key={i} className={`flex justify-between items-center p-8 rounded-[40px] border transition-all ${i === 0 ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-105' : 'bg-blue-50 border-blue-100'}`}>
          <div className="flex items-center gap-6 text-left">
            <span className={`font-mono italic text-2xl ${i === 0 ? 'text-white' : 'text-blue-200'}`}>#{i+1}</span>
            <div>
              <p className="font-bold text-xl tracking-tight leading-none mb-2">{u.bracket_name}</p>
              <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${i === 0 ? 'text-blue-200' : 'text-slate-400'}`}>
                 <Target size={10}/> Max Possible: {u.potential || 0}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className={`font-black text-3xl italic ${i === 0 ? 'text-white' : 'text-blue-600'}`}>{u.points || 0}</span>
            <p className={`text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'text-blue-200' : 'text-slate-400'}`}>Pts</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function BracketCol({ label, slice, resolve, winners, setWinners, spacing = "space-y-4" }: any) {
  return (
    <div className={`w-64 flex-shrink-0 ${spacing}`}>
      <h4 className="text-[10px] font-black text-slate-400 uppercase text-center mb-6 italic tracking-widest">{label}</h4>
      {BRACKET_MAPPING.slice(slice[0], slice[1]).map((m: any) => (
        <MatchBox key={m.id} m={m} t1={resolve(m.t1)} t2={resolve(m.t2)} winner={winners[m.id]} onPick={(w: any) => setWinners((p: any) => ({ ...p, [m.id]: w }))} />
      ))}
    </div>
  );
}

function MatchBox({ t1, t2, winner, onPick }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-[1.8rem] overflow-hidden shadow-sm hover:shadow-md transition">
      {[t1, t2].map((t: any, i: number) => (
        <button key={i} disabled={t?.placeholder} onClick={() => onPick(t)} className={`w-full text-left p-4 flex justify-between items-center border-b last:border-0 border-slate-50 transition-all ${winner?.id === t?.id ? 'bg-blue-600 text-white font-black' : 'hover:bg-blue-50'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            {t?.c ? <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-5 h-3.5 object-cover rounded shadow-sm" alt="" /> : <div className="w-5 h-3.5 bg-slate-100 rounded-sm" />}
            <span className={`text-[10px] font-black uppercase tracking-tight truncate ${t?.placeholder ? 'text-slate-300 italic font-medium' : 'text-slate-800'}`}>{t?.n || t?.placeholder}</span>
          </div>
          {winner?.id === t?.id && <Check size={16} strokeWidth={5} />}
        </button>
      ))}
    </div>
  );
}