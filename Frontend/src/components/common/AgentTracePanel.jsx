import { useEffect, useState } from 'react';
import {
  Sparkles,
  Cpu,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Radio,
  Users,
  TrendingUp,
  Activity,
  Stethoscope,
  Layers,
  AlertCircle,
  RotateCw,
  Terminal,
  Droplet,
  Zap,
} from 'lucide-react';
import api from '../../api/axios';
import { SmallSpinner } from './LoadingSpinner';

const AGENT_CONFIGS = {
  intake: {
    name: 'Clinical Intake Agent',
    role: 'Triage & Urgency Evaluation',
    icon: Stethoscope,
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconBg: 'bg-emerald-600 text-white',
    accentBorder: 'border-l-emerald-500',
  },
  matching: {
    name: 'Geospatial Matching Agent',
    role: 'Multi-Factor Donor Ranking',
    icon: Users,
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    iconBg: 'bg-blue-600 text-white',
    accentBorder: 'border-l-blue-500',
  },
  outreach: {
    name: 'Outreach Dispatch Agent',
    role: 'Phased Multi-Channel Alert Strategy',
    icon: Radio,
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    iconBg: 'bg-amber-600 text-white',
    accentBorder: 'border-l-amber-500',
  },
  forecast: {
    name: 'Inventory Forecast Agent',
    role: 'Predictive Stock Surveillance',
    icon: TrendingUp,
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    iconBg: 'bg-purple-600 text-white',
    accentBorder: 'border-l-purple-500',
  },
  coordinator: {
    name: 'Multi-Agent Orchestrator',
    role: 'LangGraph Consensus & Execution',
    icon: Cpu,
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    iconBg: 'bg-[#C0392B] text-white',
    accentBorder: 'border-l-[#C0392B]',
  },
};

export const AgentTracePanel = ({ requestId, onClose }) => {
  const [trace, setTrace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSteps, setExpandedSteps] = useState({});

  const fetchTrace = async () => {
    if (!requestId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/blood-requests/${requestId}/agent-trace`);
      setTrace(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Agent trace not yet generated or available.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  const toggleStep = (index) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-5 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#C0392B] to-rose-600 text-white shadow-md">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900">Multi-Agent AI Decision Trace</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                <Activity size={12} className="animate-pulse" /> 5 Agents Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Autonomous LangGraph execution path with Claude clinical reasoning logs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            onClick={fetchTrace}
            disabled={loading}
          >
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          {onClose && (
            <button
              type="button"
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100"
              onClick={onClose}
              aria-label="Close trace panel"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <SmallSpinner />
          <p className="mt-3 text-sm font-semibold text-slate-600">Retrieving agent reasoning logs...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="my-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
          <AlertCircle className="mx-auto mb-2 text-amber-600" size={24} />
          <p className="font-bold text-amber-900">{error}</p>
          <p className="mt-1 text-xs text-amber-700">
            Traces are recorded upon request dispatch. If just submitted, click refresh in a few moments.
          </p>
        </div>
      )}

      {/* Trace Stepper Timeline */}
      {!loading && trace && (
        <div className="mt-5 space-y-4">
          {/* Vertical Stepper */}
          <div className="relative pl-6 before:absolute before:bottom-3 before:left-3 before:top-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-400 before:via-blue-400 before:to-[#C0392B]">
            {(trace.steps || []).map((step, index) => {
              const config = AGENT_CONFIGS[step.agent] || {
                name: `${step.agent} agent`,
                role: 'AI Agent',
                icon: Layers,
                badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
                iconBg: 'bg-slate-600 text-white',
                accentBorder: 'border-l-slate-400',
              };
              const Icon = config.icon;
              const isExpanded = Boolean(expandedSteps[index]);
              const timestamp = step.timestamp ? new Date(step.timestamp).toLocaleTimeString() : '';

              return (
                <div key={index} className="relative mb-5 last:mb-0">
                  {/* Timeline icon node */}
                  <div
                    className={`absolute -left-6 top-1 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full shadow-sm ring-4 ring-white ${config.iconBg}`}
                  >
                    <Icon size={12} />
                  </div>

                  {/* Card */}
                  <div
                    className={`rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-all hover:bg-slate-50 border-l-4 ${config.accentBorder}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">{config.name}</span>
                        <span
                          className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-bold ${config.badgeBg}`}
                        >
                          {config.role}
                        </span>
                      </div>
                      {timestamp && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                          <Clock size={12} /> {timestamp}
                        </span>
                      )}
                    </div>

                    {/* Agent Reasoning */}
                    <div className="mt-2.5 rounded-lg bg-white p-3 text-sm text-slate-800 shadow-sm border border-slate-100">
                      <div className="flex items-start gap-2">
                        <Zap size={15} className="mt-0.5 shrink-0 text-amber-500" />
                        <p className="leading-relaxed font-medium">{step.reasoning || 'Executed agent decision criteria.'}</p>
                      </div>
                    </div>

                    {/* Collapsible raw input/output */}
                    {(step.input || step.output) && (
                      <div className="mt-2.5">
                        <button
                          type="button"
                          className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700"
                          onClick={() => toggleStep(index)}
                        >
                          <Terminal size={12} />
                          {isExpanded ? 'Hide Raw Input / Output' : 'Inspect Input / Output'}
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 grid gap-2 rounded-lg bg-slate-900 p-3 font-mono text-xs text-slate-100 sm:grid-cols-2">
                            <div>
                              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Input Payload
                              </p>
                              <pre className="max-h-36 overflow-auto whitespace-pre-wrap text-[11px] text-emerald-300">
                                {JSON.stringify(step.input, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Output Decision
                              </p>
                              <pre className="max-h-36 overflow-auto whitespace-pre-wrap text-[11px] text-cyan-300">
                                {JSON.stringify(step.output, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Final Orchestration Summary Banner */}
          {trace.finalDecision && (
            <div className="rounded-xl border border-rose-200 bg-gradient-to-r from-red-50 to-rose-50 p-4 text-slate-900 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#C0392B] text-white">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-[#C0392B]">
                    Coordinator Consensus & Final Dispatch
                  </p>
                  <p className="mt-1 text-sm font-bold leading-snug text-slate-800">{trace.finalDecision}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentTracePanel;
