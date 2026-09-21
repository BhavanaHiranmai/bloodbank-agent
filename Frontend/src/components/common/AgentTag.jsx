import { useState } from 'react';
import { Zap, ChevronDown, ChevronUp, Check, Activity } from 'lucide-react';

export const AgentTag = ({
  agentName,
  status = 'idle',
  reasoning = '',
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isDone = status === 'done';
  const isActive = status === 'active';
  const isIdle = status === 'idle' || !status;
  const hasReasoning = Boolean(reasoning && reasoning.trim().length > 0);

  const toggleExpand = () => {
    if (hasReasoning) {
      setIsExpanded((prev) => !prev);
    }
  };

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      {/* Inline Pill */}
      <button
        type="button"
        onClick={toggleExpand}
        disabled={!hasReasoning}
        title={hasReasoning ? (isExpanded ? 'Click to collapse reasoning' : 'Click to view agent reasoning') : undefined}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-all select-none ${
          isActive
            ? 'border-amber-300 bg-amber-50/90 text-amber-900 shadow-2xs animate-pulse'
            : isDone
              ? hasReasoning
                ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100/80 cursor-pointer shadow-2xs'
                : 'border-emerald-200 bg-emerald-50/60 text-emerald-800'
              : 'border-slate-200 bg-slate-100/90 text-slate-500'
        }`}
      >
        <Zap
          size={11}
          className={`shrink-0 ${
            isActive
              ? 'text-amber-600 animate-spin'
              : isDone
                ? 'text-emerald-600'
                : 'text-slate-400'
          }`}
        />

        <span className="font-bold tracking-tight">{agentName}</span>

        <span className="text-slate-300 font-normal">·</span>

        {/* Status Dot + Text */}
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
          {isActive && (
            <>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
              </span>
              <span className="text-amber-700">active</span>
            </>
          )}
          {isDone && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-700">done</span>
              {hasReasoning && (
                isExpanded ? (
                  <ChevronUp size={10} className="text-emerald-700 ml-0.5" />
                ) : (
                  <ChevronDown size={10} className="text-emerald-700 ml-0.5" />
                )
              )}
            </>
          )}
          {isIdle && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              <span className="text-slate-400 font-medium lowercase">idle</span>
            </>
          )}
        </span>
      </button>

      {/* Single-line Collapsible Reasoning Dropdown directly below */}
      {isExpanded && hasReasoning && (
        <div className="mt-1 max-w-md rounded-lg border border-emerald-200 bg-emerald-50/95 px-2.5 py-1.5 text-[11px] leading-snug font-medium text-emerald-950 shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-start gap-1.5">
            <Check size={12} className="mt-0.5 shrink-0 text-emerald-600 font-bold" />
            <p className="flex-1">{reasoning}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentTag;
