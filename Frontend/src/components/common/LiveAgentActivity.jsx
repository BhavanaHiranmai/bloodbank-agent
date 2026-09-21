import { useEffect, useState, useRef } from 'react';
import {
  ClipboardCheck,
  Search,
  Send,
  TrendingUp,
  Network,
  CheckCircle2,
  Sparkles,
  Zap,
  Activity,
  ArrowRight,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/axios';

const AGENTS_METADATA = [
  {
    id: 'intake',
    name: 'Clinical Intake',
    role: 'Triage & Urgency',
    icon: ClipboardCheck,
    description: 'Validates clinical notes, analyzes true urgency, and sets optimal initial radius.',
    accentColor: 'emerald',
  },
  {
    id: 'matching',
    name: 'Geospatial Matching',
    role: '2dsphere & Multi-Scoring',
    icon: Search,
    description: 'Ranks nearby eligible donors by distance, reliability signal, and compatibility.',
    accentColor: 'blue',
  },
  {
    id: 'outreach',
    name: 'Outreach Dispatch',
    role: 'Phased Wave Strategy',
    icon: Send,
    description: 'Plans phased notification waves and dispatches multi-channel emergency alerts.',
    accentColor: 'amber',
  },
  {
    id: 'forecast',
    name: 'Inventory Forecast',
    role: 'Supply Surveillance',
    icon: TrendingUp,
    description: 'Monitors hospital and regional blood inventory for predictive shortage risks.',
    accentColor: 'purple',
  },
  {
    id: 'coordinator',
    name: 'LangGraph Coordinator',
    role: 'Consensus & Execution',
    icon: Network,
    description: 'Orchestrates multi-agent consensus, handles escalation, and executes dispatch.',
    accentColor: 'rose',
  },
];

export const LiveAgentActivity = ({ requestId, onComplete }) => {
  const { socket } = useSocket();
  const [stepsState, setStepsState] = useState(() => ({
    intake: { status: 'idle', reasoning: '', output: null, timestamp: null },
    matching: { status: 'idle', reasoning: '', output: null, timestamp: null },
    outreach: { status: 'idle', reasoning: '', output: null, timestamp: null },
    forecast: { status: 'idle', reasoning: '', output: null, timestamp: null },
    coordinator: { status: 'idle', reasoning: '', output: null, timestamp: null },
  }));
  const [finalDecision, setFinalDecision] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasReceivedLiveEvents, setHasReceivedLiveEvents] = useState(false);
  const mountedRef = useRef(true);

  // 1. Listen for real-time live events from socket
  useEffect(() => {
    mountedRef.current = true;
    if (!socket) return undefined;

    if (requestId) {
      socket.emit('request:join', { requestId });
    }

    const handleStep = (data) => {
      // Accept if no requestId specified or matches current request
      if (requestId && data.requestId && String(data.requestId) !== String(requestId)) return;
      setHasReceivedLiveEvents(true);

      setStepsState((prev) => ({
        ...prev,
        [data.agent]: {
          status: data.status || 'done',
          reasoning: data.reasoning || prev[data.agent]?.reasoning || '',
          output: data.output || prev[data.agent]?.output || null,
          timestamp: data.timestamp || new Date(),
        },
      }));
    };

    const handleComplete = (data) => {
      if (requestId && data.requestId && String(data.requestId) !== String(requestId)) return;
      setHasReceivedLiveEvents(true);
      setFinalDecision(data.finalDecision);
      setIsCompleted(true);
      if (typeof onComplete === 'function') {
        onComplete(data);
      }
    };

    socket.on('agent:step', handleStep);
    socket.on('agent:complete', handleComplete);

    return () => {
      socket.off('agent:step', handleStep);
      socket.off('agent:complete', handleComplete);
      if (requestId) {
        socket.emit('request:leave', { requestId });
      }
    };
  }, [socket, requestId, onComplete]);

  // 2. Fallback fetch: If requestId is provided and no live events have arrived after 1s (e.g. historical request), fetch trace
  useEffect(() => {
    if (!requestId) return undefined;

    let timer = setTimeout(async () => {
      if (!hasReceivedLiveEvents && requestId) {
        try {
          const { data } = await api.get(`/blood-requests/${requestId}/agent-trace`);
          if (data.success && data.data && mountedRef.current) {
            const trace = data.data;
            const updated = {
              intake: { status: 'idle', reasoning: '', output: null, timestamp: null },
              matching: { status: 'idle', reasoning: '', output: null, timestamp: null },
              outreach: { status: 'idle', reasoning: '', output: null, timestamp: null },
              forecast: { status: 'idle', reasoning: '', output: null, timestamp: null },
              coordinator: { status: 'idle', reasoning: '', output: null, timestamp: null },
            };
            (trace.steps || []).forEach((s) => {
              if (updated[s.agent]) {
                updated[s.agent] = {
                  status: 'done',
                  reasoning: s.reasoning,
                  output: s.output,
                  timestamp: s.timestamp,
                };
              }
            });
            setStepsState(updated);
            if (trace.finalDecision) {
              setFinalDecision(trace.finalDecision);
              setIsCompleted(true);
            }
          }
        } catch {
          // Gracefully continue with current state
        }
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      mountedRef.current = false;
    };
  }, [requestId, hasReceivedLiveEvents]);

  const activeCount = Object.values(stepsState).filter((s) => s.status === 'active').length;
  const doneCount = Object.values(stepsState).filter((s) => s.status === 'done').length;
  const isAnyActive = activeCount > 0;
  const isAllDone = doneCount === 5 || isCompleted;

  return (
    <div className="card overflow-hidden border border-slate-200/90 bg-white p-5 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#C0392B] to-rose-600 text-white shadow-sm">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-tight text-slate-900">
                AI Agent Coordination Pipeline
              </h3>
              {isAnyActive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-black text-amber-700">
                  <Activity size={12} className="animate-spin text-amber-600" /> Agents Active & Reasoning
                </span>
              ) : isAllDone ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-black text-emerald-700">
                  <CheckCircle2 size={12} className="text-emerald-600" /> Pipeline Complete
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-slate-400" /> Standby / Idle
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              5 autonomous agents orchestrated in sequence via LangGraph with clinical triage & geospatial reasoning
            </p>
          </div>
        </div>

        {/* State / Progress Pill */}
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-bold">
          <span className="text-slate-500">Pipeline Status:</span>
          {isAnyActive ? (
            <span className="font-black text-amber-700">{doneCount} of 5 Done</span>
          ) : isAllDone ? (
            <span className="font-black text-emerald-700">5 of 5 Dispatched</span>
          ) : (
            <span className="font-bold text-slate-600">Ready on SOS Trigger</span>
          )}
        </div>
      </div>

      {/* 5-Agent Horizontal Pipeline Flow Layout */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {AGENTS_METADATA.map((agent, index) => {
          const current = stepsState[agent.id] || { status: 'idle' };
          const status = current.status;
          const isDone = status === 'done';
          const isActive = status === 'active';
          const isIdle = status === 'idle';
          const Icon = agent.icon;

          return (
            <div key={agent.id} className="relative flex flex-col justify-between">
              {/* Connector Arrow between cards */}
              {index < AGENTS_METADATA.length - 1 && (
                <div className="pointer-events-none absolute -right-2.5 top-8 hidden z-20 -translate-y-1/2 lg:block">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border bg-white shadow-xs transition-all duration-500 ${
                      isDone
                        ? 'border-emerald-300 text-emerald-600'
                        : isActive
                          ? 'border-amber-300 text-amber-600 animate-pulse'
                          : 'border-slate-200 text-slate-300'
                    }`}
                  >
                    <ArrowRight size={11} />
                  </div>
                </div>
              )}

              {/* Agent Card */}
              <div
                className={`flex h-full flex-col justify-between rounded-xl border p-3.5 transition-all duration-300 ${
                  isActive
                    ? 'border-amber-400 bg-gradient-to-b from-amber-50/90 to-amber-100/40 shadow-md ring-2 ring-amber-300/40'
                    : isDone
                      ? 'border-emerald-300 bg-gradient-to-b from-emerald-50/60 to-white shadow-xs'
                      : 'border-slate-200/90 bg-slate-50/60 hover:bg-slate-50'
                }`}
              >
                <div>
                  {/* Top row: Agent Icon + Status Indicator */}
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-xs transition-all ${
                        isActive
                          ? 'bg-amber-500 text-white animate-bounce shadow-amber-200'
                          : isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <Icon size={16} />
                    </div>

                    {/* Status Badge */}
                    {isActive && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" /> Active
                      </span>
                    )}
                    {isDone && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800">
                        <CheckCircle2 size={10} /> Done
                      </span>
                    )}
                    {isIdle && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Idle
                      </span>
                    )}
                  </div>

                  {/* Agent Header Titles */}
                  <div className="mt-2.5">
                    <h4 className="text-sm font-black text-slate-900">{agent.name}</h4>
                    <p className="text-[11px] font-bold text-slate-500">{agent.role}</p>
                  </div>
                </div>

                {/* Description and Live Reasoning Box (Always visible content) */}
                <div className="mt-3 space-y-2">
                  {/* Always-visible agent job description */}
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    {agent.description}
                  </p>

                  {/* Active / Thinking State */}
                  {isActive && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] font-medium text-amber-900 animate-pulse">
                      <Zap size={13} className="shrink-0 text-amber-600" />
                      <span>{current.reasoning || 'Executing agent inference...'}</span>
                    </div>
                  )}

                  {/* Done State: Reasoning Output */}
                  {isDone && current.reasoning && (
                    <div className="rounded-lg border border-emerald-200/90 bg-emerald-50/70 p-2 text-[11px] font-medium leading-snug text-emerald-950 shadow-2xs">
                      <div className="flex items-start gap-1">
                        <span className="shrink-0 text-emerald-700 font-bold">✓</span>
                        <p>{current.reasoning}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Coordinator Consensus Directive Banner */}
      {finalDecision && (
        <div className="mt-5 rounded-xl border border-rose-200 bg-gradient-to-r from-red-50 via-rose-50 to-white p-4 text-slate-900 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C0392B] text-white shadow-xs">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#C0392B]">
                  Coordinator Final Directive & Dispatch
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  <CheckCircle2 size={10} /> Dispatched Live
                </span>
              </div>
              <p className="mt-1 text-sm font-bold leading-relaxed text-slate-800">{finalDecision}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveAgentActivity;
