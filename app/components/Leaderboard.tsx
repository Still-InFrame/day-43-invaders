"use client";

import type { ScoreRow } from "@/lib/scores";

interface Props {
  rows: ScoreRow[];
  loading: boolean;
  highlightId?: string | null;
  compact?: boolean;
}

export default function Leaderboard({ rows, loading, highlightId, compact }: Props) {
  return (
    <div className="w-full font-mono">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-fuchsia-300/80">
        <span className="w-8 text-left">#</span>
        <span className="flex-1 text-left">Name</span>
        <span className="w-16 text-right">Wave</span>
        <span className="w-20 text-right">Score</span>
      </div>
      <div className="h-px w-full bg-fuchsia-500/30" />
      {loading ? (
        <p className="py-6 text-center text-sm text-white/50">Loading scores…</p>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/50">
          No scores yet. Be the first!
        </p>
      ) : (
        <ol className={compact ? "text-sm" : "text-base"}>
          {rows.map((r, i) => {
            const hot = r.id === highlightId;
            return (
              <li
                key={r.id}
                className={`flex items-center justify-between py-1.5 ${
                  hot
                    ? "rounded bg-cyan-400/15 px-1 text-cyan-200"
                    : "text-white/85"
                }`}
              >
                <span className="w-8 text-left text-white/50">{i + 1}</span>
                <span className="flex-1 text-left font-bold tracking-widest">
                  {r.initials}
                </span>
                <span className="w-16 text-right text-white/60">{r.wave}</span>
                <span className="w-20 text-right tabular-nums text-fuchsia-200">
                  {r.score.toLocaleString()}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
