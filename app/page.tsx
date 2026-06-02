'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Trophy, Check, Award, Info, ShieldCheck, Save, ArrowRight,
  Database, Star, Search, Users, Lock, Unlock, ChevronUp, ChevronDown,
  Zap, Target, Crown, Medal, RefreshCw, X, AlertCircle, CheckCircle2
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

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({
  onClose, toast
}: { onClose: () => void; toast: ReturnType<typeof useToast> }) {
  const [tab, setTab] = useState<'official' | 'submissions' | 'recalc'>('official');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [official, setOfficial] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [officialAwards, setOfficialAwards] = useState({ ball: '', boot: '', gloves: '' });
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
        ball: data.golden_ball || '',
        boot: data.golden_boot || '',
        gloves: data.golden_gloves || '',
      });
    }
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
        let score = 0;
        const u = sub.bracket_data || {};
        const o = off.bracket_data || {};

        // Group stage scoring
        Object.keys(o.standings || {}).forEach(gid =>
          [1, 2, 3].forEach(r => {
            if (u.standings?.[gid]?.[r] === o.standings[gid]?.[r]) score += 2;
          })
        );

        // Knockout scoring
        Object.keys(o.bracketWinners || {}).forEach(mid => {
          if (u.bracketWinners?.[mid]?.id === o.bracketWinners[mid]?.id) {
            const m = parseInt(mid.substring(1));
            if (m <= 102) score += 5;
            else if (m === 103) score += 10;
            else if (m === 104) score += 20;
          }
        });

        // Awards scoring — safe lowercase compare
        const safeMatch = (a?: string, b?: string) =>
          a && b && a.trim().toLowerCase() === b.trim().toLowerCase();

        if (safeMatch(sub.golden_ball, off.golden_ball)) score += 5;
        if (safeMatch(sub.golden_boot, off.golden_boot)) score += 5;
        if (safeMatch(sub.golden_gloves, off.golden_gloves)) score += 5;

        await supabase.from('submissions').update({ points: score }).eq('id', sub.id);
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
        golden_ball: officialAwards.ball,
        golden_boot: officialAwards.boot,
        golden_gloves: officialAwards.gloves,
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
        {/* Header */}
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

        {/* Tabs */}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'official' && (
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                <h3 className="text-white font-black mb-4 flex items-center gap-2"><Star size={16} className="text-yellow-400" /> Player Awards (Official)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { l: '🏅 Golden Ball (MVP)', k: 'ball' },
                    { l: '👟 Golden Boot', k: 'boot' },
                    { l: '🧤 Golden Gloves', k: 'gloves' },
                  ].map(a => (
                    <div key={a.k}>
                      <label className="text-slate-400 text-[10px] uppercase font-black block mb-2">{a.l}</label>
                      <input
                        type="text"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-bold text-sm outline-none focus:border-emerald-500 transition"
                        placeholder="Full player name..."
                        value={(officialAwards as any)[a.k]}
                        onChange={e => setOfficialAwards(p => ({ ...p, [a.k]: e.target.value }))}
                      />
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
                  This will compare every submission against the official results and update points.
                  Make sure official results are set first.
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
  const [view, setView] = useState<'bracket' | 'leaderboard'>('bracket');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [bracketName, setBracketName] = useState('');
  const [standings, setStandings] = useState<Record<string, Record<number, string>>>({});
  const [bracketWinners, setBracketWinners] = useState<Record<string, any>>({});
  const [selectedThirdsIds, setSelectedThirdsIds] = useState<string[]>([]);
  const [awards, setAwards] = useState({ ball: '', boot: '', gloves: '' });
  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [isLocked, setIsLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setHasMounted(true);
    const savedName = localStorage.getItem('herd_user_name');
    const savedLocked = localStorage.getItem('herd_locked');
    if (savedName) { setBracketName(savedName); setIsEntryComplete(true); }
    if (savedLocked === '1') setIsLocked(true);
  }, []);

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
    if (isEntryComplete) return;
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
  }, [isEntryComplete]);

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

  const submitToDatabase = async () => {
    if (isLocked && !isAdmin) { toast.error('Your prediction is already locked!'); return; }
    if (selectedThirdsIds.length < 8) {
      toast.error('Select exactly 8 best 3rd-place teams first!');
      return;
    }
    if (!bracketWinners['m104']) {
      toast.error('Pick your World Cup winner first!');
      return;
    }

    setSubmitting(true);
    try {
      const table = isAdmin ? 'official_results' : 'submissions';

      // Build payload — only include columns that exist
      const payload: Record<string, any> = {
        bracket_name: isAdmin ? 'OFFICIAL' : bracketName,
        bracket_data: { standings, bracketWinners, thirds: selectedThirdsIds },
      };

      // Only add award columns if they have values (avoids schema cache errors)
      if (awards.ball.trim()) payload.golden_ball = awards.ball.trim();
      if (awards.boot.trim()) payload.golden_boot = awards.boot.trim();
      if (awards.gloves.trim()) payload.golden_gloves = awards.gloves.trim();

      if (isAdmin) {
        // Upsert official results
        const { error } = await supabase.from(table).insert([payload]);
        if (error) throw error;
        toast.success('Official results saved!');
      } else {
        // Check for existing submission
        const { data: existing } = await supabase
          .from('submissions')
          .select('id')
          .eq('bracket_name', bracketName)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from('submissions')
            .update(payload)
            .eq('id', existing.id);
          if (error) throw error;
          toast.success('Prediction updated & locked! 🔒');
        } else {
          const { error } = await supabase.from('submissions').insert([payload]);
          if (error) throw error;
          toast.success('Prediction locked into the Arena! 🏆');
        }
        localStorage.setItem('herd_locked', '1');
        setIsLocked(true);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Submission failed. Try again.');
    }
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
            {/* Background grid */}
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }}
            />
          </div>

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
                <div className="mt-10 p-4 bg-blue-600/10 border border-blue-600/20 rounded-2xl">
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

                {/* Countdown */}
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

          {/* Progress bar */}
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-xs mx-8">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
            </div>
            <span className="text-[10px] font-black text-slate-400">{completionPct}% complete</span>
          </div>

          <div className="flex gap-2 items-center">
            <button onClick={() => setView('bracket')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition ${view === 'bracket' ? 'bg-slate-950 text-white' : 'text-slate-400 hover:bg-slate-100'}`}>BRACKET</button>
            <button onClick={() => setView('leaderboard')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition ${view === 'leaderboard' ? 'bg-slate-950 text-white' : 'text-slate-400 hover:bg-slate-100'}`}>STANDINGS</button>
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
                  <p className="text-slate-400 text-sm">Fill in groups → pick 8 thirds → complete the bracket → add player picks.</p>
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
                  { label: 'Groups', done: groupsComplete, icon: Target, desc: 'Fill all 12 groups' },
                  { label: '8 Best Thirds', done: thirdsComplete, icon: Medal, desc: 'Select 8 of 12 thirds' },
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
                                          setStandings(p => {
                                            const grp = { ...(p[id] || {}) };
                                            // Remove this team from any existing slot
                                            Object.keys(grp).forEach(k => { if (grp[+k] === t.id) delete grp[+k]; });
                                            // Remove whoever was at rank r
                                            if (grp[r]) delete grp[r];
                                            grp[r] = t.id;
                                            return { ...p, [id]: grp };
                                          });
                                        }}
                                        className={`w-7 h-7 text-[9px] font-black rounded-lg transition-all ${active ? 'bg-blue-600 text-white shadow-md scale-110' : takenByOther ? 'bg-slate-100 text-slate-300 cursor-pointer hover:bg-blue-50' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600'}`}
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
                        onClick={() => toggleThirdPlaceSelection(t.id)}
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
                    {/* 3rd place */}
                    <div className="w-64 p-6 bg-amber-50 border-2 border-amber-200 rounded-[2rem] shadow-sm">
                      <h3 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-4 text-center">🥉 3rd Place Match <span className="text-amber-400">(+10 pts)</span></h3>
                      <MatchBox
                        m={BRACKET_MAPPING[30]}
                        t1={resolveTeam('L101')} t2={resolveTeam('L102')}
                        winner={bracketWinners['m103']}
                        onPick={(w: any) => setBracketWinners((p: any) => ({ ...p, m103: w }))}
                      />
                    </div>

                    {/* Final */}
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
                      { l: '🏅 Golden Ball (MVP)', k: 'ball', placeholder: 'e.g. Vinícius Júnior' },
                      { l: '👟 Golden Boot', k: 'boot', placeholder: 'e.g. Kylian Mbappé' },
                      { l: '🧤 Golden Gloves', k: 'gloves', placeholder: 'e.g. Emiliano Martínez' },
                    ].map(a => (
                      <div key={a.k} className="bg-white/5 p-6 rounded-[2rem] border border-white/10">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-4">{a.l}</label>
                        <input
                          type="text"
                          className="w-full bg-transparent border-b-2 border-white/20 outline-none p-2 font-bold text-lg placeholder:text-white/15 focus:border-blue-400 transition-all text-white"
                          placeholder={a.placeholder}
                          value={(awards as any)[a.k]}
                          onChange={e => setAwards(p => ({ ...p, [a.k]: e.target.value }))}
                        />
                        {(awards as any)[a.k] && (
                          <p className="text-emerald-400 text-[10px] font-black mt-2 uppercase tracking-widest">✓ Entered</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Players to watch */}
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
            </>
          ) : (
            // LEADERBOARD
            <div className="max-w-2xl mx-auto">
              <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-slate-950 p-3 rounded-2xl"><Trophy size={22} className="text-white" /></div>
                  <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">Herd Standings</h2>
                    <p className="text-slate-400 text-xs">Updated after each scoring run</p>
                  </div>
                </div>
                <LeaderboardList />
              </div>
            </div>
          )}
        </main>

        {/* Floating CTA */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-3">
          {isLocked && !isAdmin && (
            <div className="bg-amber-500 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
              <Lock size={12} /> Prediction Locked — Updates Still Allowed
            </div>
          )}
          <button
            onClick={submitToDatabase}
            disabled={submitting}
            className={`text-white px-16 py-5 rounded-[2rem] font-black shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 tracking-widest uppercase text-xs disabled:opacity-60 ${isAdmin ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-slate-950 hover:bg-blue-600'}`}
          >
            {submitting
              ? <><RefreshCw size={18} className="animate-spin" /> Saving...</>
              : isAdmin
                ? <><Database size={18} /> Set Official Results</>
                : <><Save size={18} /> {isLocked ? 'Update Prediction' : 'Lock My Prediction'}</>
            }
          </button>
        </div>
      </div>
    </>
  );
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
function LeaderboardList() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [prev, setPrev] = useState<string[]>([]);

  useEffect(() => {
    supabase
      .from('submissions')
      .select('id, bracket_name, points, created_at')
      .order('points', { ascending: false })
      .then(({ data }) => {
        if (!data) { setLoading(false); return; }
        const saved: string[] = JSON.parse(localStorage.getItem('prev_lb_order') || '[]');
        setPrev(saved);
        localStorage.setItem('prev_lb_order', JSON.stringify(data.map((u: any) => u.id)));
        setList(data);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="text-center py-16 text-slate-400">
      <RefreshCw size={24} className="animate-spin mx-auto mb-3" />
      <p className="text-sm font-bold">Loading standings...</p>
    </div>
  );

  if (list.length === 0) return (
    <p className="text-slate-400 text-center py-12 italic text-sm">No submissions yet. Be the first!</p>
  );

  const medals = ['🥇', '🥈', '🥉'];
  const maxPts = Math.max(...list.map(u => u.points ?? 0), 1);

  return (
    <div className="space-y-3">
      {list.map((u, i) => {
        const prevRank = prev.indexOf(u.id);
        const moved = prevRank !== -1 ? prevRank - i : 0;
        const pct = Math.round(((u.points ?? 0) / maxPts) * 100);
        const isFirst = i === 0;

        return (
          <div
            key={u.id ?? i}
            className={`relative overflow-hidden rounded-[1.8rem] border-2 transition-all ${isFirst ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
          >
            {/* Progress bar background */}
            <div
              className={`absolute left-0 top-0 h-full rounded-[1.8rem] transition-all opacity-10 ${isFirst ? 'bg-blue-400' : 'bg-blue-600'}`}
              style={{ width: `${pct}%` }}
            />
            <div className="relative z-10 flex justify-between items-center p-5">
              <div className="flex items-center gap-4">
                <span className={`font-mono font-black text-xl w-8 text-center ${isFirst ? 'text-blue-400' : 'text-slate-300'}`}>
                  {i < 3 ? medals[i] : `#${i + 1}`}
                </span>
                <div>
                  <p className={`font-black text-base ${isFirst ? 'text-white' : 'text-slate-800'}`}>{u.bracket_name}</p>
                  <p className={`text-[10px] ${isFirst ? 'text-slate-500' : 'text-slate-400'}`}>
                    Submitted {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {moved > 0 && <span className="text-emerald-500 text-xs font-black flex items-center"><ChevronUp size={14} />+{moved}</span>}
                {moved < 0 && <span className="text-red-400 text-xs font-black flex items-center"><ChevronDown size={14} />{moved}</span>}
                <div className="text-right">
                  <p className={`font-black text-2xl ${isFirst ? 'text-white' : 'text-blue-600'}`}>{u.points ?? 0}</p>
                  <p className={`text-[9px] uppercase font-bold ${isFirst ? 'text-slate-500' : 'text-slate-400'}`}>pts</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
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
