'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy, Check, Award, Info, ShieldCheck, Save, ArrowRight,
  Database, Star, Search, Users, Lock, Unlock, ChevronUp, ChevronDown,
  Zap, Target, Crown, Medal, RefreshCw, X, AlertCircle, CheckCircle2, Download,
  TrendingUp, TrendingDown, Flame, Swords, ChevronRight
} from 'lucide-react';
import { GROUPS_DATA, BRACKET_MAPPING } from '../constants/teams';
import { supabase } from '../lib/supabase';

// ─── TOAST NOTIFICATION SYSTEM ────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; msg: string; type: ToastType; }

function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold max-w-xs animate-slide-in
            ${t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}
          style={{ animation: 'slideInRight 0.3s ease-out' }}
        >
          {t.type === 'success' ? <CheckCircle2 size={18} /> : t.type === 'error' ? <AlertCircle size={18} /> : <Zap size={18} />}
          <span className="flex-1">{t.msg}</span>
          <button onClick={() => remove(t.id)} className="opacity-60 hover:opacity-100"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const add = (msg: string, type: ToastType = 'info') => {
    const id = ++counter.current;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };
  const remove = (id: number) => setToasts(p => p.filter(t => t.id !== id));
  return { toasts, remove, success: (m: string) => add(m, 'success'), error: (m: string) => add(m, 'error'), info: (m: string) => add(m, 'info') };
}

// ─── POINTS BREAKDOWN CARD ────────────────────────────────────────────────────
function PointsBreakdownCard({ stage }: { stage: 'group' | 'knockout' | 'final' }) {
  if (stage === 'group') return (
    <div className="mb-6 grid grid-cols-3 gap-3">
      {[
        { label: '12 Groups',    sub: '3 positions each', pts: '72', icon: '🏟️', color: 'bg-blue-50 border-blue-100 text-blue-700' },
        { label: '2 pts each',   sub: 'per correct pick',  pts: '×2', icon: '✓',  color: 'bg-slate-50 border-slate-200 text-slate-600' },
        { label: 'Stage Max',    sub: 'total available',   pts: '72', icon: '🎯', color: 'bg-blue-600 border-blue-600 text-white'       },
      ].map(({ label, sub, pts, icon, color }) => (
        <div key={label} className={`rounded-2xl border-2 p-4 text-center ${color}`}>
          <div className="text-xl mb-1">{icon}</div>
          <p className="text-[18px] font-black tabular-nums">{pts}</p>
          <p className="text-[10px] font-black uppercase tracking-wide mt-0.5">{label}</p>
          <p className="text-[9px] opacity-70 mt-0.5">{sub}</p>
        </div>
      ))}
    </div>
  );

  if (stage === 'knockout') return (
    <div className="mb-6 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'R32',  sub:'16 × 5 pts', pts: 80,  bar: 'bg-indigo-400' },
          { label: 'R16',  sub:'8 × 5 pts',  pts: 40,  bar: 'bg-purple-400' },
          { label: 'QF',   sub:'4 × 5 pts',  pts: 20,  bar: 'bg-fuchsia-400' },
          { label: 'SF',   sub:'2 × 5 pts',  pts: 10,  bar: 'bg-pink-400' },
          { label: '3rd',  sub:'1 × 10 pts', pts: 10,  bar: 'bg-rose-400' },
          { label: 'Final',sub:'1 × 20 pts', pts: 20,  bar: 'bg-red-500' },
        ].map(({ label, sub, pts, bar }) => (
          <div key={label} className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
              <span className="text-sm font-black text-slate-800">{pts}</span>
            </div>
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.round((pts/80)*100)}%` }} />
            </div>
            <p className="text-[8px] text-slate-400 font-bold mt-1">{sub}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-purple-50 border-2 border-purple-100 rounded-2xl px-4 py-3 flex items-center justify-between">
          <span className="text-[10px] font-black text-purple-700 uppercase">Stage 2 Max</span>
          <span className="text-xl font-black text-purple-700">180 pts</span>
        </div>
        <div className="bg-purple-700 rounded-2xl px-4 py-3 flex items-center justify-between">
          <span className="text-[10px] font-black text-purple-200 uppercase">Cumulative</span>
          <span className="text-xl font-black text-white">252 pts</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mb-6 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '🏅 Golden Ball', pts: 5 },
          { label: '👟 Golden Boot', pts: 5 },
          { label: '🧤 Golden Gloves', pts: 5 },
        ].map(({ label, pts }) => (
          <div key={label} className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-4 text-center">
            <p className="text-sm font-black text-slate-700">{label}</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{pts} pts</p>
          </div>
        ))}
      </div>
      <div className="bg-slate-950 rounded-2xl px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">🏆 Grand Total Maximum</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Groups 72 + Knockout 180 + Awards 15</p>
        </div>
        <span className="text-3xl font-black text-amber-400">267 pts</span>
      </div>
    </div>
  );
}

// ─── LEADERBOARD ROW ──────────────────────────────────────────────────────────
function LeaderboardRow({ u, i, prev, maxPts, showDelta = true }: {
  u: any; i: number; prev: string[]; maxPts: number; showDelta?: boolean;
}) {
  // kept for backward compat but LeaderboardSection renders its own rows now
  return null;
}

// ─── MINI STANDINGS (for login page) ─────────────────────────────────────────
function MiniStandings() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('submissions')
      .select('id, bracket_name, points, group_points, knockout_points, awards_points, created_at')
      .order('points', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setList(data || []);
        setLoading(false);
      });
  }, []);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="bg-slate-950/95 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 w-80 shadow-2xl">
      <div className="flex items-center gap-2 mb-5">
        <div className="bg-blue-600 p-1.5 rounded-xl"><Trophy size={14} className="text-white" /></div>
        <div>
          <p className="text-white font-black text-xs uppercase tracking-widest">Live Standings</p>
          <p className="text-slate-500 text-[9px] uppercase tracking-widest">Herd Arena 2026</p>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-slate-500">
          <RefreshCw size={14} className="animate-spin" />
          <span className="text-xs font-bold">Loading...</span>
        </div>
      ) : list.length === 0 ? (
        <p className="text-slate-500 text-center py-6 text-xs italic">No submissions yet — be the first!</p>
      ) : (
        <div className="space-y-2">
          {list.map((u, i) => {
            const pts = u.points ?? 0;
            const maxPts = Math.max(...list.map((x: any) => x.points ?? 0), 1);
            const pct = Math.round((pts / maxPts) * 100);
            const isFirst = i === 0;
            return (
              <div
                key={u.id}
                className={`relative overflow-hidden rounded-2xl border transition-all ${isFirst ? 'bg-white/10 border-blue-500/40' : 'bg-white/5 border-white/5'}`}
              >
                <div
                  className="absolute left-0 top-0 h-full rounded-2xl opacity-10 bg-blue-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative z-10 flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm w-6 text-center flex-shrink-0">{i < 3 ? medals[i] : <span className="text-slate-500 font-black text-[10px]">#{i + 1}</span>}</span>
                    <p className={`font-black text-[11px] truncate max-w-[140px] ${isFirst ? 'text-white' : 'text-slate-300'}`}>{u.bracket_name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-black text-base tabular-nums ${isFirst ? 'text-blue-400' : 'text-slate-400'}`}>{pts}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-slate-600 text-[9px] text-center mt-4 uppercase tracking-widest font-bold">Updates live · Max 267 pts</p>
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({
  onClose, toast
}: { onClose: () => void; toast: ReturnType<typeof useToast> }) {
  const [tab, setTab] = useState<'official' | 'submissions' | 'recalc'>('official');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [official, setOfficial] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [officialAwards, setOfficialAwards] = useState({ ball: '', boot: '', gloves: '', bootGoals: 0 });
  const [recalcDone, setRecalcDone] = useState(false);

  useEffect(() => {
    loadSubmissions();
    loadOfficial();
  }, []);

  const loadSubmissions = async () => {
    const { data } = await supabase.from('submissions').select('*').order('points', { ascending: false });
    setSubmissions(data || []);
  };

  const loadOfficial = async () => {
    const { data } = await supabase
      .from('official_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      setOfficial(data);
      setOfficialAwards({
        ball:      data.golden_ball   || '',
        boot:      data.golden_boot   || '',
        gloves:    data.golden_gloves || '',
        bootGoals: data.boot_goals    || 0,
      });
    }
  };

  // ── Compute partial scores for staged leaderboard ──────────────────────────
  const computePartialScores = (sub: any, off: any) => {
    const u = sub.bracket_data || {};
    const o = off.bracket_data || {};
    let groupScore = 0;
    let knockoutScore = 0;
    let awardsScore = 0;

    // Group stage (positions 1,2,3 per group)
    Object.keys(o.standings || {}).forEach(gid =>
      [1, 2, 3].forEach(r => {
        if (u.standings?.[gid]?.[r] === o.standings[gid]?.[r]) groupScore += 2;
      })
    );

    // Knockout scoring — team-based, not slot-based.
    // A colleague earns points if the team they picked to win a round
    // actually won ANY match in that round, regardless of which slot/fixture.
    const bw = o.bracketWinners || {};
    const ub = u.bracketWinners || {};

    // Build sets of team IDs that officially won each round
    const offR32  = new Set(Object.entries(bw).filter(([mid]) => { const m=parseInt(mid.substring(1)); return m>=1  && m<=16;  }).map(([,w]:any) => w?.id).filter(Boolean));
    const offR16  = new Set(Object.entries(bw).filter(([mid]) => { const m=parseInt(mid.substring(1)); return m>=17 && m<=24;  }).map(([,w]:any) => w?.id).filter(Boolean));
    const offQF   = new Set(Object.entries(bw).filter(([mid]) => { const m=parseInt(mid.substring(1)); return m>=25 && m<=28;  }).map(([,w]:any) => w?.id).filter(Boolean));
    const offSF   = new Set(Object.entries(bw).filter(([mid]) => { const m=parseInt(mid.substring(1)); return m>=29 && m<=30;  }).map(([,w]:any) => w?.id).filter(Boolean));
    const off3rd  = bw['m103']?.id;
    const offFinal= bw['m104']?.id;

    // Build sets of team IDs the user picked to win each round
    const myR32   = new Set(Object.entries(ub).filter(([mid]) => { const m=parseInt(mid.substring(1)); return m>=1  && m<=16;  }).map(([,w]:any) => w?.id).filter(Boolean));
    const myR16   = new Set(Object.entries(ub).filter(([mid]) => { const m=parseInt(mid.substring(1)); return m>=17 && m<=24;  }).map(([,w]:any) => w?.id).filter(Boolean));
    const myQF    = new Set(Object.entries(ub).filter(([mid]) => { const m=parseInt(mid.substring(1)); return m>=25 && m<=28;  }).map(([,w]:any) => w?.id).filter(Boolean));
    const mySF    = new Set(Object.entries(ub).filter(([mid]) => { const m=parseInt(mid.substring(1)); return m>=29 && m<=30;  }).map(([,w]:any) => w?.id).filter(Boolean));
    const my3rd   = ub['m103']?.id;
    const myFinal = ub['m104']?.id;

    // Award points for each correct team regardless of slot
    myR32.forEach  (id => { if (offR32.has(id))   knockoutScore += 5;  });
    myR16.forEach  (id => { if (offR16.has(id))   knockoutScore += 5;  });
    myQF.forEach   (id => { if (offQF.has(id))    knockoutScore += 5;  });
    mySF.forEach   (id => { if (offSF.has(id))    knockoutScore += 5;  });
    if (my3rd  && my3rd   === off3rd)   knockoutScore += 10;
    if (myFinal && myFinal === offFinal) knockoutScore += 20;

    const safeMatch = (a?: string, b?: string) =>
      a && b && a.trim().toLowerCase() === b.trim().toLowerCase();
    if (safeMatch(sub.golden_ball, off.golden_ball)) awardsScore += 5;
    if (safeMatch(sub.golden_boot, off.golden_boot)) awardsScore += 5;
    if (safeMatch(sub.golden_gloves, off.golden_gloves)) awardsScore += 5;

    return { groupScore, knockoutScore, awardsScore, total: groupScore + knockoutScore + awardsScore };
  };

  const recalculate = async () => {
    setLoading(true);
    try {
      const { data: off } = await supabase
        .from('official_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!off) { toast.error('No official results set yet!'); setLoading(false); return; }

      const { data: subs } = await supabase.from('submissions').select('*');
      if (!subs) { setLoading(false); return; }

      for (const sub of subs) {
        const { groupScore, knockoutScore, awardsScore, total } = computePartialScores(sub, off);

        await supabase.from('submissions').update({
          points: total,
          group_points: groupScore,
          knockout_points: knockoutScore,
          awards_points: awardsScore,
        }).eq('id', sub.id);
      }

      setRecalcDone(true);
      toast.success(`Recalculated ${subs.length} submissions!`);
      await loadSubmissions();
    } catch (e: any) {
      toast.error(e.message || 'Recalculation failed');
    }
    setLoading(false);
  };

  const updateOfficialAwards = async () => {
    if (!official) { toast.error('No official result record found'); return; }
    setLoading(true);
    const { error } = await supabase
      .from('official_results')
      .update({
        golden_ball:   officialAwards.ball,
        golden_boot:   officialAwards.boot,
        golden_gloves: officialAwards.gloves,
        boot_goals:    officialAwards.bootGoals,
      })
      .eq('id', official.id);
    if (error) toast.error(error.message);
    else toast.success('Official awards updated!');
    setLoading(false);
  };

  const deleteSubmission = async (id: string) => {
    const { error } = await supabase.from('submissions').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Submission deleted'); await loadSubmissions(); }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-xl"><ShieldCheck size={20} className="text-white" /></div>
            <div>
              <h2 className="text-white font-black text-lg">Admin Control Panel</h2>
              <p className="text-slate-400 text-xs">Manage submissions, official results & scoring</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-2 rounded-xl hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 p-4 border-b border-slate-800">
          {[
            { id: 'official', label: 'Official Results', icon: Crown },
            { id: 'submissions', label: `Submissions (${submissions.length})`, icon: Users },
            { id: 'recalc', label: 'Recalculate', icon: RefreshCw },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${tab === id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'official' && (
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                <h3 className="text-white font-black mb-4 flex items-center gap-2"><Star size={16} className="text-yellow-400" /> Player Awards (Official)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { l: '🏅 Golden Ball (MVP)', k: 'ball',   hint: 'Confirmed at finale' },
                    { l: '👟 Golden Boot',       k: 'boot',   hint: 'Update after each matchday' },
                    { l: '🧤 Golden Gloves',     k: 'gloves', hint: 'Update after each matchday' },
                  ].map(a => (
                    <div key={a.k}>
                      <label className="text-slate-400 text-[10px] uppercase font-black block mb-1">{a.l}</label>
                      <p className="text-slate-600 text-[9px] mb-2">{a.hint}</p>
                      <input
                        type="text"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-bold text-sm outline-none focus:border-emerald-500 transition"
                        placeholder="Full player name..."
                        value={(officialAwards as any)[a.k]}
                        onChange={e => setOfficialAwards(p => ({ ...p, [a.k]: e.target.value }))}
                      />
                      {a.k === 'boot' && (
                        <input
                          type="number" min={0}
                          className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-bold text-sm outline-none focus:border-emerald-500 transition"
                          placeholder="Current goals (e.g. 5)"
                          value={officialAwards.bootGoals || ''}
                          onChange={e => setOfficialAwards(p => ({ ...p, bootGoals: Number(e.target.value) }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={updateOfficialAwards}
                  disabled={loading}
                  className="mt-4 bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Official Awards'}
                </button>
              </div>
              {official && (
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                  <h3 className="text-white font-black mb-2">Current Official Record</h3>
                  <pre className="text-slate-400 text-xs overflow-auto max-h-48">
                    {JSON.stringify(official, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {tab === 'submissions' && (
            <div className="space-y-3">
              {submissions.length === 0 && (
                <p className="text-slate-500 text-center py-12">No submissions yet.</p>
              )}
              {submissions.map((s, i) => (
                <div key={s.id} className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500 font-black text-sm w-6">#{i + 1}</span>
                    <div>
                      <p className="text-white font-black text-sm">{s.bracket_name}</p>
                      <p className="text-slate-500 text-[10px]">{new Date(s.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-emerald-400 font-black text-xl">{s.points ?? 0}</p>
                      <p className="text-slate-500 text-[10px] uppercase">pts</p>
                    </div>
                    <button
                      onClick={() => deleteSubmission(s.id)}
                      className="text-red-400 hover:text-red-300 p-2 rounded-xl hover:bg-red-950 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'recalc' && (
            <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
              <div className={`p-6 rounded-full ${recalcDone ? 'bg-emerald-900' : 'bg-slate-800'}`}>
                <RefreshCw size={40} className={recalcDone ? 'text-emerald-400' : 'text-slate-400'} />
              </div>
              <div>
                <h3 className="text-white font-black text-xl mb-2">Recalculate All Scores</h3>
                <p className="text-slate-400 text-sm max-w-sm">
                  This will compare every submission against the official results and update all score columns
                  (group_points, knockout_points, awards_points, total points).
                </p>
              </div>
              <button
                onClick={recalculate}
                disabled={loading}
                className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-emerald-500 transition disabled:opacity-50 flex items-center gap-3"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Recalculating...' : recalcDone ? 'Recalculate Again' : 'Run Recalculation'}
              </button>
              {recalcDone && (
                <div className="bg-emerald-900/50 border border-emerald-700 rounded-2xl p-4 text-emerald-300 font-bold text-sm">
                  ✅ Scores updated successfully for all {submissions.length} participants!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function HerdArenaFinalMaster() {
  const [hasMounted, setHasMounted] = useState(false);
  const [isEntryComplete, setIsEntryComplete] = useState(false);
  const [view, setView] = useState<'bracket' | 'leaderboard' | 'live'>('bracket');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminLoaded, setAdminLoaded] = useState(false);
  const [bracketName, setBracketName] = useState('');
  const [standings, setStandings] = useState<Record<string, Record<number, string>>>({});
  const [bracketWinners, setBracketWinners] = useState<Record<string, any>>({});
  const [selectedThirdsIds, setSelectedThirdsIds] = useState<string[]>([]);
  const [awards, setAwards] = useState({ ball: '', boot: '', gloves: '' });
  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [isLocked, setIsLocked] = useState(false);
  const [stage1Locked, setStage1Locked] = useState(false);
  const [stage2Locked, setStage2Locked] = useState(false);
  const [stage3Locked, setStage3Locked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setHasMounted(true);
    const savedName = localStorage.getItem('herd_user_name');
    if (savedName) { setBracketName(savedName); setIsEntryComplete(true); }
    // Tournament has started — predictions are permanently locked for everyone (except admin).
    setIsLocked(true);
    setStage1Locked(true);
    setStage2Locked(true);
    setStage3Locked(true);
  }, []);

  // ── Auto-load official results into local state when admin logs in ──────────
  // This means the Bracket tab shows current Supabase data immediately,
  // so admin only needs to update the groups that changed — not re-enter everything.
  useEffect(() => {
    if (!isAdmin || adminLoaded) return;
    const load = async () => {
      const { data } = await supabase
        .from('official_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data) return;
      const bd = data.bracket_data || {};
      if (bd.standings)      setStandings(bd.standings);
      if (bd.bracketWinners) setBracketWinners(bd.bracketWinners);
      if (bd.thirds?.length) setSelectedThirdsIds(bd.thirds);
      if (data.golden_ball)   setAwards(p => ({ ...p, ball:   data.golden_ball }));
      if (data.golden_boot)   setAwards(p => ({ ...p, boot:   data.golden_boot }));
      if (data.golden_gloves) setAwards(p => ({ ...p, gloves: data.golden_gloves }));
      setAdminLoaded(true);
    };
    load();
  }, [isAdmin, adminLoaded]);

  // Countdown timer
  useEffect(() => {
    const kick = new Date('2026-06-11T18:00:00Z');
    const tick = () => {
      const diff = Math.max(0, kick.getTime() - Date.now());
      setCountdown({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Confetti on login page
  useEffect(() => {
    const colors = ['#2563eb', '#7c3aed', '#f59e0b', '#10b981', '#ef4444'];
    const container = document.getElementById('confetti-container');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 60; i++) {
      const dot = document.createElement('div');
      const size = 4 + Math.random() * 8;
      dot.style.cssText = `
        position:absolute;width:${size}px;height:${size}px;
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
        background:${colors[i % colors.length]};
        left:${Math.random() * 100}%;
        top:-${10 + Math.random() * 20}px;
        animation:confettiFall ${2 + Math.random() * 4}s linear ${Math.random() * 3}s infinite;
        opacity:0.75;transform:rotate(${Math.random() * 360}deg);
      `;
      container.appendChild(dot);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getTeam = (id: string) =>
    Object.values(GROUPS_DATA).flatMap((g: any) => g.teams).find((t: any) => t.id === id);

  const toggleThirdPlaceSelection = (teamId: string) => {
    setSelectedThirdsIds(prev => {
      if (prev.includes(teamId)) return prev.filter(id => id !== teamId);
      if (prev.length >= 8) { toast.info('Already selected 8 teams. Deselect one first.'); return prev; }
      return [...prev, teamId];
    });
  };

  const resolveTeam = (slot: string): any => {
    if (!slot) return { placeholder: 'TBD' };
    if (slot.startsWith('W')) {
      const winner = bracketWinners['m' + slot.substring(1)];
      return winner || { placeholder: `Match ${slot.substring(1)} Winner` };
    }
    if (slot === 'L101' || slot === 'L102') {
      const mId = 'm' + slot.substring(1);
      const winner = bracketWinners[mId];
      const match = BRACKET_MAPPING.find((x: any) => x.id === mId);
      if (!winner || !match) return { placeholder: `SF ${slot === 'L101' ? '1' : '2'} Loser` };
      const t1 = resolveTeam(match.t1); const t2 = resolveTeam(match.t2);
      if (!t1 || !t2) return { placeholder: 'TBD' };
      return winner.id === t1?.id ? t2 : t1;
    }
    if (slot.startsWith('3RD')) {
      const idx = parseInt(slot.split('-')[1]) - 1;
      const tId = selectedThirdsIds[idx];
      const t = tId ? getTeam(tId) : null;
      return t ? { ...t, label: '3rd Place' } : { placeholder: `3rd Slot ${idx + 1}` };
    }
    const gId = slot[0];
    const rank = parseInt(slot.substring(1));
    const tId = standings[gId]?.[rank];
    return tId ? getTeam(tId) : { placeholder: `${rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'} Group ${gId}` };
  };

  // ── Download predictions as Excel ────────────────────────────────────────
  const downloadExcel = () => {
    // Build CSV content (works universally; Excel opens .csv natively)
    const rows: string[][] = [];

    // Header
    rows.push(['HERD ARENA — World Cup 2026 Predictions']);
    rows.push([`Participant: ${bracketName}`]);
    rows.push([`Downloaded: ${new Date().toLocaleString()}`]);
    rows.push([]);

    // ── Group Stage ──
    rows.push(['=== STAGE 1: GROUP STAGE ===']);
    rows.push(['Group', '1st Place', '2nd Place', '3rd Place']);
    Object.entries(GROUPS_DATA).forEach(([gid, g]: any) => {
      const getTeamName = (rank: number) => {
        const tId = standings[gid]?.[rank];
        if (!tId) return '(not set)';
        const t = g.teams.find((t: any) => t.id === tId);
        return t?.n || tId;
      };
      rows.push([`Group ${gid}`, getTeamName(1), getTeamName(2), getTeamName(3)]);
    });
    rows.push([]);

    // ── 8 Best Thirds ──
    rows.push(['=== 8 BEST 3RD-PLACE TEAMS ===']);
    rows.push(['#', 'Team']);
    selectedThirdsIds.forEach((tId, i) => {
      const t = Object.values(GROUPS_DATA).flatMap((g: any) => g.teams).find((t: any) => t.id === tId) as any;
      rows.push([String(i + 1), t?.n || tId]);
    });
    if (selectedThirdsIds.length < 8) {
      rows.push(['(incomplete — only ' + selectedThirdsIds.length + '/8 selected)']);
    }
    rows.push([]);

    // ── Knockout Bracket ──
    rows.push(['=== STAGE 2: KNOCKOUT BRACKET ===']);
    rows.push(['Round', 'Match', 'Predicted Winner']);
    const roundLabels: Record<string, string> = {
      R32: 'Round of 32', R16: 'Round of 16', QF: 'Quarter-Final',
      SF: 'Semi-Final', '3P': '3rd Place', F: 'Final',
    };
    BRACKET_MAPPING.forEach((m: any) => {
      const winner = bracketWinners[m.id];
      const mNum = parseInt(m.id.substring(1));
      const round = mNum <= 16 ? 'R32' : mNum <= 24 ? 'R16' : mNum <= 28 ? 'QF' : mNum <= 30 ? 'SF' : mNum === 103 ? '3P' : 'F';
      rows.push([roundLabels[round] || round, m.id.toUpperCase(), winner?.n || '(not picked)']);
    });
    rows.push([]);

    // ── Player Awards ──
    rows.push(['=== STAGE 3: PLAYER AWARDS ===']);
    rows.push(['Award', 'Prediction']);
    rows.push(['🏅 Golden Ball (MVP)', awards.ball || '(not set)']);
    rows.push(['👟 Golden Boot', awards.boot || '(not set)']);
    rows.push(['🧤 Golden Gloves', awards.gloves || '(not set)']);

    // Serialize to CSV
    const csv = rows.map(r =>
      r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // Trigger download
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HerdArena_${bracketName.replace(/\s+/g, '_')}_Predictions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleJoin = () => {
    const name = bracketName.trim();
    if (name.length < 2) { toast.error('Please enter your full name (min 2 characters).'); return; }
    localStorage.setItem('herd_user_name', name);
    setIsEntryComplete(true);
    toast.success(`Welcome to the Arena, ${name}! 🏆`);
  };

  const handleAdminLogin = () => {
    const p = prompt('Admin Password:');
    if (p === 'herd2026') {
      setIsAdmin(true);
      setShowAdminPanel(true);
      toast.success('Admin access granted');
    } else if (p !== null) {
      toast.error('Incorrect password');
    }
  };

  // ── Core upsert helper ────────────────────────────────────────────────────
  const upsertSubmission = async (patch: Record<string, any>, successMsg: string) => {
    const table = isAdmin ? 'official_results' : 'submissions';
    const name = isAdmin ? 'OFFICIAL' : bracketName;

    if (isAdmin) {
      // Admin: MERGE — load existing record first, deep-merge only touched fields.
      // This means you can add D,E,F tonight without re-entering A,B,C.
      const { data: existing } = await supabase
        .from('official_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const existingBD      = existing?.bracket_data || {};
      const existingStands  = existingBD.standings      || {};
      const existingWinners = existingBD.bracketWinners || {};
      const existingThirds  = existingBD.thirds          || [];

      // Only overwrite groups that have at least one position filled locally
      const mergedStandings = { ...existingStands };
      Object.entries(standings).forEach(([gid, ranks]) => {
        if (Object.keys(ranks).length > 0) mergedStandings[gid] = ranks;
      });

      // Only overwrite bracket slots that have a winner locally
      const mergedWinners = { ...existingWinners };
      Object.entries(bracketWinners).forEach(([mid, winner]) => {
        if (winner) mergedWinners[mid] = winner;
      });

      // Use local thirds if any selected, else keep existing
      const mergedThirds = selectedThirdsIds.length > 0 ? selectedThirdsIds : existingThirds;

      const mergedPayload: Record<string, any> = {
        bracket_name:  name,
        bracket_data:  { standings: mergedStandings, bracketWinners: mergedWinners, thirds: mergedThirds },
        golden_ball:   awards.ball.trim()   || existing?.golden_ball   || null,
        golden_boot:   awards.boot.trim()   || existing?.golden_boot   || null,
        golden_gloves: awards.gloves.trim() || existing?.golden_gloves || null,
        updated_at:    new Date().toISOString(),
        ...patch,
      };

      if (existing) {
        const { error } = await supabase.from('official_results').update(mergedPayload).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('official_results').insert([mergedPayload]);
        if (error) throw error;
      }
    } else {
      const { data: existing } = await supabase
        .from('submissions')
        .select('id')
        .eq('bracket_name', name)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from('submissions').update(patch).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('submissions').insert([{ bracket_name: name, ...patch }]);
        if (error) throw error;
      }
    }
    toast.success(successMsg);
  };

  // ── Stage 1: Groups + 8 Thirds ────────────────────────────────────────────
  const submitStage1 = async () => {
    if (!groupsComplete) {
      toast.error('Fill in all 12 group standings first (positions 1, 2, 3).');
      return;
    }
    if (selectedThirdsIds.length < 8) {
      toast.error('Select exactly 8 best 3rd-place teams first!');
      return;
    }
    setSubmitting(true);
    try {
      await upsertSubmission(
        { bracket_data: { standings, bracketWinners, thirds: selectedThirdsIds } },
        'Stage 1 saved — Groups & 3rd-place picks locked! ✅'
      );
      localStorage.setItem('herd_stage1_locked', '1');
      setStage1Locked(true);
    } catch (e: any) { toast.error(e?.message || 'Save failed.'); }
    setSubmitting(false);
  };

  // ── Stage 2: Knockout Bracket ─────────────────────────────────────────────
  const submitStage2 = async () => {
    if (!bracketWinners['m104']) {
      toast.error('Pick your World Cup Final winner first!');
      return;
    }
    setSubmitting(true);
    try {
      await upsertSubmission(
        { bracket_data: { standings, bracketWinners, thirds: selectedThirdsIds } },
        'Stage 2 saved — Knockout bracket locked! ⚡'
      );
      localStorage.setItem('herd_stage2_locked', '1');
      setStage2Locked(true);
    } catch (e: any) { toast.error(e?.message || 'Save failed.'); }
    setSubmitting(false);
  };

  // ── Stage 3: Player Awards ─────────────────────────────────────────────────
  const submitStage3 = async () => {
    if (!awards.ball.trim() && !awards.boot.trim() && !awards.gloves.trim()) {
      toast.error('Enter at least one player award pick.');
      return;
    }
    setSubmitting(true);
    try {
      const patch: Record<string, any> = {};
      if (awards.ball.trim()) patch.golden_ball = awards.ball.trim();
      if (awards.boot.trim()) patch.golden_boot = awards.boot.trim();
      if (awards.gloves.trim()) patch.golden_gloves = awards.gloves.trim();
      await upsertSubmission(patch, 'Stage 3 saved — Player honors locked! 🏅');
      localStorage.setItem('herd_stage3_locked', '1');
      setStage3Locked(true);
    } catch (e: any) { toast.error(e?.message || 'Save failed.'); }
    setSubmitting(false);
  };

  // ── Unified single-step save for colleagues (no update after) ───────────
  const submitAll = async () => {
    if (!groupsComplete) { toast.error('Fill in all 12 group standings first.'); return; }
    if (selectedThirdsIds.length < 8) { toast.error('Select exactly 8 best 3rd-place teams first!'); return; }
    if (!bracketWinners['m104']) { toast.error('Pick your World Cup Final winner first!'); return; }
    setSubmitting(true);
    try {
      const patch: Record<string, any> = {
        bracket_data: { standings, bracketWinners, thirds: selectedThirdsIds },
      };
      if (awards.ball.trim()) patch.golden_ball = awards.ball.trim();
      if (awards.boot.trim()) patch.golden_boot = awards.boot.trim();
      if (awards.gloves.trim()) patch.golden_gloves = awards.gloves.trim();
      await upsertSubmission(patch, 'Predictions submitted & locked! 🏆');
      localStorage.setItem('herd_locked', '1');
      localStorage.setItem('herd_stage1_locked', '1');
      localStorage.setItem('herd_stage2_locked', '1');
      localStorage.setItem('herd_stage3_locked', '1');
      setIsLocked(true);
      setStage1Locked(true);
      setStage2Locked(true);
      setStage3Locked(true);
    } catch (e: any) { toast.error(e?.message || 'Save failed.'); }
    setSubmitting(false);
  };

  // ── Admin: save everything at once ────────────────────────────────────────
  const submitToDatabase = async () => {
    setSubmitting(true);
    try {
      await upsertSubmission({}, 'Official results saved! 🛡️');
    } catch (e: any) { toast.error(e?.message || 'Save failed.'); }
    setSubmitting(false);
  };

  // Validation helpers
  const groupsComplete = Object.keys(GROUPS_DATA).every(gid =>
    [1, 2, 3].every(r => standings[gid]?.[r])
  );
  const thirdsComplete = selectedThirdsIds.length === 8;
  const finalPicked = !!bracketWinners['m104'];
  const completionPct = Math.round(
    ([groupsComplete, thirdsComplete, finalPicked, awards.ball, awards.boot, awards.gloves].filter(Boolean).length / 6) * 100
  );

  if (!hasMounted) return null;

  // ─── LOGIN PAGE ──────────────────────────────────────────────────────────
  if (!isEntryComplete) {
    return (
      <>
        <style>{`
          @keyframes confettiFall {
            0%   { transform: translateY(0) rotate(0deg); opacity: 0.75; }
            100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
          }
          @keyframes pulse-slow { 0%,100% { opacity:1; } 50% { opacity:.6; } }
          @keyframes slideInRight {
            from { transform: translateX(120%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>
        <ToastContainer toasts={toast.toasts} remove={toast.remove} />

        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }}
            />
          </div>

          {/* Top-right: Admin + Live Standings */}
          <div className="fixed top-5 right-5 z-50 flex flex-col items-end gap-3">
            {isAdmin ? (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-xl"
              >
                <ShieldCheck size={14} /> Admin Panel
              </button>
            ) : (
              <button
                onClick={handleAdminLogin}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition border border-white/10 shadow-xl backdrop-blur-sm"
              >
                <Lock size={12} /> Admin
              </button>
            )}
            <MiniStandings />
          </div>

          {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} toast={toast} />}

          <div className="bg-white rounded-[3rem] shadow-2xl max-w-5xl w-full flex flex-col md:flex-row overflow-hidden overflow-y-auto max-h-[95vh] relative z-10">
            {/* Left: Rules */}
            <div className="bg-slate-950 p-10 text-white md:w-5/12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/10">
                  <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-900">
                    <Trophy size={22} />
                  </div>
                  <div>
                    <h1 className="text-xl font-black italic tracking-tight">HERD <span className="text-blue-400">ARENA</span></h1>
                    <p className="text-slate-500 text-[10px] uppercase tracking-widest">World Cup 2026</p>
                  </div>
                </div>
                <h2 className="text-3xl font-black italic tracking-tighter mb-8 text-white">HOW TO<br /><span className="text-blue-400">SCORE</span></h2>
                <div className="space-y-5">
                  {[
                    { icon: Info, color: 'bg-blue-600', title: 'Group Stage', desc: '+2 pts for every correct finishing position (1st, 2nd, 3rd) in each group.' },
                    { icon: Check, color: 'bg-indigo-500', title: 'Knockout Wins', desc: '+5 pts for every correct winner in R32, R16, QF, and SF.' },
                    { icon: Award, color: 'bg-amber-500', title: 'Special Matches', desc: '+10 for 3rd Place winner · +20 for the World Cup Final winner.' },
                    { icon: Star, color: 'bg-emerald-500', title: 'Player Honors', desc: '+5 pts each for Golden Ball, Golden Boot & Golden Gloves.' },
                  ].map(({ icon: Icon, color, title, desc }) => (
                    <div key={title} className="flex gap-4 group">
                      <div className={`${color} p-2.5 rounded-xl h-fit flex-shrink-0 group-hover:scale-110 transition`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="font-black text-sm mb-1">{title}</p>
                        <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Points summary */}
                <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Maximum Points</p>
                  <div className="space-y-1">
                    {[['Group Stage', '72 pts'],
                      ['R32 -> Semi Final', '150 pts'],
                      ['Third Place', '10 pts'],
                      ['World Cup Final', '20 pts'],
                      ['Player Awards', '15 pts'],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between text-xs">
                        <span className="text-slate-400">{l}</span>
                        <span className="font-black text-white">{v}</span>
                      </div>
                    ))}
                    <div className="border-t border-white/10 pt-2 flex justify-between text-sm">
                      <span className="font-black text-blue-400">Grand Total</span>
                      <span className="font-black text-amber-400">267 pts</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-blue-600/10 border border-blue-600/20 rounded-2xl">
                  <p className="text-blue-300 text-xs font-bold">💡 Pro Tip: The Final winner alone is worth +20 pts — that single pick can flip the entire leaderboard!</p>
                </div>
              </div>
            </div>

            {/* Right: Login + confetti + countdown */}
            <div
              id="confetti-container"
              className="p-10 md:p-12 md:w-7/12 flex flex-col justify-center relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full mb-4">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Predictions Open</span>
                  </div>
                  <h2 className="text-4xl font-black italic tracking-tighter text-slate-900 mb-2">
                    Make Your<br /><span className="text-blue-600">Prediction.</span>
                  </h2>
                  <p className="text-slate-400 text-sm">Sign in to join the office championship and lock in your bracket.</p>
                </div>

                <div className="mb-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">⏱ Time Until Kickoff</p>
                  <div className="grid grid-cols-4 gap-2">
                    {([['d', 'days'], ['h', 'hrs'], ['m', 'min'], ['s', 'sec']] as [keyof typeof countdown, string][]).map(([k, l]) => (
                      <div key={k} className="bg-slate-950 rounded-2xl p-3 text-center">
                        <div className="text-2xl font-black text-white tabular-nums">
                          {String(countdown[k]).padStart(2, '0')}
                        </div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Enter your full name..."
                    className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 outline-none font-bold text-base focus:bg-white focus:border-blue-600 transition-all"
                    value={bracketName}
                    onChange={e => setBracketName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  />
                  <button
                    onClick={handleJoin}
                    className="w-full bg-slate-950 text-white p-4 rounded-2xl font-black shadow-xl hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm tracking-widest uppercase"
                  >
                    Enter the Arena <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── MAIN APP ────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes goalPop {
          0%   { transform: scale(0.5); opacity: 1; }
          60%  { transform: scale(1.4); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <ToastContainer toasts={toast.toasts} remove={toast.remove} />
      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} toast={toast} />}

      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-40">
        {/* NAV */}
        <nav className="bg-white border-b border-slate-100 px-6 md:px-10 py-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 p-2 rounded-xl text-white"><Trophy size={16} /></div>
            <div>
              <h1 className="text-sm font-black tracking-tight italic uppercase">Herd Arena</h1>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest">World Cup 2026</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 flex-1 max-w-xs mx-8">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
            </div>
            <span className="text-[10px] font-black text-slate-400">{completionPct}% complete</span>
          </div>

          <div className="flex gap-2 items-center">
            <button onClick={() => setView('bracket')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition ${view === 'bracket' ? 'bg-slate-950 text-white' : 'text-slate-400 hover:bg-slate-100'}`}>BRACKET</button>
            <button onClick={() => setView('leaderboard')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition ${view === 'leaderboard' ? 'bg-slate-950 text-white' : 'text-slate-400 hover:bg-slate-100'}`}>STANDINGS</button>
            <button onClick={() => setView('live')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition flex items-center gap-1.5 ${view === 'live' ? 'bg-slate-950 text-white' : 'text-slate-400 hover:bg-slate-100'}`}><Zap size={12} className="text-amber-400" />LIVE</button>
            {isAdmin ? (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition"
              >
                <ShieldCheck size={14} /> ADMIN
              </button>
            ) : (
              <button onClick={handleAdminLogin} className="text-slate-200 hover:text-slate-400 transition p-2">
                <Lock size={15} />
              </button>
            )}
          </div>
        </nav>

        <main className="max-w-[1900px] mx-auto p-6 md:p-10 space-y-16">
          {view === 'bracket' ? (
            <>
              {/* Hero */}
              <div className="bg-slate-950 rounded-[3rem] p-10 md:p-14 text-white shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.04]"
                  style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    {isLocked
                      ? <span className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase"><Lock size={12} /> Prediction Locked</span>
                      : <span className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase"><Unlock size={12} /> Editing Open</span>
                    }
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-2">
                    Good Luck, <span className="text-blue-400">{bracketName}</span>!
                  </h2>
                  <p className="text-slate-400 text-sm">In the FIFA World Cup 2026, teams are first placed into 12 groups of 4 and play matches with each other. The top two teams from each group, along with the best eight third-placed teams, advance to form a 32-team knockout bracket. These teams are then matched in a fixed bracket for the Round of 32, progressing through single-elimination rounds to the final. Player picks are based on performance, highlighting key contributors for each stage.</p>
                </div>
                <div className="flex gap-3 relative z-10 flex-shrink-0">
                  {([['d', 'days'], ['h', 'hrs'], ['m', 'min'], ['s', 'sec']] as [keyof typeof countdown, string][]).map(([k, l]) => (
                    <div key={k} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-center min-w-[56px]">
                      <div className="text-xl font-black tabular-nums">{String(countdown[k]).padStart(2, '0')}</div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase">{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step indicators */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Groups', done: groupsComplete, icon: Target, desc: 'Select 3 teams from each group' },
                  { label: '8 Best Thirds', done: thirdsComplete, icon: Medal, desc: 'Select 8 teams of 12 thirds' },
                  { label: 'Final Winner', done: finalPicked, icon: Crown, desc: 'Pick your champion' },
                  { label: 'Player Awards', done: !!(awards.ball && awards.boot && awards.gloves), icon: Star, desc: 'Golden Ball, Boot & Gloves' },
                ].map(({ label, done, icon: Icon, desc }) => (
                  <div key={label} className={`p-5 rounded-2xl border-2 transition-all ${done ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {done
                        ? <CheckCircle2 size={16} className="text-emerald-500" />
                        : <Icon size={16} className="text-slate-300" />
                      }
                      <span className={`text-xs font-black uppercase tracking-wide ${done ? 'text-emerald-700' : 'text-slate-500'}`}>{label}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{desc}</p>
                  </div>
                ))}
              </div>

              {/* GROUPS */}
              <section>
                <h2 className="text-2xl font-black italic tracking-tighter mb-6 flex items-center gap-3">
                  <span className="bg-blue-600 text-white w-8 h-8 rounded-xl flex items-center justify-center text-sm">1</span>
                  Group Stage
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {Object.entries(GROUPS_DATA).map(([id, g]: any) => {
                    const used: Record<number, string> = standings[id] || {};
                    const isGroupDone = [1, 2, 3].every(r => used[r]);
                    return (
                      <div key={id} className={`bg-white border-2 rounded-[2rem] p-6 shadow-sm transition ${isGroupDone ? 'border-emerald-200' : 'border-slate-200 hover:border-blue-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Group {id}</h3>
                          {isGroupDone && <CheckCircle2 size={14} className="text-emerald-500" />}
                        </div>
                        <div className="space-y-3">
                          {g.teams.map((t: any) => {
                            const assignedRank = Object.entries(used).find(([, v]) => v === t.id)?.[0];
                            return (
                              <div key={t.id} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-5 h-3.5 object-cover rounded shadow-sm flex-shrink-0" alt="" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-black truncate">{t.n}</p>
                                    <p className="text-[8px] text-slate-300 font-bold">{t.ch}% advance</p>
                                  </div>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  {[1, 2, 3].map(r => {
                                    const active = used[r] === t.id;
                                    const takenByOther = used[r] && used[r] !== t.id;
                                    return (
                                      <button
                                        key={r}
                                        onClick={() => {
                                          if (isLocked && !isAdmin) return;
                                          setStandings(p => {
                                            const grp = { ...(p[id] || {}) };
                                            Object.keys(grp).forEach(k => { if (grp[+k] === t.id) delete grp[+k]; });
                                            if (grp[r]) delete grp[r];
                                            grp[r] = t.id;
                                            return { ...p, [id]: grp };
                                          });
                                        }}
                                        className={`w-7 h-7 text-[9px] font-black rounded-lg transition-all ${active ? 'bg-blue-600 text-white shadow-md scale-110' : takenByOther ? 'bg-slate-100 text-slate-300 cursor-pointer hover:bg-blue-50' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600'} ${isLocked && !isAdmin ? 'cursor-not-allowed opacity-60' : ''}`}
                                      >
                                        {r}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* BEST 3RDS */}
              <section className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 p-8 md:p-12 rounded-[3rem] shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div className="flex items-start gap-4">
                    <span className="bg-amber-500 text-white w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 mt-0.5">2</span>
                    <div>
                      <h2 className="text-2xl font-black text-amber-900 uppercase italic tracking-tighter">8 Best 3rd-Place Teams</h2>
                      <p className="text-xs text-amber-700 font-bold mt-1 max-w-lg">Pick which 8 of your 12 third-place finishers advance to the Round of 32. Per FIFA rules, each R32 slot accepts teams from specific group combinations.</p>
                    </div>
                  </div>
                  <div className={`px-6 py-3 rounded-2xl font-black text-sm transition-all flex-shrink-0 ${selectedThirdsIds.length === 8 ? 'bg-emerald-500 text-white shadow-lg' : 'bg-amber-200 text-amber-800'}`}>
                    {selectedThirdsIds.length}/8 SELECTED
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Object.keys(GROUPS_DATA).map(gid => {
                    const tId = standings[gid]?.[3];
                    const t = tId ? getTeam(tId) : null;
                    if (!t) return (
                      <div key={gid} className="p-5 rounded-[1.8rem] border-2 border-dashed border-amber-200 flex flex-col items-center justify-center gap-2 opacity-50 min-h-[120px]">
                        <p className="text-[8px] font-black text-amber-400 text-center uppercase">Set 3rd<br />Group {gid}</p>
                      </div>
                    );
                    const isSelected = selectedThirdsIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => { if (isLocked && !isAdmin) return; toggleThirdPlaceSelection(t.id); }}
                        className={`p-5 rounded-[1.8rem] border-2 transition-all text-center flex flex-col items-center gap-2 relative overflow-hidden min-h-[120px] justify-center ${isSelected ? 'bg-blue-600 border-blue-700 shadow-xl scale-105 ring-4 ring-blue-200' : 'bg-white border-amber-100 hover:border-blue-300 hover:shadow-md'}`}
                      >
                        <p className={`text-[7px] font-black uppercase tracking-widest ${isSelected ? 'text-blue-200' : 'text-amber-500'}`}>Group {gid}</p>
                        <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-9 shadow-sm rounded-sm" alt="" />
                        <span className={`text-[10px] font-black uppercase truncate w-full text-center leading-tight ${isSelected ? 'text-white' : 'text-slate-800'}`}>{t.n}</span>
                        <div className={`flex items-center gap-1 text-[8px] font-black uppercase ${isSelected ? 'text-blue-200' : 'text-blue-400'}`}>
                          {isSelected ? <><Check size={9} strokeWidth={4} /> Advancing</> : <>+ Select</>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>



              {/* BRACKET */}
              <section>
                <h2 className="text-2xl font-black italic tracking-tighter mb-6 flex items-center gap-3">
                  <span className="bg-indigo-600 text-white w-8 h-8 rounded-xl flex items-center justify-center text-sm">3</span>
                  Knockout Bracket
                </h2>
                <div className="flex gap-6 overflow-x-auto pb-20 no-scrollbar items-start">
                  <BracketCol label="Round of 32" slice={[0, 16]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} />
                  <BracketCol label="Round of 16" slice={[16, 24]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-24 pt-16" />
                  <BracketCol label="Quarter-Finals" slice={[24, 28]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-[310px] pt-44" />
                  <BracketCol label="Semi-Finals" slice={[28, 30]} resolve={resolveTeam} winners={bracketWinners} setWinners={setBracketWinners} spacing="space-y-[640px] pt-[280px]" />

                  {/* Finals column */}
                  <div className="flex-shrink-0 pt-[450px] flex flex-col gap-32">
                    <div className="w-64 p-6 bg-amber-50 border-2 border-amber-200 rounded-[2rem] shadow-sm">
                      <h3 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-4 text-center">🥉 3rd Place Match <span className="text-amber-400">(+10 pts)</span></h3>
                      <MatchBox
                        m={BRACKET_MAPPING[30]}
                        t1={resolveTeam('L101')} t2={resolveTeam('L102')}
                        winner={bracketWinners['m103']}
                        onPick={(w: any) => setBracketWinners((p: any) => ({ ...p, m103: w }))}
                      />
                      <div className="mt-4 border-t border-amber-200 pt-4">
                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2 text-center">Third Place Winner</p>
                        <div className="text-lg font-black text-amber-700 italic uppercase truncate text-center">
                          {bracketWinners['m103']?.n || '???'}
                        </div>
                        {bracketWinners['m103']?.c && (
                          <img src={`https://flagcdn.com/w80/${bracketWinners['m103'].c}.png`} className="w-10 mx-auto mt-2 shadow-md rounded" alt="" />
                        )}
                      </div>
                    </div>

                    <div className="w-80 p-10 bg-white border-[6px] border-slate-950 rounded-[3rem] text-center shadow-2xl">
                      <div className="bg-slate-950 p-4 rounded-2xl mb-6 inline-block">
                        <Award size={40} className="text-amber-400" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">🏆 The Final <span className="text-blue-600">(+20 pts)</span></p>
                      <MatchBox
                        m={BRACKET_MAPPING[31]}
                        t1={resolveTeam('W101')} t2={resolveTeam('W102')}
                        winner={bracketWinners['m104']}
                        onPick={(w: any) => setBracketWinners((p: any) => ({ ...p, m104: w }))}
                      />
                      <div className="mt-6 border-t border-slate-100 pt-5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">World Champion</p>
                        <div className="text-2xl font-black text-blue-600 italic uppercase truncate">
                          {bracketWinners['m104']?.n || '???'}
                        </div>
                        {bracketWinners['m104']?.c && (
                          <img src={`https://flagcdn.com/w80/${bracketWinners['m104'].c}.png`} className="w-12 mx-auto mt-2 shadow-md rounded" alt="" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>



              {/* PLAYER AWARDS */}
              <section>
                <h2 className="text-2xl font-black italic tracking-tighter mb-6 flex items-center gap-3">
                  <span className="bg-indigo-600 text-white w-8 h-8 rounded-xl flex items-center justify-center text-sm">4</span>
                  Player Honors
                </h2>
                <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <p className="text-slate-400 text-sm">+5 pts each. Use the player's exact full name for scoring.</p>
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full text-[10px] font-bold border border-white/10">
                      <Search size={12} /> Google the name for exact spelling
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { l: '🏅 Golden Ball (MVP)', k: 'ball', placeholder: 'e.g. Vinícius Júnior', note: 'Awarded to the best overall player of the tournament — voted by media & coaches.' },
                      { l: '👟 Golden Boot', k: 'boot', placeholder: 'e.g. Kylian Mbappé', note: 'Awarded to the top scorer. Assists break ties, then minutes played.' },
                      { l: '🧤 Golden Gloves', k: 'gloves', placeholder: 'e.g. Emiliano Martínez', note: 'Awarded to the best goalkeeper — judged on saves, clean sheets & impact.' },
                    ].map(a => (
                      <div key={a.k} className="bg-white/5 p-6 rounded-[2rem] border border-white/10">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">{a.l}</label>
                        <p className="text-[9px] text-slate-500 mb-4 leading-relaxed">{a.note}</p>
                        <input
                          type="text"
                          className="w-full bg-transparent border-b-2 border-white/20 outline-none p-2 font-bold text-lg placeholder:text-white/15 focus:border-blue-400 transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          placeholder={a.placeholder}
                          value={(awards as any)[a.k]}
                          disabled={isLocked && !isAdmin}
                          onChange={e => setAwards(p => ({ ...p, [a.k]: e.target.value }))}
                        />
                        {(awards as any)[a.k] && (
                          <p className="text-emerald-400 text-[10px] font-black mt-2 uppercase tracking-widest">✓ Entered</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/10">
                    <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2"><Users size={14} /> Players to Watch</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { n: 'Vinícius Júnior', t: 'Brazil', r: "Ballon d'Or favorite" },
                        { n: 'Kylian Mbappé', t: 'France', r: 'World Cup machine' },
                        { n: 'Jude Bellingham', t: 'England', r: 'Midfield maestro' },
                        { n: 'Lamine Yamal', t: 'Spain', r: '18-year-old wonderkid' },
                        { n: 'Erling Haaland', t: 'Norway', r: 'Striking wizard' },
                        { n: 'Lionel Messi', t: 'Argentina', r: 'The GOAT' },
                        { n: 'Cristiano Ronaldo', t: 'Portugal', r: 'Living legend' },
                        { n: 'João Neves', t: 'Portugal', r: 'Next-gen maestro' },
                      ].map((p, i) => (
                        <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                          <p className="font-black text-xs text-white">{p.n}</p>
                          <p className="text-[9px] font-bold text-blue-400 uppercase mt-0.5">{p.t}</p>
                          <p className="text-[9px] text-slate-500 mt-1">{p.r}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* ── PREDICTIONS CLOSED BANNER ── */}
              {!isAdmin && (
                <div className="rounded-[2rem] border-2 bg-slate-950 border-slate-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="font-black text-base text-white flex items-center gap-2"><Lock size={16} className="text-amber-400" /> Predictions Locked — Tournament Underway</p>
                    <p className="text-xs mt-0.5 text-slate-400">The World Cup has kicked off, so submissions are closed. Your bracket above shows exactly what you predicted. Good luck! 🏆</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-3">
                    <button
                      onClick={downloadExcel}
                      className="flex items-center gap-2 px-6 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest bg-white/5 border-2 border-white/10 text-white hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
                    >
                      <Download size={15} /> Download Predictions
                    </button>
                    <button
                      onClick={() => setView('live')}
                      className="flex items-center gap-2 px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest bg-blue-600 text-white shadow-lg hover:bg-blue-500 transition-all hover:scale-105 active:scale-95"
                    >
                      <Zap size={16} /> See Live Tracker
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : view === 'leaderboard' ? (
            <div className="max-w-2xl mx-auto space-y-8">

              {/* ── STANDINGS HEADER BANNER ── */}
              <StandingsBanner />

              {/* ── STAGE 1 ─────────────────────────────────────────────── */}
              <div className="rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-xl">
                {/* Stage header */}
                <div className="bg-blue-600 px-8 py-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-2xl"><Target size={22} className="text-white" /></div>
                    <div>
                      <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest">Stage 1</p>
                      <h2 className="text-2xl font-black text-white italic tracking-tight">Group Stage</h2>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest">Max Available</p>
                    <p className="text-3xl font-black text-white tabular-nums">72 pts</p>
                  </div>
                </div>
                <div className="bg-white p-6 md:p-8">
                  <PointsBreakdownCard stage="group" />
                  <LeaderboardSection scoreField="group_points" label="group stage" showWinner winnerLabel="Stage 1 Leader" maxStagePts={72} />
                </div>
              </div>

              {/* ── STAGE 2 ─────────────────────────────────────────────── */}
              <div className="rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-xl">
                <div className="bg-purple-700 px-8 py-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-2xl"><Zap size={22} className="text-white" /></div>
                    <div>
                      <p className="text-[9px] font-black text-purple-200 uppercase tracking-widest">Stage 2</p>
                      <h2 className="text-2xl font-black text-white italic tracking-tight">Knockout Bracket</h2>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-purple-200 uppercase tracking-widest">Cumulative Max</p>
                    <p className="text-3xl font-black text-white tabular-nums">252 pts</p>
                  </div>
                </div>
                <div className="bg-white p-6 md:p-8">
                  <PointsBreakdownCard stage="knockout" />
                  <LeaderboardSection scoreField="knockout_points" label="knockout stage" cumulative showWinner winnerLabel="Stage 2 Leader" maxStagePts={252} />
                </div>
              </div>

              {/* ── STAGE 3 / FINAL ─────────────────────────────────────── */}
              <div className="rounded-[2.5rem] overflow-hidden border border-amber-200 shadow-xl">
                <div className="bg-slate-950 px-8 py-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-400/20 p-3 rounded-2xl"><Trophy size={22} className="text-amber-400" /></div>
                    <div>
                      <p className="text-[9px] font-black text-amber-400/70 uppercase tracking-widest">Stage 3</p>
                      <h2 className="text-2xl font-black text-white italic tracking-tight">🏆 Final Championship</h2>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Grand Total Max</p>
                    <p className="text-3xl font-black text-amber-400 tabular-nums">267 pts</p>
                  </div>
                </div>
                <div className="bg-white p-6 md:p-8">
                  <PointsBreakdownCard stage="final" />
                  <LeaderboardSection scoreField="points" label="tournament" isFinal showWinner winnerLabel="Overall Champion 🏆" maxStagePts={267} />
                </div>
              </div>

            </div>
          ) : (
            <LiveTracker bracketName={bracketName} isAdmin={isAdmin} getTeam={getTeam} toast={toast} />
          )}
        </main>

        {/* Admin floating CTA only */}
        {isAdmin && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60]">
            <button
              onClick={submitToDatabase}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-14 py-5 rounded-[2rem] font-black shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 tracking-widest uppercase text-xs disabled:opacity-60"
            >
              {submitting ? <><RefreshCw size={18} className="animate-spin" /> Saving...</> : <><Database size={18} /> Set Official Results</>}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── RESULTS VIEW ─────────────────────────────────────────────────────────────
// Shows official results vs the current user's predictions across all stages.
function ResultsView({ bracketName, getTeam }: { bracketName: string; getTeam: (id: string) => any }) {
  const [official, setOfficial]   = useState<any>(null);
  const [mySub,    setMySub]      = useState<any>(null);
  const [loading,  setLoading]    = useState(true);
  const [section,  setSection]    = useState<'groups' | 'knockout' | 'awards'>('groups');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: off }, { data: sub }] = await Promise.all([
        supabase.from('official_results').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('submissions').select('*').eq('bracket_name', bracketName).maybeSingle(),
      ]);
      setOfficial(off || null);
      setMySub(sub || null);
      setLoading(false);
    };
    load();
  }, [bracketName]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400">
      <RefreshCw size={22} className="animate-spin" />
      <p className="text-xs font-bold">Loading results...</p>
    </div>
  );

  const noResults = !official || (!official.bracket_data?.standings && !official.bracket_data?.bracketWinners && !official.golden_boot && !official.golden_ball && !official.golden_gloves);

  const offStandings    = official?.bracket_data?.standings    || {};
  const offBracket      = official?.bracket_data?.bracketWinners || {};
  const offThirds       = (official?.bracket_data?.thirds as string[]) || [];
  const myStandings     = mySub?.bracket_data?.standings    || {};
  const myBracket       = mySub?.bracket_data?.bracketWinners || {};
  // myThirds = teams colleague placed 3rd in any group (not the admin thirds picker)
  const myThirds: string[] = Object.values((mySub?.bracket_data?.standings || {}) as Record<string, Record<number,string>>).map((grp: any) => grp[3]).filter(Boolean);

  // Score tallies
  let groupHits = 0, groupTotal = 0;
  Object.keys(offStandings).forEach(gid =>
    [1, 2, 3].forEach(r => {
      if (offStandings[gid]?.[r]) {
        groupTotal++;
        if (myStandings[gid]?.[r] === offStandings[gid]?.[r]) groupHits++;
      }
    })
  );

  let knockHits = 0, knockTotal = 0;
  Object.keys(offBracket).forEach(mid => {
    if (offBracket[mid]?.id) {
      knockTotal++;
      if (myBracket[mid]?.id === offBracket[mid]?.id) knockHits++;
    }
  });

  // Thirds: count how many of the official 8 thirds the user also picked
  const thirdsHits = offThirds.length > 0
    ? offThirds.filter(id => myThirds.includes(id)).length
    : 0;

  const awardPairs = [
    { label: '🏅 Golden Ball', offVal: official?.golden_ball, myVal: mySub?.golden_ball },
    { label: '👟 Golden Boot', offVal: official?.golden_boot, myVal: mySub?.golden_boot },
    { label: '🧤 Golden Gloves', offVal: official?.golden_gloves, myVal: mySub?.golden_gloves },
  ].filter(a => a.offVal);
  const awardHits = awardPairs.filter(a => normalizeName(a.myVal || '') === normalizeName(a.offVal || '')).length;

  const groupPts = groupHits * 2;
  const knockPts = Object.keys(offBracket).reduce((sum, mid) => {
    if (myBracket[mid]?.id !== offBracket[mid]?.id) return sum;
    const m = parseInt(mid.substring(1));
    return sum + (m <= 102 ? 5 : m === 103 ? 10 : 20);
  }, 0);
  const awardPts = awardHits * 5;
  const totalPts = groupPts + knockPts + awardPts;

  const hasGroups   = Object.keys(offStandings).length > 0;
  const hasKnockout = true; // Always show Knockout tab — fixtures visible even before results
  const hasAwards   = awardPairs.length > 0;

  const tabs = [
    { id: 'groups',   label: 'Group Stage',  available: hasGroups,   pts: groupPts,  hits: groupHits,             total: groupTotal,                          icon: Target },
    { id: 'knockout', label: 'Knockout',      available: hasKnockout, pts: knockPts,  hits: knockHits + thirdsHits, total: knockTotal + offThirds.length,       icon: Zap    },
    { id: 'awards',   label: 'Player Awards', available: hasAwards,   pts: awardPts,  hits: awardHits,             total: awardPairs.length,                   icon: Star   },
  ] as const;

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ── Hero header ── */}
      <div className="bg-slate-950 rounded-[3rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase mb-3">
              <CheckCircle2 size={12} /> Official Results
            </span>
            <h2 className="text-3xl font-black italic tracking-tighter">
              Your Picks vs <span className="text-emerald-400">Reality</span>
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {bracketName} · See exactly where you scored and where you missed.
            </p>
          </div>
          {/* Total score summary */}
          {!noResults && (
            <div className="flex gap-3 flex-shrink-0">
              {[
                { label: 'Group', pts: groupPts,  color: 'text-blue-400' },
                { label: 'Knockout', pts: knockPts, color: 'text-purple-400' },
                { label: 'Awards', pts: awardPts,  color: 'text-amber-400' },
              ].map(({ label, pts, color }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-center min-w-[64px]">
                  <p className={`text-xl font-black tabular-nums ${color}`}>{pts}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">{label}</p>
                </div>
              ))}
              <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-center min-w-[64px]">
                <p className="text-xl font-black tabular-nums text-white">{totalPts}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Total</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── No results yet state ── */}
      {noResults && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-[2rem] p-10 text-center space-y-3">
          <div className="text-4xl">⏳</div>
          <h3 className="font-black text-amber-900 text-lg">Results Not Published Yet</h3>
          <p className="text-amber-700 text-sm max-w-sm mx-auto">
            Official results will appear here once the admin publishes them after each stage completes. Check back after the group stage, knockout rounds, and finale.
          </p>
        </div>
      )}

      {!noResults && (
        <>
          {/* ── Section tabs ── */}
          <div className="flex gap-2 bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm">
            {tabs.map(({ id, label, available, pts, hits, total, icon: Icon }) => (
              <button
                key={id}
                onClick={() => available && setSection(id)}
                disabled={!available}
                className={`flex-1 flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-center transition-all ${
                  section === id
                    ? 'bg-slate-950 text-white shadow-md'
                    : available
                    ? 'hover:bg-slate-50 text-slate-500'
                    : 'opacity-30 cursor-not-allowed text-slate-400'
                }`}
              >
                <Icon size={14} className={section === id ? 'text-white' : ''} />
                <span className="text-[10px] font-black uppercase tracking-wide">{label}</span>
                {available ? (
                  <span className={`text-[9px] font-bold ${section === id ? 'text-slate-400' : 'text-slate-400'}`}>
                    {hits}/{total} · +{pts}pts
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-slate-300">Pending</span>
                )}
              </button>
            ))}
          </div>

          {/* ── GROUP STAGE ── */}
          {section === 'groups' && hasGroups && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {groupHits} of {groupTotal} positions correct · {groupPts} pts earned
                </p>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">
                  +2 pts per correct position
                </span>
              </div>
              {/* Hit rate bar */}
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
                  style={{ width: `${groupTotal > 0 ? Math.round((groupHits / groupTotal) * 100) : 0}%` }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(GROUPS_DATA).map(([gid, g]: any) => {
                  const offGroup = offStandings[gid] || {};
                  const myGroup  = myStandings[gid]  || {};
                  const hasOfficial = [1, 2, 3].some(r => offGroup[r]);
                  const groupScore  = [1, 2, 3].filter(r => offGroup[r] && myGroup[r] === offGroup[r]).length;

                  return (
                    <div key={gid} className={`bg-white border-2 rounded-[2rem] p-5 shadow-sm ${hasOfficial ? (groupScore === 3 ? 'border-emerald-300' : groupScore > 0 ? 'border-blue-200' : 'border-slate-200') : 'border-dashed border-slate-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Group {gid}</h3>
                        {hasOfficial && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${groupScore === 3 ? 'bg-emerald-100 text-emerald-700' : groupScore > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                            {groupScore}/3 ✓
                          </span>
                        )}
                      </div>
                      {!hasOfficial ? (
                        <p className="text-[10px] text-slate-300 italic">Not yet published</p>
                      ) : (
                        <div className="space-y-2">
                          {/* Column headers */}
                          <div className="grid grid-cols-[20px_1fr_1fr] gap-1 mb-1">
                            <div />
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Official</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Your Pick</p>
                          </div>
                          {[1, 2, 3].map(r => {
                            const offTeam = offGroup[r] ? getTeam(offGroup[r]) : null;
                            const myTeam  = myGroup[r]  ? getTeam(myGroup[r])  : null;
                            const correct = !!(offGroup[r] && myGroup[r] === offGroup[r]);
                            return (
                              <div key={r} className={`grid grid-cols-[20px_1fr_1fr] gap-1 items-center rounded-xl p-1.5 ${correct ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                                <span className="text-[9px] font-black text-slate-400 text-center">{r}</span>
                                {/* Official */}
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {offTeam?.c && <img src={`https://flagcdn.com/w40/${offTeam.c}.png`} className="w-4 h-2.5 object-cover rounded shadow-sm flex-shrink-0" alt="" />}
                                  <span className="text-[10px] font-black truncate text-slate-800">{offTeam?.n || '—'}</span>
                                </div>
                                {/* My pick */}
                                <div className="flex items-center gap-1 min-w-0">
                                  {correct ? (
                                    <span className="text-[9px] font-black text-emerald-600 flex items-center gap-0.5"><CheckCircle2 size={10} /> +2</span>
                                  ) : (
                                    <>
                                      {myTeam?.c && <img src={`https://flagcdn.com/w40/${myTeam.c}.png`} className="w-4 h-2.5 object-cover rounded shadow-sm flex-shrink-0 opacity-50" alt="" />}
                                      <span className="text-[10px] font-bold truncate text-slate-400">{myTeam?.n || '—'}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── KNOCKOUT ── */}
          {section === 'knockout' && (() => {
            // Build round buckets using same mNum logic as scoring:
            // mNum 1–16=R32, 17–24=R16, 25–28=QF, 29–30=SF, 103=3rd, 104=Final
            const allOffIds = Object.keys(offBracket);

            const getRound = (mid: string) => {
              const n = parseInt(mid.substring(1));
              if (n <= 16)   return { label: 'Round of 32',    order: 0, pts: 5  };
              if (n <= 24)   return { label: 'Round of 16',    order: 1, pts: 5  };
              if (n <= 28)   return { label: 'Quarter-Finals', order: 2, pts: 5  };
              if (n <= 30)   return { label: 'Semi-Finals',    order: 3, pts: 5  };
              if (n === 103) return { label: '3rd Place',      order: 4, pts: 10 };
              if (n === 104) return { label: 'Final',          order: 5, pts: 20 };
              return { label: 'Other', order: 6, pts: 5 };
            };

            const roundMap: Record<string, { label: string; order: number; pts: number; ids: string[] }> = {};
            allOffIds.forEach(mid => {
              const r = getRound(mid);
              if (!roundMap[r.label]) roundMap[r.label] = { ...r, ids: [] };
              roundMap[r.label].ids.push(mid);
            });
            const rounds = Object.values(roundMap).sort((a, b) => a.order - b.order);

            const renderRound = (ids: string[], ptsEach: number) => (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ids.map(mid => {
                  const offTeam = offBracket[mid];
                  const myTeam  = myBracket[mid];
                  const correct = !!(offTeam?.id && myTeam?.id && offTeam.id === myTeam.id);
                  const offT    = offTeam?.id ? getTeam(offTeam.id) ?? offTeam : offTeam;
                  const myT     = myTeam?.id  ? getTeam(myTeam.id)  ?? myTeam  : myTeam;
                  return (
                    <div key={mid} className={`flex items-center justify-between gap-2 rounded-2xl border-2 px-4 py-3 ${correct ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        {offT?.c && <img src={`https://flagcdn.com/w40/${offT.c}.png`} className="w-5 h-3.5 object-cover rounded shadow-sm flex-shrink-0" alt="" />}
                        <span className="text-[11px] font-black truncate text-slate-800">{offT?.n || offTeam?.n || '—'}</span>
                        <span className="text-[8px] font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-md flex-shrink-0">Official</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {correct ? (
                          <span className="text-[9px] font-black text-emerald-600 flex items-center gap-0.5 bg-emerald-100 px-2 py-0.5 rounded-lg"><CheckCircle2 size={10} /> +{ptsEach}</span>
                        ) : (
                          <div className="flex items-center gap-1">
                            {myT?.c && <img src={`https://flagcdn.com/w40/${myT.c}.png`} className="w-4 h-2.5 object-cover rounded shadow-sm opacity-50" alt="" />}
                            <span className="text-[10px] font-bold text-slate-400 truncate max-w-[80px]">{myT?.n || myTeam?.n || '—'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );

            return (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {knockHits + thirdsHits} of {knockTotal + offThirds.length} correct · {knockPts} pts earned
                  </p>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">
                    R32/R16/QF/SF +5 · 3rd +10 · Final +20
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                    style={{ width: `${(knockTotal + offThirds.length) > 0 ? Math.round(((knockHits + thirdsHits) / (knockTotal + offThirds.length)) * 100) : 0}%` }}
                  />
                </div>

                {/* ── Best 8 Thirds comparison ── */}
                {offThirds.length > 0 && (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-[2rem] p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xs font-black text-amber-800 uppercase tracking-widest">Best 8 Third-Place Teams</h3>
                        <p className="text-[10px] text-amber-600 font-bold mt-0.5">Which thirds advance to the Round of 32</p>
                      </div>
                      <span className="text-[9px] font-black px-3 py-1 rounded-xl bg-amber-200 text-amber-800">
                        {thirdsHits}/{offThirds.length} matched
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {offThirds.map(tid => {
                        const t       = getTeam(tid);
                        const myPicked = myThirds.includes(tid);
                        return (
                          <div key={tid} className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 ${myPicked ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                            {t?.c && <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-5 h-3.5 object-cover rounded shadow-sm flex-shrink-0" alt="" />}
                            <div className="min-w-0">
                              <p className="text-[10px] font-black truncate text-slate-800">{t?.n || tid}</p>
                              {myPicked
                                ? <p className="text-[8px] font-black text-emerald-600 flex items-center gap-0.5"><CheckCircle2 size={8} /> You picked this</p>
                                : <p className="text-[8px] font-bold text-slate-400">You missed this</p>
                              }
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Show which of my thirds didn't make it */}
                    {myThirds.filter(id => !offThirds.includes(id)).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-amber-200">
                        <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-2">Your picks that didn't advance</p>
                        <div className="flex flex-wrap gap-1.5">
                          {myThirds.filter(id => !offThirds.includes(id)).map(tid => {
                            const t = getTeam(tid);
                            return (
                              <div key={tid} className="flex items-center gap-1.5 bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 opacity-60">
                                {t?.c && <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-4 h-2.5 object-cover rounded flex-shrink-0" alt="" />}
                                <span className="text-[9px] font-bold text-slate-600">{t?.n || tid}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Round-by-round bracket results ── */}
                {rounds.map(r => (
                  <div key={r.label} className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">{r.label}</h3>
                      <span className="text-[9px] font-bold text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-lg">+{r.pts} pts each</span>
                    </div>
                    {renderRound(r.ids, r.pts)}
                  </div>
                ))}
              </div>
            );
          })()}

          {/* ── PLAYER AWARDS ── */}
          {section === 'awards' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {awardHits} of {awardPairs.length} awards correct · {awardPts} pts earned
                </p>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">+5 pts per correct pick</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all"
                  style={{ width: `${awardPairs.length > 0 ? Math.round((awardHits / awardPairs.length) * 100) : 0}%` }}
                />
              </div>

              {!hasAwards && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-[2rem] p-8 text-center">
                  <p className="text-amber-700 font-bold text-sm">Player awards are announced at the end of the tournament.</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: '🏅 Golden Ball', offVal: official?.golden_ball,   myVal: mySub?.golden_ball,   locked: !official?.golden_ball   },
                  { label: '👟 Golden Boot', offVal: official?.golden_boot,   myVal: mySub?.golden_boot,   locked: !official?.golden_boot   },
                  { label: '🧤 Golden Gloves',offVal: official?.golden_gloves, myVal: mySub?.golden_gloves, locked: !official?.golden_gloves },
                ].map(({ label, offVal, myVal, locked }) => {
                  const normOff = normalizeName(offVal || '');
                  const normMy  = normalizeName(myVal  || '');
                  const correct = !locked && normOff && normMy && normOff === normMy;
                  const wrong   = !locked && normOff && normMy && normOff !== normMy;
                  return (
                    <div key={label} className={`bg-white border-2 rounded-[2rem] p-6 shadow-sm ${correct ? 'border-emerald-300' : wrong ? 'border-red-200' : 'border-slate-200'}`}>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{label}</p>
                      {locked ? (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Lock size={14} />
                          <span className="text-xs font-bold italic">Announced at finale</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Official Winner</p>
                            <p className="font-black text-slate-900 text-base">{normOff || '—'}</p>
                          </div>
                          <div className={`rounded-xl px-3 py-2 ${correct ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Your Pick</p>
                            <p className={`font-black text-sm ${correct ? 'text-emerald-700' : 'text-slate-500'}`}>{normMy || '—'}</p>
                          </div>
                          {correct && <p className="text-emerald-600 text-[10px] font-black flex items-center gap-1"><CheckCircle2 size={11} /> Correct! +5 pts</p>}
                          {wrong   && <p className="text-red-400 text-[10px] font-black flex items-center gap-1"><X size={11} /> Missed this one</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── STANDINGS BANNER ─────────────────────────────────────────────────────────
// Displays last-updated timestamp + a contextual note about scoring stage.
function StandingsBanner() {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      // Participant count + stage detection from submissions score columns
      const { data: subs } = await supabase
        .from('submissions')
        .select('points, group_points, knockout_points, awards_points');
      if (subs && subs.length > 0) {
        setParticipantCount(subs.length);
        const anyKnockout = subs.some((r: any) => (r.knockout_points ?? 0) > 0);
        const anyAwards   = subs.some((r: any) => (r.awards_points ?? 0) > 0);
        const anyGroup    = subs.some((r: any) => (r.group_points ?? 0) > 0);
        if (anyAwards) {
          setNote('Results include Group Stage, Knockout rounds & Player Award bonuses.');
        } else if (anyKnockout) {
          setNote('Results include Group Stage + Knockout stage scores. Player Awards pending.');
        } else if (anyGroup) {
          setNote('Results after completion of completed Group Stage matchdays. Knockout stage begins next.');
        } else {
          setNote('Scores update automatically as each stage is completed.');
        }
      }

      // Timestamp: read from official_results — this is updated whenever admin saves/recalculates
      const { data: official } = await supabase
        .from('official_results')
        .select('created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (official?.updated_at || official?.created_at) {
        setLastUpdated(official.updated_at || official.created_at);
      }
    };
    load();
  }, []);

  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null;

  return (
    <div className="rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm">
      {/* Top bar: live badge + timestamp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Official Standings</span>
          </div>
          {participantCount > 0 && (
            <span className="text-[9px] font-bold text-slate-500 border border-slate-700 px-2 py-0.5 rounded-lg">
              {participantCount} participants
            </span>
          )}
        </div>
        {formattedTime && (
          <div className="flex items-center gap-1.5 text-slate-400">
            <RefreshCw size={10} />
            <span className="text-[10px] font-bold">Last updated: <span className="text-slate-300 font-black">{formattedTime}</span></span>
          </div>
        )}
      </div>
      {/* Note bar */}
      <div className="bg-blue-50 border-t border-blue-100 px-6 py-3 flex items-start gap-2.5">
        <Info size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] font-bold text-blue-700 leading-snug">{note || 'Scores update automatically as each stage is completed.'}</p>
      </div>
    </div>
  );
}

// ─── LEADERBOARD SECTION ──────────────────────────────────────────────────────
// scoreField: which column to rank by for this section
// cumulative: show group+knockout combined pts
// isFinal: show final total pts with awards breakdown pill
function LeaderboardSection({
  scoreField,
  label,
  cumulative = false,
  isFinal = false,
  showWinner = false,
  winnerLabel = 'Leader',
  maxStagePts = 72,
}: {
  scoreField: string;
  label: string;
  cumulative?: boolean;
  isFinal?: boolean;
  showWinner?: boolean;
  winnerLabel?: string;
  maxStagePts?: number;
}) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [prev, setPrev] = useState<string[]>([]);

  useEffect(() => {
    supabase
      .from('submissions')
      .select('id, bracket_name, points, group_points, knockout_points, awards_points, created_at')
      .order('points', { ascending: false })
      .then(({ data }) => {
        if (!data) { setLoading(false); return; }
        const storageKey = `prev_lb_${scoreField}`;
        const saved: string[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
        setPrev(saved);
        localStorage.setItem(storageKey, JSON.stringify(data.map((u: any) => u.id)));

        // Sort by the section-relevant field
        const sorted = [...data].sort((a, b) => {
          const aScore = cumulative
            ? ((a.group_points ?? 0) + (a.knockout_points ?? 0))
            : (a[scoreField] ?? 0);
          const bScore = cumulative
            ? ((b.group_points ?? 0) + (b.knockout_points ?? 0))
            : (b[scoreField] ?? 0);
          return bScore - aScore;
        });

        setList(sorted);
        setLoading(false);
      });
  }, [scoreField, cumulative]);

  if (loading) return (
    <div className="text-center py-12 text-slate-400">
      <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
      <p className="text-xs font-bold">Loading {label} standings...</p>
    </div>
  );

  if (list.length === 0) return (
    <p className="text-slate-400 text-center py-10 italic text-sm">No submissions yet. Be the first!</p>
  );

  const getDisplayPts = (u: any) => {
    if (isFinal) return u.points ?? 0;
    if (cumulative) return (u.group_points ?? 0) + (u.knockout_points ?? 0);
    return u[scoreField] ?? 0;
  };

  const medals = ['🥇', '🥈', '🥉'];
  const podiumColors = [
    { bg: 'bg-amber-400',  ring: 'ring-amber-300'  },
    { bg: 'bg-slate-300',  ring: 'ring-slate-200'  },
    { bg: 'bg-orange-400', ring: 'ring-orange-300' },
  ];

  const topEntry = list[0];
  const topPts = topEntry ? getDisplayPts(topEntry) : 0;

  // Score distribution: bucket scores into 6 bins for a mini histogram
  const binCount = 6;
  const bins = Array(binCount).fill(0);
  list.forEach(u => {
    const pts = getDisplayPts(u);
    const idx = Math.min(Math.floor((pts / maxStagePts) * binCount), binCount - 1);
    bins[idx]++;
  });
  const maxBin = Math.max(...bins, 1);

  // ── Score distribution buckets (10 bins, labelled) ──────────────────────────
  const BIN_COUNT = 10;
  const distBins = Array(BIN_COUNT).fill(0);
  list.forEach(u => {
    const pts = getDisplayPts(u);
    const idx = Math.min(Math.floor((pts / maxStagePts) * BIN_COUNT), BIN_COUNT - 1);
    distBins[idx]++;
  });
  const maxDistBin = Math.max(...distBins, 1);

  // accent colours per stage
  const accentBar    = isFinal ? '#f59e0b' : cumulative ? '#a855f7' : '#3b82f6';
  const accentText   = isFinal ? 'text-amber-500' : cumulative ? 'text-purple-600' : 'text-blue-600';
  const accentBadge  = isFinal ? 'bg-amber-100 text-amber-800' : cumulative ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  const rankColors   = ['bg-amber-400','bg-slate-300','bg-orange-400'];

  return (
    <div className="space-y-4 mt-4">

      {/* ── Leader hero card ── */}
      {showWinner && topEntry && topPts > 0 && (
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 border border-white/10 shadow-2xl px-7 py-6">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage:'radial-gradient(circle,#fff 1px,transparent 1px)',backgroundSize:'24px 24px' }} />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-400 flex items-center justify-center text-2xl shadow-lg flex-shrink-0">🥇</div>
              <div>
                <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-0.5">{winnerLabel}</p>
                <p className="font-black text-white text-xl truncate max-w-[200px]">{topEntry.bracket_name}</p>
                {isFinal && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {[
                      { l:'G', v: topEntry.group_points ?? 0,    c:'bg-blue-500/20 text-blue-300' },
                      { l:'K', v: topEntry.knockout_points ?? 0, c:'bg-purple-500/20 text-purple-300' },
                      { l:'A', v: topEntry.awards_points ?? 0,   c:'bg-amber-500/20 text-amber-300' },
                    ].map(({ l, v, c }) => (
                      <span key={l} className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${c}`}>{l} {v}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-4xl font-black tabular-nums text-amber-400">{topPts}</p>
              <p className="text-[9px] text-slate-500 uppercase font-bold">/ {maxStagePts} pts</p>
              <div className="mt-1 h-1.5 w-24 ml-auto bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-amber-400" style={{ width:`${Math.round((topPts/maxStagePts)*100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Score distribution chart ── */}
      {list.length >= 4 && (
        <div className="bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Score Distribution — {list.length} Players</p>
            <p className="text-[9px] font-bold text-slate-400 tabular-nums">0 – {maxStagePts} pts</p>
          </div>
          <div className="flex items-end gap-1" style={{ height: '64px' }}>
            {distBins.map((count, bi) => {
              const MAX_H = 64;
              const hPx  = count > 0 ? Math.max(Math.round((count / maxDistBin) * MAX_H), 6) : 2;
              const lo   = Math.round((bi      / BIN_COUNT) * maxStagePts);
              const hi   = Math.round(((bi+1)  / BIN_COUNT) * maxStagePts);
              return (
                <div key={bi} className="flex-1 flex flex-col items-center group relative" style={{ height: `${MAX_H}px`, justifyContent: 'flex-end' }}>
                  <div
                    className="w-full rounded-t transition-all"
                    style={{
                      height: `${hPx}px`,
                      background: count > 0 ? accentBar : '#e2e8f0',
                      opacity: count > 0 ? 0.85 : 0.25,
                    }}
                  />
                  {/* hover tooltip */}
                  {count > 0 && (
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 pointer-events-none">
                      <div className="bg-slate-900 text-white text-[8px] font-bold rounded-lg px-2 py-1 whitespace-nowrap shadow">
                        {lo}–{hi} pts · {count} player{count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[8px] text-slate-300 font-bold">0</span>
            {[...Array(4)].map((_, qi) => (
              <span key={qi} className="text-[8px] text-slate-300 font-bold">{Math.round(((qi+1)/4)*maxStagePts)}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── League table ── */}
      <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        {/* Table header */}
        <div className="grid grid-cols-[32px_1fr_80px_48px] gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50">
          <div />
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Name</p>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Progress</p>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Pts</p>
        </div>
        {/* Rows */}
        {list.map((u, i) => {
          const pts        = getDisplayPts(u);
          const prevRank   = prev.indexOf(u.id);
          const moved      = prevRank !== -1 ? prevRank - i : 0;
          const pct        = Math.min(Math.round((pts / maxStagePts) * 100), 100);
          const gapToLeader = topPts - pts;
          const isFirst    = i === 0;
          const isTop3     = i < 3;
          const medals     = ['🥇','🥈','🥉'];

          return (
            <div
              key={u.id ?? i}
              className={`grid grid-cols-[32px_1fr_80px_48px] gap-2 items-center px-4 py-3 border-b border-slate-50 last:border-0 transition-colors ${
                isFirst ? 'bg-slate-950 hover:bg-slate-900' : 'hover:bg-slate-50'
              }`}
            >
              {/* Rank */}
              <div className="flex flex-col items-center gap-0.5">
                <span className={`text-sm font-black ${isFirst ? 'text-amber-400' : isTop3 ? 'text-slate-500' : 'text-slate-300'}`}>
                  {i < 3 ? medals[i] : <span className="text-[10px] font-black text-slate-400">#{i+1}</span>}
                </span>
                {moved > 0 && <span className="text-emerald-500 text-[8px] font-black flex items-center leading-none"><ChevronUp size={9}/>+{moved}</span>}
                {moved < 0 && <span className="text-red-400 text-[8px] font-black flex items-center leading-none"><ChevronDown size={9}/>{moved}</span>}
              </div>

              {/* Name + meta */}
              <div className="min-w-0">
                <p className={`font-black text-sm truncate ${isFirst ? 'text-white' : 'text-slate-800'}`}>{u.bracket_name}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {isFinal && pts > 0 && (
                    <>
                      <span className="text-[8px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md">G:{u.group_points??0}</span>
                      <span className="text-[8px] font-black bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md">K:{u.knockout_points??0}</span>
                      <span className="text-[8px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md">A:{u.awards_points??0}</span>
                    </>
                  )}
                  {!isFirst && gapToLeader > 0 && pts > 0 && (
                    <span className="text-[8px] font-bold text-slate-400">-{gapToLeader}</span>
                  )}
                  {pts === 0 && <span className={`text-[8px] italic ${isFirst ? 'text-slate-600' : 'text-slate-300'}`}>pending</span>}
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-1.5">
                <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isFirst ? 'bg-white/10' : 'bg-slate-100'}`}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width:`${pct}%`, background: isFirst ? '#fbbf24' : accentBar }}
                  />
                </div>
                <span className={`text-[8px] font-bold w-7 text-right tabular-nums ${isFirst ? 'text-slate-500' : 'text-slate-400'}`}>{pct}%</span>
              </div>

              {/* Points */}
              <div className="text-right">
                <p className={`font-black text-base tabular-nums ${isFirst ? 'text-amber-400' : accentText}`}>{pts}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── BRACKET COLUMN ───────────────────────────────────────────────────────────
function BracketCol({ label, slice, resolve, winners, setWinners, spacing = 'space-y-4' }: any) {
  return (
    <div className={`w-60 flex-shrink-0 ${spacing}`}>
      <h4 className="text-[9px] font-black text-slate-400 uppercase text-center mb-4 tracking-widest">{label}</h4>
      {BRACKET_MAPPING.slice(slice[0], slice[1]).map((m: any) => (
        <MatchBox
          key={m.id}
          m={m}
          t1={resolve(m.t1)}
          t2={resolve(m.t2)}
          winner={winners[m.id]}
          onPick={(w: any) => setWinners((p: any) => ({ ...p, [m.id]: w }))}
        />
      ))}
    </div>
  );
}

// ─── MATCH BOX ────────────────────────────────────────────────────────────────
function MatchBox({ t1, t2, winner, onPick }: any) {
  const [flash, setFlash] = useState(false);

  const handlePick = (t: any) => {
    if (!t || t.placeholder) return;
    onPick(t);
    setFlash(true);
    setTimeout(() => setFlash(false), 700);
  };

  return (
    <div className={`relative bg-white border-2 rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 mb-3 ${flash ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'}`}>
      {flash && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <span style={{ fontSize: '1.8rem', animation: 'goalPop 0.7s ease-out forwards' }}>⚽</span>
        </div>
      )}
      {[t1, t2].map((t: any, i: number) => {
        const isWinner = winner?.id && t?.id && winner.id === t.id;
        const isLoser = winner?.id && t?.id && winner.id !== t.id;
        return (
          <button
            key={i}
            disabled={!t || !!t.placeholder}
            onClick={() => handlePick(t)}
            className={`w-full text-left px-4 py-3 flex justify-between items-center border-b last:border-0 border-slate-50 transition-all duration-150
              ${isWinner ? 'bg-slate-950 text-white' : isLoser ? 'opacity-40 bg-white' : 'hover:bg-blue-50'}
            `}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              {t?.c
                ? <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-5 h-3.5 object-cover rounded shadow-sm border border-slate-100 flex-shrink-0" alt="" />
                : <div className="w-5 h-3.5 bg-slate-100 rounded-sm flex-shrink-0" />
              }
              <span className={`text-[10px] font-black uppercase tracking-tight truncate leading-tight ${t?.placeholder ? 'text-slate-300 italic font-normal' : isWinner ? 'text-white' : 'text-slate-800'}`}>
                {t?.n || t?.placeholder || 'TBD'}
              </span>
            </div>
            {isWinner && <Check size={14} strokeWidth={3} className="text-blue-400 flex-shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}

// ─── BUMP CHART ───────────────────────────────────────────────────────────────
// Displays all 26 participants' group-stage points across recorded snapshots.
// Each snapshot is a moment in time when the admin clicked "Record Snapshot".
// Shape of a snapshot row: { id, created_at, label, scores: { [bracketName]: number } }

const BUMP_COLORS = [
  '#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6',
  '#ec4899','#06b6d4','#84cc16','#f97316','#6366f1',
  '#14b8a6','#e11d48','#0ea5e9','#a855f7','#22c55e',
  '#fb923c','#64748b','#d946ef','#0891b2','#ca8a04',
  '#7c3aed','#dc2626','#059669','#d97706','#2563eb','#db2777',
];

function BumpChart({ snapshots }: { snapshots: Array<{ id: string; created_at: string; label: string; scores: Record<string, number> }> }) {
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string; pts: number; snap: string } | null>(null);

  if (snapshots.length < 1) return null;

  // Gather all participant names across all snapshots
  const allNames = Array.from(new Set(snapshots.flatMap(s => Object.keys(s.scores)))).sort();
  const W = 900, H = Math.max(560, allNames.length * 20 + 80);
  const PAD_LEFT = 28, PAD_RIGHT = 170, PAD_TOP = 36, PAD_BOTTOM = 36;
  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const chartH = H - PAD_TOP - PAD_BOTTOM;

  const nSnaps = snapshots.length;
  const maxPts = 72;

  const xFor = (snapIdx: number) =>
    nSnaps === 1 ? PAD_LEFT + chartW / 2 : PAD_LEFT + (snapIdx / (nSnaps - 1)) * chartW;

  const yFor = (pts: number) =>
    PAD_TOP + chartH - (pts / maxPts) * chartH;

  // Build smooth SVG path through points using cubic bezier
  const buildPath = (points: Array<[number, number]>) => {
    if (points.length === 1) {
      const [x, y] = points[0];
      return `M ${x},${y}`;
    }
    let d = `M ${points[0][0]},${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      const [x0, y0] = points[i - 1];
      const [x1, y1] = points[i];
      const cpx = (x0 + x1) / 2;
      d += ` C ${cpx},${y0} ${cpx},${y1} ${x1},${y1}`;
    }
    return d;
  };

  const latestSnap = snapshots[snapshots.length - 1];
  // Sort names by their latest points for right-side label ordering
  const namesSortedByLatest = [...allNames].sort(
    (a, b) => (latestSnap.scores[b] ?? 0) - (latestSnap.scores[a] ?? 0)
  );

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: 480, fontFamily: 'inherit' }}
        onMouseLeave={() => { setHoveredName(null); setTooltip(null); }}
      >
        {/* Y-axis grid lines */}
        {[0, 12, 24, 36, 48, 60, 72].map(pts => {
          const y = yFor(pts);
          return (
            <g key={pts}>
              <line x1={PAD_LEFT} y1={y} x2={PAD_LEFT + chartW} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray={pts === 0 || pts === 72 ? '0' : '4 4'} />
              <text x={PAD_LEFT - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8" fontWeight="700">{pts}</text>
            </g>
          );
        })}

        {/* Snapshot x-axis labels */}
        {snapshots.map((snap, si) => (
          <text key={snap.id} x={xFor(si)} y={PAD_TOP - 10} textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="800">
            {snap.label || `Round ${si + 1}`}
          </text>
        ))}

        {/* Vertical snap lines */}
        {snapshots.map((snap, si) => (
          <line key={snap.id} x1={xFor(si)} y1={PAD_TOP} x2={xFor(si)} y2={PAD_TOP + chartH} stroke="#f1f5f9" strokeWidth="1.5" />
        ))}

        {/* Lines per participant */}
        {allNames.map((name, ni) => {
          const color = BUMP_COLORS[ni % BUMP_COLORS.length];
          const points: Array<[number, number]> = snapshots
            .map((snap, si) => snap.scores[name] != null ? [xFor(si), yFor(snap.scores[name])] as [number, number] : null)
            .filter(Boolean) as Array<[number, number]>;

          if (points.length === 0) return null;
          const isHovered = hoveredName === name;
          const isDimmed = hoveredName !== null && !isHovered;

          return (
            <g key={name}>
              <path
                d={buildPath(points)}
                fill="none"
                stroke={color}
                strokeWidth={isHovered ? 3.5 : 2}
                strokeOpacity={isDimmed ? 0.12 : isHovered ? 1 : 0.7}
                style={{ transition: 'stroke-opacity 0.15s, stroke-width 0.15s' }}
              />
              {/* Invisible wider hit area for hover */}
              <path
                d={buildPath(points)}
                fill="none"
                stroke="transparent"
                strokeWidth={16}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredName(name)}
              />
              {/* Dots at each snapshot */}
              {points.map(([x, y], pi) => {
                const pts = snapshots[snapshots.findIndex((_, si) => xFor(si) === x)]?.scores[name];
                return (
                  <circle
                    key={pi}
                    cx={x} cy={y} r={isHovered ? 5 : 3.5}
                    fill={color}
                    fillOpacity={isDimmed ? 0.1 : 1}
                    stroke="white"
                    strokeWidth={isHovered ? 2 : 1.5}
                    style={{ cursor: 'pointer', transition: 'fill-opacity 0.15s, r 0.1s' }}
                    onMouseEnter={e => {
                      setHoveredName(name);
                      const svg = (e.target as SVGElement).closest('svg')!.getBoundingClientRect();
                      const snapIdx = snapshots.findIndex((_, si) => Math.abs(xFor(si) - x) < 1);
                      setTooltip({ x: e.clientX - svg.left, y: e.clientY - svg.top, name, pts: pts ?? 0, snap: snapshots[snapIdx]?.label || `Round ${snapIdx + 1}` });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </g>
          );
        })}

        {/* Right-side name labels — evenly spaced to prevent overlap, with connector lines */}
        {namesSortedByLatest.map((name, rankIdx) => {
          const ni = allNames.indexOf(name);
          const color = BUMP_COLORS[ni % BUMP_COLORS.length];
          const latestPts = latestSnap.scores[name] ?? 0;
          const dataY = yFor(latestPts);
          const labelStep = chartH / (namesSortedByLatest.length - 1);
          const labelY = PAD_TOP + rankIdx * labelStep;
          const isHovered = hoveredName === name;
          const isDimmed = hoveredName !== null && !isHovered;
          return (
            <g
              key={name}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredName(name)}
              onMouseLeave={() => setHoveredName(null)}
            >
              {/* Connector from data point to label */}
              <line
                x1={PAD_LEFT + chartW + 4}
                y1={dataY}
                x2={PAD_LEFT + chartW + 10}
                y2={labelY}
                stroke={color}
                strokeWidth={0.75}
                strokeOpacity={isDimmed ? 0.08 : isHovered ? 0.7 : 0.28}
                strokeDasharray="2 3"
              />
              <circle cx={PAD_LEFT + chartW + 10} cy={labelY} r={2.5} fill={color} fillOpacity={isDimmed ? 0.1 : 1} />
              <text
                x={PAD_LEFT + chartW + 15}
                y={labelY + 3.5}
                fontSize="9"
                fill={color}
                fontWeight={isHovered ? '900' : '700'}
                fillOpacity={isDimmed ? 0.15 : 1}
                style={{ transition: 'fill-opacity 0.15s' }}
              >
                {name.length > 13 ? name.slice(0, 12) + '…' : name} · {latestPts}
              </text>
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip && (
          <g>
            <rect x={tooltip.x - 70} y={tooltip.y - 38} width={140} height={34} rx={8} fill="#0f172a" opacity={0.93} />
            <text x={tooltip.x} y={tooltip.y - 22} textAnchor="middle" fontSize="10" fill="white" fontWeight="800">{tooltip.name}</text>
            <text x={tooltip.x} y={tooltip.y - 10} textAnchor="middle" fontSize="9" fill="#93c5fd">{tooltip.snap} · {tooltip.pts} pts</text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── NAME NORMALISER ─────────────────────────────────────────────────────────
const PLAYER_ALIASES: Record<string, string> = {
  'kylian mbappe':              'Kylian Mbappé',
  'kylian mbappa':              'Kylian Mbappé',
  'kylian mbappé':              'Kylian Mbappé',
  'emiliano martinez':          'Emiliano Martínez',
  'emiliano martínez':          'Emiliano Martínez',
  'courtious':                  'Thibaut Courtois',
  'courtois':                   'Thibaut Courtois',
  'unai simon':                 'Unai Simón',
  'unai simón':                 'Unai Simón',
  'julian alverez':             'Julián Álvarez',
  'julian alvarez':             'Julián Álvarez',
  'julián alvarez':             'Julián Álvarez',
  'julián álvarez':             'Julián Álvarez',
  'julián álvarez (argentina)': 'Julián Álvarez',
  'julian alvarez (argentina)': 'Julián Álvarez',
  'bruno fernades':             'Bruno Fernandes',
  'bruno fernandes':            'Bruno Fernandes',
  'lamine yamal (spain)':       'Lamine Yamal',
  'mike maignan (france)':      'Mike Maignan',
  'pickford':                   'Jordan Pickford',
  'vinicius junior':            'Vinícius Júnior',
  'vinícius júnior':            'Vinícius Júnior',
  'cody gakpo':                 'Cody Gakpo',
  'harry kane':                 'Harry Kane',
  'lionel messi':               'Lionel Messi',
  'lamine yamal':               'Lamine Yamal',
  'erling haaland':             'Erling Haaland',
  'diogo costa':                'Diogo Costa',
  'mike maignan':               'Mike Maignan',
  'alisson becker':             'Alisson Becker',
  'bart verbruggen':            'Bart Verbruggen',
  'julian alvarez':             'Julián Álvarez',
};
function normalizeName(raw: string): string {
  if (!raw) return '';
  return PLAYER_ALIASES[raw.trim().toLowerCase()] ?? raw.trim();
}

type AwardPick = {
  bracketName:   string;
  golden_boot:   string;
  golden_ball:   string;
  golden_gloves: string;
};

// ─── PERSONAL MOMENTUM CARD ───────────────────────────────────────────────────
function PersonalMomentumCard({
  bracketName, snapshots,
}: {
  bracketName: string;
  snapshots: Array<{ id: string; created_at: string; label: string; scores: Record<string, number> }>;
}) {
  if (snapshots.length === 0) return null;
  const latest   = snapshots[snapshots.length - 1];
  const prev     = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null;
  const myLatest = latest.scores[bracketName] ?? 0;
  const myPrev   = prev ? (prev.scores[bracketName] ?? 0) : null;
  const delta    = myPrev !== null ? myLatest - myPrev : null;
  const sorted   = Object.entries(latest.scores).sort((a, b) => b[1] - a[1]);
  const myRank   = sorted.findIndex(([n]) => n === bracketName) + 1;
  const total    = sorted.length;
  const isGaining  = delta !== null && delta > 0;
  const isDropping = delta !== null && delta < 0;
  const percentile = total > 1 ? Math.round(((total - myRank) / (total - 1)) * 100) : 100;
  const barWidth   = Math.round((myLatest / 72) * 100);
  const getMessage = () => {
    if (delta === null) return { text: `You're ranked #${myRank} of ${total}. More snapshots coming!`, color: 'text-slate-400' };
    if (delta >= 6)  return { text: `🔥 On fire! +${delta} pts since the last snapshot.`, color: 'text-amber-400' };
    if (delta >= 2)  return { text: `📈 Moving up — +${delta} pts since ${prev?.label}.`, color: 'text-emerald-400' };
    if (delta === 0) return { text: `Holding steady at #${myRank}. Next round could shake things up.`, color: 'text-slate-400' };
    if (delta <= -4) return { text: `Others pulled ahead. Down ${Math.abs(delta)} pts since ${prev?.label}.`, color: 'text-red-400' };
    return { text: `Down ${Math.abs(delta)} pts since ${prev?.label}. Still plenty to play for!`, color: 'text-orange-400' };
  };
  const { text: msg, color: msgColor } = getMessage();
  return (
    <div className="relative overflow-hidden bg-slate-950 border border-white/10 rounded-[2rem] p-6 shadow-2xl">
      {isGaining && (
        <div className="absolute inset-0 rounded-[2rem] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%,rgba(16,185,129,0.08) 0%,transparent 70%)' }} />
      )}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-2">
            <Zap size={10} /> Your Momentum
          </span>
          <h3 className="text-white text-xl font-black italic tracking-tight truncate max-w-xs">{bracketName}</h3>
          <p className={`text-xs font-bold mt-0.5 ${msgColor}`}>{msg}</p>
        </div>
        <div className="flex-shrink-0 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-center">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Rank</p>
          <p className="text-3xl font-black text-white leading-none mt-1">#{myRank}</p>
          <p className="text-[9px] text-slate-500 font-bold mt-0.5">of {total}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white/5 rounded-2xl p-4 text-center">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Live Pts</p>
          <p className="text-2xl font-black text-blue-400">{myLatest}</p>
          <p className="text-[9px] text-slate-600 font-bold">/ 72</p>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 text-center">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Since Last</p>
          {delta === null ? <p className="text-2xl font-black text-slate-600">—</p> : (
            <p className={`text-2xl font-black flex items-center justify-center gap-0.5 ${isGaining ? 'text-emerald-400' : isDropping ? 'text-red-400' : 'text-slate-500'}`}>
              {isGaining && <TrendingUp size={16} />}{isDropping && <TrendingDown size={16} />}
              {delta > 0 ? `+${delta}` : delta}
            </p>
          )}
          <p className="text-[9px] text-slate-600 font-bold">pts</p>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 text-center">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Top</p>
          <p className={`text-2xl font-black ${percentile >= 75 ? 'text-amber-400' : percentile >= 50 ? 'text-blue-400' : 'text-slate-400'}`}>{percentile}%</p>
          <p className="text-[9px] text-slate-600 font-bold">of players</p>
        </div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Group Stage Progress</p>
          <p className="text-[9px] font-black text-slate-400">{myLatest} / 72 pts</p>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{
            width: `${barWidth}%`,
            background: barWidth >= 70 ? 'linear-gradient(90deg,#10b981,#34d399)' :
                        barWidth >= 40 ? 'linear-gradient(90deg,#3b82f6,#60a5fa)' :
                                        'linear-gradient(90deg,#64748b,#94a3b8)',
          }} />
        </div>
        <div className="flex justify-between mt-1">
          <p className="text-[9px] text-slate-600 font-bold">0</p>
          <p className="text-[9px] text-slate-600 font-bold">72 max</p>
        </div>
      </div>
    </div>
  );
}

// ─── CLOSEST RIVAL CARD ───────────────────────────────────────────────────────
function ClosestRivalCard({ bracketName, snapshots }: {
  bracketName: string;
  snapshots: Array<{ id: string; created_at: string; label: string; scores: Record<string, number> }>;
}) {
  if (snapshots.length === 0) return null;
  const latest = snapshots[snapshots.length - 1];
  const myPts  = latest.scores[bracketName] ?? 0;
  const sorted = Object.entries(latest.scores)
    .filter(([n]) => n !== bracketName)
    .sort((a, b) => Math.abs(a[1] - myPts) - Math.abs(b[1] - myPts));
  if (sorted.length === 0) return null;
  const [rivalName, rivalPts] = sorted[0];
  const diff  = rivalPts - myPts;
  const ahead = diff > 0;
  const tied  = diff === 0;
  return (
    <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-rose-100 p-2 rounded-xl"><Swords size={14} className="text-rose-600" /></div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Closest Rival</p>
          <p className="text-xs font-black text-slate-600">Battle to watch 👀</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 flex-1">
        <div className="flex-1 text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">You</p>
          <p className="font-black text-slate-800 text-sm truncate">{bracketName.split(' ')[0]}</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{myPts}</p>
          <p className="text-[9px] text-slate-400 font-bold">pts</p>
        </div>
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black
          ${tied ? 'bg-slate-200 text-slate-600' : !ahead ? 'bg-blue-600 text-white' : 'bg-rose-100 text-rose-600'}`}>
          {tied ? '=' : !ahead ? '▲' : '▼'}
        </div>
        <div className="flex-1 text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Rival</p>
          <p className="font-black text-slate-800 text-sm truncate">{rivalName.split(' ')[0]}</p>
          <p className={`text-2xl font-black mt-1 ${ahead ? 'text-rose-500' : 'text-slate-400'}`}>{rivalPts}</p>
          <p className="text-[9px] text-slate-400 font-bold">pts</p>
        </div>
      </div>
      <div className={`mt-4 text-center text-xs font-black rounded-xl py-2 px-4
        ${tied ? 'bg-slate-100 text-slate-600' : !ahead ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
        {tied   ? `Dead heat with ${rivalName.split(' ')[0]}! Next correct pick wins it.`
        : !ahead ? `You're ${Math.abs(diff)} pts ahead — ${rivalName.split(' ')[0]} is chasing.`
                 : `${rivalName.split(' ')[0]} leads by ${Math.abs(diff)} pts — one right call closes it.`}
      </div>
    </div>
  );
}

// ─── BIGGEST MOVER CARD ───────────────────────────────────────────────────────
function BiggestMoverCard({ snapshots }: {
  snapshots: Array<{ id: string; created_at: string; label: string; scores: Record<string, number> }>;
}) {
  if (snapshots.length < 2) return null;
  const latest = snapshots[snapshots.length - 1];
  const prev   = snapshots[snapshots.length - 2];
  const deltas = Object.entries(latest.scores).map(([name, pts]) => ({
    name, delta: pts - (prev.scores[name] ?? 0), pts,
  }));
  const topGainer  = [...deltas].sort((a, b) => b.delta - a.delta)[0];
  const topDropper = [...deltas].sort((a, b) => a.delta - b.delta)[0];
  if (!topGainer || topGainer.delta === 0) return null;
  return (
    <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-amber-100 p-2 rounded-xl"><Flame size={14} className="text-amber-600" /></div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Today's Movers</p>
          <p className="text-xs font-black text-slate-600">{prev.label} → {latest.label}</p>
        </div>
      </div>
      <div className="space-y-3 flex-1">
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 text-white w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"><TrendingUp size={13} /></div>
            <div>
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Biggest Jump</p>
              <p className="font-black text-slate-800 text-sm">{topGainer.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-emerald-600">+{topGainer.delta}</p>
            <p className="text-[9px] text-slate-400 font-bold">{topGainer.pts} total</p>
          </div>
        </div>
        {topDropper.delta < 0 && topDropper.name !== topGainer.name && (
          <div className="flex items-center justify-between bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="bg-rose-400 text-white w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"><TrendingDown size={13} /></div>
              <div>
                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Fell Behind</p>
                <p className="font-black text-slate-800 text-sm">{topDropper.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-rose-500">{topDropper.delta}</p>
              <p className="text-[9px] text-slate-400 font-bold">{topDropper.pts} total</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── GOLDEN AWARD CARD ────────────────────────────────────────────────────────
// Full transparency — every participant's pick is visible to everyone.
// Shows: current leader, who picked them (ALL names, no truncation),
// and a full expandable breakdown of every player picked and who chose them.
function GoldenAwardCard({
  emoji, title, leader, subLabel, allPicks, pickKey, locked,
}: {
  emoji: string; title: string; leader: string; subLabel: string;
  allPicks: AwardPick[]; pickKey: keyof Omit<AwardPick, 'bracketName'>; locked?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const normalizedLeader = normalizeName(leader);

  // Group all picks by normalised player name
  const picksByPlayer: Record<string, string[]> = {};
  allPicks.forEach(p => {
    const raw = p[pickKey] as string;
    const n   = normalizeName(raw);
    if (!n) return;
    if (!picksByPlayer[n]) picksByPlayer[n] = [];
    picksByPlayer[n].push(p.bracketName);
  });

  // Sort by most picked → fewest
  const ranked = Object.entries(picksByPlayer).sort((a, b) => b[1].length - a[1].length);
  const total  = allPicks.filter(p => (p[pickKey] as string)).length;

  // Who currently wins (picked the leader)
  const correctPickers = normalizedLeader ? (picksByPlayer[normalizedLeader] || []) : [];

  return (
    <div className="bg-white border-2 border-slate-200 rounded-[2rem] overflow-hidden shadow-sm flex flex-col">
      {/* Card body */}
      <div className="p-6 flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{emoji}</span>
              <div>
                <p className="font-black text-slate-900 text-base leading-tight">
                  {locked ? '???' : (normalizedLeader || '—')}
                </p>
                <p className="text-[10px] text-slate-400 font-bold">
                  {locked ? 'Awarded at finale' : subLabel}
                </p>
              </div>
            </div>
          </div>
          {locked && (
            <div className="bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1 flex items-center gap-1 flex-shrink-0">
              <Lock size={10} className="text-slate-400" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Locked</span>
            </div>
          )}
        </div>

        {/* Who wins if leader holds — ALL names, no truncation */}
        {!locked && normalizedLeader && (
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
              {correctPickers.length > 0
                ? `✅ ${correctPickers.length} colleague${correctPickers.length !== 1 ? 's' : ''} win if ${normalizedLeader} holds`
                : '😬 Nobody picked this — surprise winner incoming!'}
            </p>
            {correctPickers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {correctPickers.map(name => (
                  <span key={name} className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-black px-2.5 py-1 rounded-lg">
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Top bar chart summary */}
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Pick distribution · {total} responses
          </p>
          <div className="space-y-2">
            {ranked.slice(0, 3).map(([name, pickers], idx) => {
              const isLeading = name === normalizedLeader && !locked;
              const pct       = Math.round((pickers.length / total) * 100);
              return (
                <div key={name}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-[10px] font-black truncate max-w-[160px] flex items-center gap-1 ${isLeading ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {isLeading && <span className="text-[8px]">🔥</span>}{name}
                    </span>
                    <span className="text-[9px] font-black text-slate-400 tabular-nums">{pickers.length}/{total}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{
                      width: `${pct}%`,
                      background: isLeading
                        ? 'linear-gradient(90deg,#10b981,#34d399)'
                        : idx === 0 ? 'linear-gradient(90deg,#3b82f6,#60a5fa)' : '#e2e8f0',
                    }} />
                  </div>
                </div>
              );
            })}
            {ranked.length > 3 && !expanded && (
              <p className="text-[9px] text-slate-400 font-bold">+{ranked.length - 3} more players picked below</p>
            )}
          </div>
        </div>
      </div>

      {/* Expand / collapse toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center justify-between w-full px-6 py-3 bg-slate-50 hover:bg-slate-100 border-t border-slate-100 transition text-left"
      >
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
          {expanded ? 'Hide full breakdown' : `Show all ${total} picks — who chose what`}
        </span>
        <ChevronRight size={14} className={`text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Full breakdown — every player, every picker, fully visible */}
      {expanded && (
        <div className="px-6 pb-6 pt-2 space-y-4 border-t border-slate-100 bg-slate-50">
          {ranked.map(([playerName, pickers]) => {
            const isLeading = playerName === normalizedLeader && !locked;
            return (
              <div key={playerName} className={`rounded-2xl border-2 overflow-hidden ${isLeading ? 'border-emerald-300 bg-white' : 'border-slate-200 bg-white'}`}>
                {/* Player header row */}
                <div className={`flex items-center justify-between px-4 py-3 ${isLeading ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2">
                    {isLeading && <span className="text-sm">🔥</span>}
                    <span className={`font-black text-sm ${isLeading ? 'text-emerald-800' : 'text-slate-800'}`}>
                      {playerName}
                    </span>
                    {isLeading && (
                      <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                        Current Leader
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${isLeading ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {pickers.length} pick{pickers.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {/* All pickers — every name, no limit */}
                <div className="px-4 py-3 flex flex-wrap gap-1.5">
                  {pickers.map(name => (
                    <span
                      key={name}
                      className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${
                        isLeading
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          {/* Participants who didn't fill this award */}
          {(() => {
            const didntPick = allPicks
              .filter(p => !normalizeName(p[pickKey] as string))
              .map(p => p.bracketName);
            if (didntPick.length === 0) return null;
            return (
              <div className="rounded-2xl border-2 border-slate-100 bg-white overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
                  <span className="font-black text-sm text-slate-400 italic">No pick entered</span>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-slate-200 text-slate-500">{didntPick.length}</span>
                </div>
                <div className="px-4 py-3 flex flex-wrap gap-1.5">
                  {didntPick.map(name => (
                    <span key={name} className="text-[10px] font-black px-2.5 py-1 rounded-lg border border-slate-100 bg-slate-50 text-slate-400">{name}</span>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── GOLDEN AWARDS RACE ───────────────────────────────────────────────────────
function GoldenAwardsRace({ bracketName }: { bracketName: string }) {
  const [allPicks, setAllPicks] = useState<AwardPick[]>([]);
  const [leaders, setLeaders]   = useState({ boot: '', bootGoals: 0, ball: '', gloves: '' });
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: subs } = await supabase
        .from('submissions')
        .select('bracket_name, golden_boot, golden_ball, golden_gloves');
      setAllPicks((subs || []).map(s => ({
        bracketName:   s.bracket_name  || '',
        golden_boot:   s.golden_boot   || '',
        golden_ball:   s.golden_ball   || '',
        golden_gloves: s.golden_gloves || '',
      })));
      const { data: off } = await supabase
        .from('official_results')
        .select('golden_boot, golden_ball, golden_gloves, boot_goals')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setLeaders({
        boot:      off?.golden_boot || '',
        bootGoals: off?.boot_goals  || 0,
        ball:      off?.golden_ball || '',
        gloves:    off?.golden_gloves || '',
      });
      setLoading(false);
    };
    load();
  }, []);

  const me            = allPicks.find(p => p.bracketName === bracketName);
  const myBoot        = normalizeName(me?.golden_boot   || '');
  const myBall        = normalizeName(me?.golden_ball   || '');
  const myGloves      = normalizeName(me?.golden_gloves || '');
  const myBootMatch   = !!leaders.boot   && myBoot   === normalizeName(leaders.boot);
  const myBallMatch   = !!leaders.ball   && myBall   === normalizeName(leaders.ball);
  const myGlovesMatch = !!leaders.gloves && myGloves === normalizeName(leaders.gloves);
  const myMatchCount  = [myBootMatch, myBallMatch, myGlovesMatch].filter(Boolean).length;

  if (loading) return (
    <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
      <RefreshCw size={14} className="animate-spin" />
      <span className="text-xs font-bold">Loading awards...</span>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <span className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-2">
          <Star size={10} /> Golden Awards Race
        </span>
        <h3 className="text-slate-900 text-xl font-black italic tracking-tight">Who's winning the awards?</h3>
        <p className="text-slate-400 text-xs mt-0.5">
          Boot updates after each matchday · Tap any card to see the full pick breakdown
        </p>
      </div>

      {/* Personal status banner */}
      {(leaders.boot || leaders.ball || leaders.gloves) && (
        <div className={`rounded-2xl px-5 py-4 border-2 flex items-center gap-4 ${
          myMatchCount === 3 ? 'bg-emerald-50 border-emerald-300' :
          myMatchCount >= 1 ? 'bg-blue-50 border-blue-200' :
                              'bg-slate-50 border-slate-200'
        }`}>
          <span className="text-2xl flex-shrink-0">
            {myMatchCount === 3 ? '🏆' : myMatchCount >= 1 ? '⚡' : '😬'}
          </span>
          <div>
            <p className={`font-black text-sm ${myMatchCount >= 1 ? 'text-slate-800' : 'text-slate-500'}`}>
              {myMatchCount === 3 ? 'You called all 3 awards correctly so far — incredible!' :
               myMatchCount === 2 ? 'You\'re on track for 2 of 3 awards (+10 bonus pts)' :
               myMatchCount === 1 ? 'You\'ve got 1 award correct so far (+5 bonus pts if it holds)' :
               'None of your award picks are leading yet — tournament has a long way to go!'}
            </p>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              {[
                { label: '🏅 Ball',   match: myBallMatch,   pick: myBall   },
                { label: '👟 Boot',   match: myBootMatch,   pick: myBoot   },
                { label: '🧤 Gloves', match: myGlovesMatch, pick: myGloves },
              ].map(({ label, match, pick }) => (
                <span key={label} className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${match ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                  {label}: {pick || '—'} {match ? '✓' : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {!leaders.boot && !leaders.ball && !leaders.gloves && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-700 font-bold flex items-center gap-3">
          <Info size={16} className="flex-shrink-0" />
          Admin hasn't set the current award leaders yet. Check back after the next matchday.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <GoldenAwardCard
          emoji="👟" title="Golden Boot"
          leader={leaders.boot}
          subLabel={leaders.bootGoals ? `${leaders.bootGoals} goal${leaders.bootGoals !== 1 ? 's' : ''} · Group Stage` : 'Group Stage'}
          allPicks={allPicks} pickKey="golden_boot" locked={false}
        />
        <GoldenAwardCard
          emoji="🧤" title="Golden Gloves"
          leader={leaders.gloves}
          subLabel="Best keeper · Group Stage"
          allPicks={allPicks} pickKey="golden_gloves" locked={!leaders.gloves}
        />
        <GoldenAwardCard
          emoji="🏅" title="Golden Ball (MVP)"
          leader={leaders.ball}
          subLabel="Tournament MVP"
          allPicks={allPicks} pickKey="golden_ball" locked={!leaders.ball}
        />
      </div>

      <p className="text-[10px] text-slate-400 font-bold text-center">
        ⚡ Boot leader updated after each matchday · Gloves & Ball confirmed at finale · Each correct pick = +5 pts
      </p>
    </div>
  );
}

// ─── LIVE KNOCKOUT VIEW ───────────────────────────────────────────────────────
// Full live bracket experience: qualification summary, round-by-round match cards
// showing both teams, the winner, user's pick, and points earned or missed.
function LiveKnockoutView({ bracketName, getTeam }: { bracketName: string; getTeam: (id: string) => any }) {
  const [official, setOfficial] = useState<any>(null);
  const [mySub,    setMySub]    = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [section,  setSection]  = useState<'groups' | 'knockout' | 'awards'>('groups');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: off }, { data: sub }] = await Promise.all([
        supabase.from('official_results').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('submissions').select('*').eq('bracket_name', bracketName).maybeSingle(),
      ]);
      setOfficial(off || null);
      setMySub(sub || null);
      setLoading(false);
    };
    load();
  }, [bracketName]);

  const offStandings  = official?.bracket_data?.standings      || {};
  const offBracket    = official?.bracket_data?.bracketWinners || {};
  const offThirds     = (official?.bracket_data?.thirds as string[]) || [];
  const myBracket     = mySub?.bracket_data?.bracketWinners    || {};
  const myStandings   = mySub?.bracket_data?.standings         || {};
  // myThirds = teams colleague placed 3rd in any group
  const myThirds: string[] = Object.values((myStandings || {}) as Record<string, Record<number,string>>).map((grp: any) => grp[3]).filter(Boolean);

  const hasGroups   = Object.keys(offStandings).length > 0;
  const hasKnockout = true; // Always show — fixtures visible before any results
  const hasAwards   = !!(official?.golden_ball || official?.golden_boot || official?.golden_gloves);
  const noResults   = !official || (!hasGroups && !hasAwards);

  // ── Score tallies ──────────────────────────────────────────────────────────
  let groupPts = 0;
  Object.keys(offStandings).forEach(gid =>
    [1,2,3].forEach(r => { if (offStandings[gid]?.[r] && myStandings[gid]?.[r] === offStandings[gid]?.[r]) groupPts += 2; })
  );
  // Knockout score — team-based: earn points if your picked team won that round,
  // no matter which fixture slot they were in.
  const offR32set  = new Set(Object.entries(offBracket).filter(([mid]) => { const m=parseInt(mid.substring(1)); return m>=1  && m<=16;  }).map(([,w]:any) => w?.id).filter(Boolean));
  const offR16set  = new Set(Object.entries(offBracket).filter(([mid]) => { const m=parseInt(mid.substring(1)); return m>=17 && m<=24;  }).map(([,w]:any) => w?.id).filter(Boolean));
  const offQFset   = new Set(Object.entries(offBracket).filter(([mid]) => { const m=parseInt(mid.substring(1)); return m>=25 && m<=28;  }).map(([,w]:any) => w?.id).filter(Boolean));
  const offSFset   = new Set(Object.entries(offBracket).filter(([mid]) => { const m=parseInt(mid.substring(1)); return m>=29 && m<=30;  }).map(([,w]:any) => w?.id).filter(Boolean));
  const off3rdId   = offBracket['m103']?.id;
  const offFinalId = offBracket['m104']?.id;

  const myR32set   = new Set(Object.entries(myBracket).filter(([mid]) => { const m=parseInt(mid.substring(1)); return m>=1  && m<=16;  }).map(([,w]:any) => w?.id).filter(Boolean));
  const myR16set   = new Set(Object.entries(myBracket).filter(([mid]) => { const m=parseInt(mid.substring(1)); return m>=17 && m<=24;  }).map(([,w]:any) => w?.id).filter(Boolean));
  const myQFset    = new Set(Object.entries(myBracket).filter(([mid]) => { const m=parseInt(mid.substring(1)); return m>=25 && m<=28;  }).map(([,w]:any) => w?.id).filter(Boolean));
  const mySFset    = new Set(Object.entries(myBracket).filter(([mid]) => { const m=parseInt(mid.substring(1)); return m>=29 && m<=30;  }).map(([,w]:any) => w?.id).filter(Boolean));
  const my3rdId    = myBracket['m103']?.id;
  const myFinalId  = myBracket['m104']?.id;

  let knockPts = 0;
  myR32set.forEach (id => { if (offR32set.has(id))  knockPts += 5;  });
  myR16set.forEach (id => { if (offR16set.has(id))  knockPts += 5;  });
  myQFset.forEach  (id => { if (offQFset.has(id))   knockPts += 5;  });
  mySFset.forEach  (id => { if (offSFset.has(id))   knockPts += 5;  });
  if (my3rdId  && my3rdId  === off3rdId)   knockPts += 10;
  if (myFinalId && myFinalId === offFinalId) knockPts += 20;
  const thirdsHits = offThirds.filter(id => myThirds.includes(id)).length;
  const awardPts = [
    [official?.golden_ball,   mySub?.golden_ball],
    [official?.golden_boot,   mySub?.golden_boot],
    [official?.golden_gloves, mySub?.golden_gloves],
  ].filter(([o, m]) => o && normalizeName(o) === normalizeName(m || '')).length * 5;
  const totalPts = groupPts + knockPts + awardPts;

  // ── Round definitions ──────────────────────────────────────────────────────
  const ROUNDS = [
    { key: 'r32', label: 'Round of 32',    pts: 5,  ids: Array.from({length:16}, (_,i) => `m${i+1}`)   },
    { key: 'r16', label: 'Round of 16',    pts: 5,  ids: Array.from({length:8},  (_,i) => `m${i+17}`)  },
    { key: 'qf',  label: 'Quarter-Finals', pts: 5,  ids: Array.from({length:4},  (_,i) => `m${i+25}`)  },
    { key: 'sf',  label: 'Semi-Finals',    pts: 5,  ids: Array.from({length:2},  (_,i) => `m${i+29}`)  },
    { key: '3p',  label: '3rd Place',      pts: 10, ids: ['m103']                                       },
    { key: 'f',   label: 'The Final 🏆',   pts: 20, ids: ['m104']                                       },
  ];

  const tabs = [
    { id: 'groups',   label: 'Groups',   available: hasGroups,   icon: Target },
    { id: 'knockout', label: 'Knockout', available: hasKnockout, icon: Zap    },
    { id: 'awards',   label: 'Awards',   available: hasAwards,   icon: Star   },
  ] as const;

  if (loading) return (
    <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
      <RefreshCw size={16} className="animate-spin" />
      <span className="text-xs font-bold">Loading results...</span>
    </div>
  );

  if (noResults) return (
    <div className="bg-amber-50 border-2 border-amber-200 rounded-[2rem] p-10 text-center space-y-3">
      <div className="text-4xl">⏳</div>
      <p className="font-black text-amber-900 text-lg">Official results not published yet</p>
      <p className="text-amber-700 text-sm">Results appear here once the admin publishes each stage.</p>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Header with running score ── */}
      <div className="bg-slate-950 rounded-[2.5rem] p-7 md:p-10 text-white shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase mb-3">
              <CheckCircle2 size={12} /> Official Results · Your Picks vs Reality
            </span>
            <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter">
              {bracketName}'s <span className="text-blue-400">Score Breakdown</span>
            </h2>
            <p className="text-slate-400 text-xs mt-1">Green = points earned · Red = wrong pick · Grey = result pending</p>
          </div>
          {/* Score summary pills */}
          <div className="flex gap-2 flex-wrap flex-shrink-0">
            {[
              { label: 'Groups',   pts: groupPts,  max: 72,  color: 'text-blue-400'   },
              { label: 'Knockout', pts: knockPts,  max: 180, color: 'text-purple-400' },
              { label: 'Awards',   pts: awardPts,  max: 15,  color: 'text-amber-400'  },
            ].map(({ label, pts, max, color }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-center min-w-[68px]">
                <p className={`text-xl font-black tabular-nums ${color}`}>{pts}</p>
                <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">{label}</p>
                <p className="text-[7px] text-slate-600">/{max}</p>
              </div>
            ))}
            <div className="bg-white/15 border border-white/25 rounded-2xl px-4 py-3 text-center min-w-[68px]">
              <p className="text-xl font-black tabular-nums text-white">{totalPts}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Total</p>
              <p className="text-[7px] text-slate-500">/267</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-tab switcher ── */}
      <div className="flex gap-2 bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm">
        {tabs.map(({ id, label, available, icon: Icon }) => (
          <button
            key={id}
            onClick={() => available && setSection(id)}
            disabled={!available}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all ${
              section === id ? 'bg-slate-950 text-white shadow-md'
              : available  ? 'hover:bg-slate-50 text-slate-500'
              : 'opacity-30 cursor-not-allowed text-slate-400'
            }`}
          >
            <Icon size={12} />
            {label}
            {!available && <span className="text-[8px] ml-1 normal-case font-bold opacity-60">pending</span>}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════
          GROUP STAGE
      ════════════════════════════════════════════ */}
      {section === 'groups' && hasGroups && (
        <div className="space-y-5">
          {/* Qualification summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Group winners & runners-up */}
            <div className="md:col-span-2 bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest mb-3">
                ✓ Advancing — Group Winners & Runners-Up (24 teams)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(offStandings).flatMap(([, grp]: any) =>
                  [1, 2].map(r => grp[r]).filter(Boolean)
                ).map(tid => {
                  const t = getTeam(tid);
                  return t ? (
                    <div key={tid} className="flex items-center gap-1.5 bg-white border border-blue-100 rounded-lg px-2.5 py-1.5">
                      <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-4 h-2.5 object-cover rounded flex-shrink-0" alt="" />
                      <span className="text-[10px] font-black text-slate-700">{t.n}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
            {/* Best 8 thirds */}
            <div className={`rounded-2xl p-5 border ${offThirds.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-3 text-amber-700">
                {offThirds.length > 0 ? `✓ Best 8 Thirds — ${thirdsHits}/8 you picked` : '⏳ Best 8 Thirds — pending'}
              </p>
              {offThirds.length > 0 ? (
                <div className="space-y-1.5">
                  {offThirds.map(tid => {
                    const t = getTeam(tid);
                    const iPicked = myThirds.includes(tid);
                    return t ? (
                      <div key={tid} className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${iPicked ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                        <img src={`https://flagcdn.com/w40/${t.c}.png`} className="w-4 h-2.5 object-cover rounded flex-shrink-0" alt="" />
                        <span className="text-[10px] font-black text-slate-800 flex-1 truncate">{t.n}</span>
                        {iPicked
                          ? <span className="text-[8px] font-black text-emerald-600 flex-shrink-0">✓ +0</span>
                          : <span className="text-[8px] font-bold text-slate-300 flex-shrink-0">missed</span>}
                      </div>
                    ) : null;
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Admin hasn't published the best thirds yet.</p>
              )}
            </div>
          </div>

          {/* Your group stage score bar */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Your Group Stage Score</p>
              <span className="text-lg font-black text-blue-600">{groupPts} <span className="text-slate-400 text-sm font-bold">/ 72 pts</span></span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all" style={{ width: `${Math.round((groupPts / 72) * 100)}%` }} />
            </div>
          </div>

          {/* All 12 group cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(offStandings).map(([gid, grp]: any) => {
              const myGrp = myStandings[gid] || {};
              const hits  = [1,2,3].filter(r => grp[r] && myGrp[r] === grp[r]).length;
              return (
                <div key={gid} className={`bg-white border-2 rounded-2xl p-4 ${hits === 3 ? 'border-emerald-300' : hits > 0 ? 'border-blue-200' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Group {gid}</h4>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${hits === 3 ? 'bg-emerald-100 text-emerald-700' : hits > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                      {hits}/3 · +{hits * 2}pts
                    </span>
                  </div>
                  {/* Column headers */}
                  <div className="grid grid-cols-[18px_1fr_1fr] gap-1 mb-2">
                    <div /><p className="text-[8px] font-black text-slate-400 uppercase">Official</p><p className="text-[8px] font-black text-slate-400 uppercase">Your Pick</p>
                  </div>
                  {[1, 2, 3].map(r => {
                    const offT = grp[r] ? getTeam(grp[r]) : null;
                    const myT  = myGrp[r] ? getTeam(myGrp[r]) : null;
                    const correct = !!(grp[r] && myGrp[r] === grp[r]);
                    return (
                      <div key={r} className={`grid grid-cols-[18px_1fr_1fr] gap-1 items-center rounded-xl p-1.5 mb-1 ${correct ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                        <span className={`text-[8px] font-black text-center ${r <= 2 ? 'text-emerald-600' : 'text-slate-300'}`}>{r}</span>
                        <div className="flex items-center gap-1 min-w-0">
                          {offT?.c && <img src={`https://flagcdn.com/w40/${offT.c}.png`} className="w-4 h-2.5 object-cover rounded flex-shrink-0" alt="" />}
                          <span className="text-[10px] font-black truncate text-slate-800">{offT?.n || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1 min-w-0">
                          {correct
                            ? <span className="text-[9px] font-black text-emerald-600 flex items-center gap-0.5"><CheckCircle2 size={9}/> +2</span>
                            : <>{myT?.c && <img src={`https://flagcdn.com/w40/${myT.c}.png`} className="w-4 h-2.5 object-cover rounded flex-shrink-0 opacity-50" alt="" />}
                              <span className="text-[10px] font-bold truncate text-slate-400">{myT?.n || '—'}</span></>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          KNOCKOUT BRACKET
      ════════════════════════════════════════════ */}
      {section === 'knockout' && (
        <div className="space-y-6">
          {/* Knockout score bar */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Your Knockout Score</p>
              <span className="text-lg font-black text-purple-600">{knockPts} <span className="text-slate-400 text-sm font-bold">/ 180 pts</span></span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all" style={{ width: `${Math.round((knockPts / 180) * 100)}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 font-bold mt-2">R32/R16/QF/SF = +5 pts each · 3rd Place = +10 · Final = +20</p>
          </div>

          {/* ── How scoring works banner ── */}
          <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl px-5 py-4 flex items-start gap-3">
            <div className="bg-blue-500 rounded-lg p-1.5 flex-shrink-0 mt-0.5"><Info size={13} className="text-white" /></div>
            <div className="space-y-1">
              <p className="text-[11px] font-black text-blue-900 uppercase tracking-wide">How Knockout Points Work</p>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                You earn <span className="font-black">+5 pts</span> for each team you picked to win a round — <span className="font-black">no matter which fixture they play in.</span> If you picked Germany to win R32 and Germany wins any R32 match, you get the points. The fixture slot doesn't matter, only the team.
              </p>
              <p className="text-[10px] text-blue-500 font-bold mt-1">🎯 Your picks for each round are shown as a summary strip above the fixtures — not per match.</p>
            </div>
          </div>

          {/* ── Fixtures: driven directly by BRACKET_MAPPING + official standings ── */}
          {(() => {
            // Use the same resolveTeam logic as the Bracket tab but reading from offStandings
            const resolveOfficial = (slot: string): any => {
              if (!slot) return { placeholder: 'TBD' };
              if (slot.startsWith('W')) {
                const w = offBracket['m' + slot.substring(1)];
                return w ? getTeam(w.id) || w : { placeholder: `Winner M${slot.substring(1)}` };
              }
              if (slot.startsWith('3RD')) {
                const idx = parseInt(slot.split('-')[1]) - 1;
                const tId = offThirds[idx];
                const t = tId ? getTeam(tId) : null;
                return t ? { ...t, label: '3rd' } : { placeholder: `3rd Slot ${idx + 1}` };
              }
              const gId = slot[0]; const rank = parseInt(slot.substring(1));
              const tId = offStandings[gId]?.[rank];
              return tId ? getTeam(tId) : { placeholder: `${rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'} Group ${gId}` };
            };

            const roundDefs = [
              { key:'r32', label:'Round of 32',    pts:5,  ids:BRACKET_MAPPING.slice(0,16).map((m:any)=>m.id),  matches:BRACKET_MAPPING.slice(0,16)  },
              { key:'r16', label:'Round of 16',    pts:5,  ids:BRACKET_MAPPING.slice(16,24).map((m:any)=>m.id), matches:BRACKET_MAPPING.slice(16,24) },
              { key:'qf',  label:'Quarter-Finals', pts:5,  ids:BRACKET_MAPPING.slice(24,28).map((m:any)=>m.id), matches:BRACKET_MAPPING.slice(24,28) },
              { key:'sf',  label:'Semi-Finals',    pts:5,  ids:BRACKET_MAPPING.slice(28,30).map((m:any)=>m.id), matches:BRACKET_MAPPING.slice(28,30) },
              { key:'3p',  label:'3rd Place',      pts:10, ids:['m103'], matches:[BRACKET_MAPPING[30]] },
              { key:'f',   label:'The Final 🏆',   pts:20, ids:['m104'], matches:[BRACKET_MAPPING[31]] },
            ];

            return roundDefs.map(round => {
              const hasAnyResult = round.ids.some(mid => offBracket[mid]);
              const isFinal = round.key === 'f';
              const is3rd   = round.key === '3p';

              // Build a set of match IDs that have been played in this round
              const playedMatchIds = new Set(
                round.ids.filter(mid => offBracket[mid])
              );
              // Build a set of team IDs that LOST in this round (played but didn't win)
              const eliminatedIds = new Set(
                round.ids
                  .filter(mid => offBracket[mid])
                  .flatMap(mid => {
                    const m = BRACKET_MAPPING.find((x:any) => x.id === mid);
                    if (!m) return [];
                    const t1 = resolveOfficial(m.t1);
                    const t2 = resolveOfficial(m.t2);
                    const winnerId = offBracket[mid]?.id;
                    return [t1?.id, t2?.id].filter(id => id && id !== winnerId);
                  })
              );
                Object.entries(offBracket)
                  .filter(([mid2]) => round.ids.includes(mid2))
                  .map(([,w]:any) => w?.id).filter(Boolean)
              );
              const roundHasResults = roundWinnerSet.size > 0;

              // Collect all my picks for this round as a summary strip
              const myRoundPicks = round.ids
                .map(mid => myBracket[mid])
                .filter(Boolean)
                .map(w => getTeam(w.id) || w);
              const myRoundPtsEarned = myRoundPicks.filter(t => roundWinnerSet.has(t.id)).length * round.pts;
              const myRoundCorrect   = myRoundPicks.filter(t => roundWinnerSet.has(t.id));
              const myRoundWrong     = roundHasResults ? myRoundPicks.filter(t => !roundWinnerSet.has(t.id)) : [];

              return (
                <div key={round.key} className={`rounded-[2rem] border-2 overflow-hidden shadow-sm ${isFinal ? 'border-amber-300' : is3rd ? 'border-orange-200' : 'border-slate-200'}`}>
                  {/* Round header */}
                  <div className={`px-5 py-4 border-b ${isFinal ? 'bg-amber-50 border-amber-200' : is3rd ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Swords size={12} className={isFinal ? 'text-amber-600' : is3rd ? 'text-orange-600' : 'text-slate-400'} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isFinal ? 'text-amber-800' : is3rd ? 'text-orange-800' : 'text-slate-600'}`}>{round.label}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${isFinal ? 'bg-amber-200 text-amber-800' : is3rd ? 'bg-orange-200 text-orange-800' : 'bg-purple-100 text-purple-700'}`}>+{round.pts} pts each</span>
                      </div>
                      {roundHasResults
                        ? <span className={`text-sm font-black ${myRoundPtsEarned > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>+{myRoundPtsEarned} pts</span>
                        : <span className="text-[9px] text-slate-400 font-bold italic">upcoming</span>}
                    </div>

                    {/* ── Your picks summary strip ── */}
                    {myRoundPicks.length > 0 && (
                      <div className={`rounded-xl px-3 py-2.5 border ${roundHasResults ? 'bg-white border-slate-200' : 'bg-purple-50 border-purple-100'}`}>
                        <p className="text-[8px] font-black uppercase tracking-widest mb-2 text-slate-400">🎯 Your {round.label} picks</p>
                        <div className="flex flex-wrap gap-2 pt-3">
                          {myRoundPicks.map((t: any, pi: number) => {
                            const isCorrect = roundWinnerSet.has(t.id);
                            const isElim    = eliminatedIds.has(t.id);
                            return (
                              <div key={pi} className="relative flex flex-col items-center gap-0.5">
                                {/* +pts badge on top for winners */}
                                {isCorrect && (
                                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full z-10 whitespace-nowrap">
                                    +{round.pts}
                                  </span>
                                )}
                                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[9px] font-black transition-all ${
                                  isCorrect ? 'bg-emerald-100 border-emerald-300 text-emerald-800' :
                                  isElim    ? 'bg-slate-50 border-slate-200 text-slate-300' :
                                  'bg-white border-purple-200 text-purple-800'
                                }`}>
                                  {t?.c && <img src={`https://flagcdn.com/w40/${t.c}.png`} className={`w-4 h-2.5 object-cover rounded flex-shrink-0 ${isElim ? 'opacity-30' : ''}`} alt="" />}
                                  <span className={isElim ? 'opacity-40' : ''}>{t?.n || t?.name || '?'}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {playedMatchIds.size > 0 && (
                          <p className="text-[8px] font-bold mt-2.5 text-slate-400">
                            {myRoundCorrect.length > 0
                              ? <span className="text-emerald-600">+{myRoundCorrect.length * round.pts} pts earned so far</span>
                              : <span>No points yet</span>
                            }
                            <span className="ml-1">· {round.ids.length - playedMatchIds.size} matches remaining</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Match rows — clean, no pick on right side */}
                  <div className="divide-y divide-slate-50 bg-white">
                    {round.matches.map((m: any) => {
                      const t1 = resolveOfficial(m.t1);
                      const t2 = resolveOfficial(m.t2);
                      const winner   = offBracket[m.id];
                      const isPlayed = !!winner;
                      const winnerT  = winner ? (getTeam(winner.id) || winner) : null;

                      return (
                        <div key={m.id} className="px-5 py-3 flex items-center gap-3">
                          {/* Match teams */}
                          <div className="flex-1 min-w-0">
                            {/* Team 1 */}
                            <div className={`flex items-center gap-2 py-1 ${isPlayed && winnerT?.id !== t1?.id ? 'opacity-30' : ''}`}>
                              {t1?.c
                                ? <img src={`https://flagcdn.com/w40/${t1.c}.png`} className="w-5 h-3.5 object-cover rounded shadow-sm flex-shrink-0" alt="" />
                                : <div className="w-5 h-3.5 bg-slate-100 rounded-sm flex-shrink-0" />}
                              <span className={`text-[11px] font-black uppercase truncate ${t1?.placeholder ? 'text-slate-300 italic font-normal text-[10px]' : 'text-slate-800'}`}>
                                {t1?.n || t1?.placeholder || 'TBD'}
                              </span>
                              {isPlayed && winnerT?.id === t1?.id && <Check size={12} strokeWidth={3} className="text-emerald-500 flex-shrink-0" />}
                            </div>
                            <div className="border-t border-slate-50 my-0.5" />
                            {/* Team 2 */}
                            <div className={`flex items-center gap-2 py-1 ${isPlayed && winnerT?.id !== t2?.id ? 'opacity-30' : ''}`}>
                              {t2?.c
                                ? <img src={`https://flagcdn.com/w40/${t2.c}.png`} className="w-5 h-3.5 object-cover rounded shadow-sm flex-shrink-0" alt="" />
                                : <div className="w-5 h-3.5 bg-slate-100 rounded-sm flex-shrink-0" />}
                              <span className={`text-[11px] font-black uppercase truncate ${t2?.placeholder ? 'text-slate-300 italic font-normal text-[10px]' : 'text-slate-800'}`}>
                                {t2?.n || t2?.placeholder || 'TBD'}
                              </span>
                              {isPlayed && winnerT?.id === t2?.id && <Check size={12} strokeWidth={3} className="text-emerald-500 flex-shrink-0" />}
                            </div>
                          </div>
                          {/* Result badge */}
                          {isPlayed && (
                            <div className="flex-shrink-0 text-right">
                              <span className="text-[9px] font-black text-slate-400 uppercase">Result</span>
                              <p className="text-[10px] font-black text-slate-700">{winnerT?.n || winner?.n} won</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}

        </div>
      )}

      {/* ════════════════════════════════════════════
          PLAYER AWARDS
      ════════════════════════════════════════════ */}
      {section === 'awards' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Your Awards Score</p>
              <span className="text-lg font-black text-amber-600">{awardPts} <span className="text-slate-400 text-sm font-bold">/ 15 pts</span></span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all" style={{ width: `${Math.round((awardPts / 15) * 100)}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: '🏅 Golden Ball (MVP)', offVal: official?.golden_ball,   myVal: mySub?.golden_ball,   pts: 5 },
              { label: '👟 Golden Boot',        offVal: official?.golden_boot,   myVal: mySub?.golden_boot,   pts: 5 },
              { label: '🧤 Golden Gloves',      offVal: official?.golden_gloves, myVal: mySub?.golden_gloves, pts: 5 },
            ].map(({ label, offVal, myVal, pts }) => {
              const normOff = normalizeName(offVal || '');
              const normMy  = normalizeName(myVal  || '');
              const locked  = !offVal;
              const correct = !locked && normOff && normMy && normOff === normMy;
              const wrong   = !locked && normOff && normMy && normOff !== normMy;
              return (
                <div key={label} className={`rounded-2xl border-2 p-5 ${correct ? 'bg-emerald-50 border-emerald-300' : wrong ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">{label}</p>
                  {locked ? (
                    <div className="flex items-center gap-2 text-slate-300 mb-3">
                      <Lock size={14} /><span className="text-sm font-bold italic">Announced at finale</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-black text-slate-900 text-base">{normOff}</p>
                      {correct
                        ? <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-xl">+{pts}</span>
                        : wrong
                        ? <span className="bg-red-400 text-white text-[10px] font-black px-2.5 py-1 rounded-xl">✗</span>
                        : null}
                    </div>
                  )}
                  <div className={`border-t pt-3 ${correct ? 'border-emerald-200' : wrong ? 'border-red-100' : 'border-slate-100'}`}>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Your pick</p>
                    <p className={`text-sm font-black ${correct ? 'text-emerald-700' : wrong ? 'text-red-500 line-through opacity-70' : 'text-slate-600'}`}>
                      {normMy || <span className="italic font-normal text-slate-300">No pick entered</span>}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LIVE GROUP TRACKER ───────────────────────────────────────────────────────
// Reads the admin-maintained `live_standings` table (one row, jsonb `standings`
// shaped exactly like prediction standings: { [groupId]: { 1: teamId, 2: teamId, 3: teamId } })
// and compares it against the current user's saved prediction.
//
// SUPABASE TABLE REQUIRED: live_snapshots
//   id          uuid default gen_random_uuid() primary key
//   created_at  timestamptz default now()
//   label       text  -- e.g. "Matchday 1", "Round 2"
//   scores      jsonb -- { bracketName: points, ... }
function LiveTracker({ bracketName, isAdmin, getTeam, toast }: {
  bracketName: string; isAdmin: boolean; getTeam: (id: string) => any; toast: ReturnType<typeof useToast>;
}) {
  const [live, setLive] = useState<Record<string, Record<number, string>>>({});
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [predicted, setPredicted] = useState<Record<string, Record<number, string>>>({});
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Record<string, Record<number, string>>>({});
  const [saving, setSaving] = useState(false);

  // Snapshot state
  const [snapshots, setSnapshots] = useState<Array<{ id: string; created_at: string; label: string; scores: Record<string, number> }>>([]);
  const [snapshotLabel, setSnapshotLabel] = useState(() => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
  const [recordingSnap, setRecordingSnap] = useState(false);
  const [deletingSnapId, setDeletingSnapId] = useState<string | null>(null);

  const loadLive = async () => {
    const { data } = await supabase
      .from('live_standings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setLive(data?.standings || {});
    setDraft(data?.standings || {});
    setUpdatedAt(data?.updated_at || null);
  };

  const loadPrediction = async () => {
    if (!bracketName) return;
    const { data } = await supabase
      .from('submissions')
      .select('bracket_data')
      .eq('bracket_name', bracketName)
      .maybeSingle();
    setPredicted(data?.bracket_data?.standings || {});
  };

  const loadSnapshots = async () => {
    const { data } = await supabase
      .from('live_snapshots')
      .select('*')
      .order('created_at', { ascending: true });
    setSnapshots(data || []);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadLive(), loadPrediction(), loadSnapshots()]).finally(() => setLoading(false));
  }, [bracketName]);

  const saveLive = async () => {
    setSaving(true);
    try {
      await supabase.from('live_standings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const { error } = await supabase.from('live_standings').insert([{ standings: draft }]);
      if (error) throw error;
      toast.success('Live group standings updated! Everyone will see it instantly. ⚡');
      await loadLive();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save live standings.');
    }
    setSaving(false);
  };

  // Compute each participant's group-stage points against a given standings object
  const computeScoresAgainstStandings = async (liveStandings: Record<string, Record<number, string>>) => {
    const { data: allSubs } = await supabase
      .from('submissions')
      .select('bracket_name, bracket_data');
    const scores: Record<string, number> = {};
    for (const sub of (allSubs || [])) {
      const pred = sub.bracket_data?.standings || {};
      let pts = 0;
      Object.keys(liveStandings).forEach(gid =>
        [1, 2, 3].forEach(r => {
          if (pred[gid]?.[r] && pred[gid][r] === liveStandings[gid]?.[r]) pts += 2;
        })
      );
      scores[sub.bracket_name] = pts;
    }
    return scores;
  };

  const recordSnapshot = async () => {
    if (!snapshotLabel.trim()) { toast.error('Please enter a label for this snapshot (e.g. "Matchday 2")'); return; }
    setRecordingSnap(true);
    try {
      const scores = await computeScoresAgainstStandings(live);
      const { error } = await supabase.from('live_snapshots').insert([{
        label: snapshotLabel.trim(),
        scores,
      }]);
      if (error) throw error;
      toast.success(`Snapshot "${snapshotLabel.trim()}" recorded for ${Object.keys(scores).length} participants! 📸`);
      setSnapshotLabel(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
      await loadSnapshots();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to record snapshot.');
    }
    setRecordingSnap(false);
  };

  const deleteSnapshot = async (id: string) => {
    setDeletingSnapId(id);
    const { error } = await supabase.from('live_snapshots').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Snapshot deleted.'); await loadSnapshots(); }
    setDeletingSnapId(null);
  };

  if (loading) return (
    <div className="text-center py-20 text-slate-400">
      <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
      <p className="text-xs font-bold">Loading live tracker...</p>
    </div>
  );

  const livePoints = Object.keys(GROUPS_DATA).reduce((sum, gid) => {
    return sum + [1, 2, 3].reduce((s, r) => s + (predicted[gid]?.[r] && predicted[gid][r] === live[gid]?.[r] ? 2 : 0), 0);
  }, 0);
  const maxLivePoints = 72;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="bg-slate-950 rounded-[3rem] p-8 md:p-10 text-white shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase mb-3">
            <Zap size={12} /> Live Tournament Tracker
          </span>
          <h2 className="text-3xl font-black italic tracking-tighter">
            Your Picks vs <span className="text-blue-400">Reality</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {updatedAt
              ? `Group standings last updated ${new Date(updatedAt).toLocaleString()}`
              : 'Live group standings have not been published yet — check back after the next round of matches.'}
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-center flex-shrink-0">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Live Group-Stage Points</p>
          <p className="text-3xl font-black text-blue-400">{livePoints} <span className="text-slate-500 text-sm">/ {maxLivePoints}</span></p>
        </div>
      </div>

      {isAdmin && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-[2rem] p-6">
          <h3 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldCheck size={14} /> Admin: Update Current Group Standings
          </h3>
          <p className="text-xs text-emerald-700 mb-4">After each round of group matches, set each group's current 1st / 2nd / 3rd place team here, then save. Every colleague's tracker updates instantly.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {Object.entries(GROUPS_DATA).map(([gid, g]: any) => (
              <div key={gid} className="bg-white rounded-2xl p-4 border border-emerald-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Group {gid}</p>
                {[1, 2, 3].map(r => (
                  <select
                    key={r}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl px-2 py-1.5 mb-1.5 outline-none focus:border-blue-400"
                    value={draft[gid]?.[r] || ''}
                    onChange={e => setDraft(p => ({ ...p, [gid]: { ...(p[gid] || {}), [r]: e.target.value } }))}
                  >
                    <option value="">— {r === 1 ? '1st' : r === 2 ? '2nd' : '3rd'} place —</option>
                    {g.teams.map((t: any) => <option key={t.id} value={t.id}>{t.n}</option>)}
                  </select>
                ))}
              </div>
            ))}
          </div>
          <button
            onClick={saveLive}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-emerald-600 text-white shadow-lg hover:bg-emerald-500 transition-all disabled:opacity-50"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} Publish Live Standings
          </button>

          {/* ── Snapshot recorder ── */}
          <div className="mt-6 pt-6 border-t border-emerald-200">
            <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1 flex items-center gap-2">
              <Target size={12} /> Record Bump Chart Snapshot
            </h4>
            <p className="text-[11px] text-emerald-600 mb-3">
              After publishing standings above, record a snapshot to capture everyone's current points on the trend chart. Give it a label like "Matchday 2" so participants know when it was taken.
            </p>
            <div className="flex gap-3 flex-wrap">
              <input
                type="text"
                placeholder='e.g. "Matchday 2" or "After GW3"'
                value={snapshotLabel}
                onChange={e => setSnapshotLabel(e.target.value)}
                className="flex-1 min-w-[200px] text-xs font-bold border-2 border-emerald-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 bg-white"
              />
              <button
                onClick={recordSnapshot}
                disabled={recordingSnap || !snapshotLabel.trim()}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest bg-slate-950 text-white shadow hover:bg-slate-800 transition-all disabled:opacity-40"
              >
                {recordingSnap ? <RefreshCw size={14} className="animate-spin" /> : <Database size={14} />}
                Record Snapshot
              </button>
            </div>

            {/* Existing snapshots list */}
            {snapshots.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recorded snapshots</p>
                {snapshots.map(snap => (
                  <div key={snap.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-emerald-100">
                    <div>
                      <p className="text-xs font-black text-slate-700">{snap.label}</p>
                      <p className="text-[10px] text-slate-400">{new Date(snap.created_at).toLocaleString()} · {Object.keys(snap.scores).length} participants</p>
                    </div>
                    <button
                      onClick={() => deleteSnapshot(snap.id)}
                      disabled={deletingSnapId === snap.id}
                      className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                    >
                      {deletingSnapId === snap.id ? <RefreshCw size={13} className="animate-spin" /> : <X size={13} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Engagement Cards ── */}
      {snapshots.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <PersonalMomentumCard bracketName={bracketName} snapshots={snapshots} />
          <ClosestRivalCard     bracketName={bracketName} snapshots={snapshots} />
          <BiggestMoverCard     snapshots={snapshots} />
        </div>
      )}

      {/* ── Golden Awards Race ── */}
      <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm">
        <GoldenAwardsRace bracketName={bracketName} />
      </div>

      {/* ── Bump Chart (visible to all) ── */}
      {snapshots.length > 0 && (
        <div className="bg-slate-950 rounded-[2rem] p-6 md:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-2">
                <Zap size={10} /> Points Trend
              </span>
              <h3 className="text-white text-xl font-black italic tracking-tight">Group Stage Bump Chart</h3>
              <p className="text-slate-400 text-xs mt-0.5">Hover a line to highlight a participant · Max 72 pts</p>
            </div>
            <div className="text-[10px] text-slate-500 font-bold text-right">
              {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''} recorded
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4">
            <BumpChart snapshots={snapshots} />
          </div>
          {snapshots.length === 1 && (
            <p className="text-slate-500 text-[10px] text-center mt-3 font-bold">Record a second snapshot to see the trend lines connect ✦</p>
          )}
        </div>
      )}

      {/* ── Group Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {Object.entries(GROUPS_DATA).map(([gid, g]: any) => {
          const groupLive = live[gid] || {};
          const groupPred = predicted[gid] || {};
          const hasLive = [1, 2, 3].some(r => groupLive[r]);
          return (
            <div key={gid} className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-4">Group {gid}</h3>
              {!hasLive ? (
                <p className="text-[10px] text-slate-300 italic">Live standings not published yet.</p>
              ) : (
                <div className="space-y-3">
                  {[1, 2, 3].map(r => {
                    const liveTeam = groupLive[r] ? getTeam(groupLive[r]) : null;
                    const predTeam = groupPred[r] ? getTeam(groupPred[r]) : null;
                    const match = !!(groupPred[r] && groupPred[r] === groupLive[r]);
                    return (
                      <div key={r} className={`flex items-center justify-between gap-2 rounded-xl p-2 ${match ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-100'}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[9px] font-black text-slate-400 w-4">{r}</span>
                          {liveTeam?.c && <img src={`https://flagcdn.com/w40/${liveTeam.c}.png`} className="w-5 h-3.5 object-cover rounded shadow-sm flex-shrink-0" alt="" />}
                          <span className="text-[11px] font-black truncate">{liveTeam?.n || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {match
                            ? <span className="text-[9px] font-black text-emerald-600 flex items-center gap-1"><CheckCircle2 size={11} /> +2</span>
                            : <span className="text-[9px] font-bold text-slate-400 truncate max-w-[140px]">You: {predTeam?.n || '—'}</span>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-5 text-xs text-blue-700 font-bold flex items-start gap-3">
        <Info size={16} className="flex-shrink-0 mt-0.5" />
        <span>Live points here are an early preview only — your official Stage 1 score (shown on the Standings tab) is calculated once the group stage finishes and matches the final official table exactly.</span>
      </div>

      {/* ── Live Knockout View: full bracket results + your picks vs reality ── */}
      <LiveKnockoutView bracketName={bracketName} getTeam={getTeam} />
    </div>
  );
}
