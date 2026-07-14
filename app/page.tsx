"use client";

import { useCallback, useEffect, useState } from "react";
import GameCanvas from "./components/GameCanvas";
import Leaderboard from "./components/Leaderboard";
import { getTopScores, submitScore, type ScoreRow } from "@/lib/scores";

type Screen = "home" | "play" | "over";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [runId, setRunId] = useState(0); // bump to remount a fresh game
  const [final, setFinal] = useState({ score: 0, wave: 1 });

  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [loadingScores, setLoadingScores] = useState(true);
  const [showBoard, setShowBoard] = useState(false);

  const [initials, setInitials] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const refreshScores = useCallback(async () => {
    setLoadingScores(true);
    setRows(await getTopScores(10));
    setLoadingScores(false);
  }, []);

  useEffect(() => {
    // Fetch the leaderboard once on mount; setState runs after the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshScores();
  }, [refreshScores]);

  const startGame = () => {
    setRunId((n) => n + 1);
    setInitials("");
    setSubmittedId(null);
    setScreen("play");
  };

  const handleGameOver = useCallback(
    (score: number, wave: number) => {
      setFinal({ score, wave });
      setScreen("over");
      void refreshScores();
    },
    [refreshScores],
  );

  const handleSubmit = async () => {
    if (submitting || submittedId) return;
    const name = initials.trim() || "AAA";
    setSubmitting(true);
    const row = await submitScore(name, final.score, final.wave);
    if (row) {
      setSubmittedId(row.id);
      await refreshScores();
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
      <header className="text-center">
        <h1 className="neon-title font-mono text-4xl font-black tracking-tight sm:text-5xl">
          BUG INVADERS
        </h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-[0.3em] text-cyan-300/70">
          defend the stack · squash the bugs
        </p>
      </header>

      {screen === "play" ? (
        <GameCanvas key={runId} onGameOver={handleGameOver} />
      ) : (
        <div className="w-full max-w-[480px]">
          {screen === "home" && (
            <div className="flex flex-col items-center gap-6 rounded-xl border border-fuchsia-500/30 bg-black/40 p-6 shadow-[0_0_40px_-12px_rgba(255,47,185,0.6)]">
              <button
                onClick={startGame}
                className="w-full rounded-lg bg-gradient-to-r from-fuchsia-500 to-cyan-500 px-6 py-4 font-mono text-lg font-bold tracking-widest text-white shadow-lg transition hover:brightness-110 active:scale-[0.98]"
              >
                ▶ PLAY
              </button>

              <div className="grid w-full grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs text-white/60">
                <span className="text-cyan-300">← →</span>
                <span>move ship</span>
                <span className="text-cyan-300">SPACE</span>
                <span>fire</span>
                <span className="text-cyan-300">P / ESC</span>
                <span>pause</span>
                <span className="text-cyan-300">M</span>
                <span>mute</span>
              </div>
              <p className="text-center font-mono text-xs text-fuchsia-300/70">
                Catch the gold diamond for a spread shot.
              </p>

              <button
                onClick={() => setShowBoard((v) => !v)}
                className="font-mono text-sm text-cyan-300 underline-offset-4 hover:underline"
              >
                {showBoard ? "Hide leaderboard" : "View leaderboard"}
              </button>
              {showBoard && (
                <div className="w-full rounded-lg border border-white/10 bg-black/30 p-4">
                  <Leaderboard rows={rows} loading={loadingScores} compact />
                </div>
              )}
            </div>
          )}

          {screen === "over" && (
            <div className="flex flex-col items-center gap-5 rounded-xl border border-fuchsia-500/40 bg-black/50 p-6 shadow-[0_0_50px_-12px_rgba(255,47,185,0.7)]">
              <h2 className="font-mono text-2xl font-black tracking-widest text-fuchsia-400">
                GAME OVER
              </h2>
              <div className="flex gap-8 text-center font-mono">
                <div>
                  <div className="text-3xl font-bold text-cyan-300">
                    {final.score.toLocaleString()}
                  </div>
                  <div className="text-xs uppercase tracking-widest text-white/50">
                    score
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-fuchsia-300">
                    {final.wave}
                  </div>
                  <div className="text-xs uppercase tracking-widest text-white/50">
                    wave
                  </div>
                </div>
              </div>

              {!submittedId ? (
                <div className="flex w-full flex-col items-center gap-3">
                  <label className="font-mono text-xs uppercase tracking-widest text-white/60">
                    Enter your initials
                  </label>
                  <input
                    value={initials}
                    onChange={(e) =>
                      setInitials(
                        e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "")
                          .slice(0, 3),
                      )
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="AAA"
                    maxLength={3}
                    autoFocus
                    className="w-32 rounded-lg border border-cyan-400/40 bg-black/60 px-4 py-2 text-center font-mono text-2xl font-bold tracking-[0.4em] text-cyan-200 placeholder-white/20 outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full rounded-lg bg-cyan-500 px-6 py-2 font-mono text-sm font-bold tracking-widest text-black transition hover:bg-cyan-400 disabled:opacity-50"
                  >
                    {submitting ? "SAVING…" : "SUBMIT SCORE"}
                  </button>
                </div>
              ) : (
                <p className="font-mono text-sm text-emerald-300">
                  Score saved. Nice run!
                </p>
              )}

              <div className="w-full rounded-lg border border-white/10 bg-black/30 p-4">
                <Leaderboard
                  rows={rows}
                  loading={loadingScores}
                  highlightId={submittedId}
                  compact
                />
              </div>

              <div className="flex w-full gap-3">
                <button
                  onClick={startGame}
                  className="flex-1 rounded-lg bg-gradient-to-r from-fuchsia-500 to-cyan-500 px-6 py-3 font-mono text-sm font-bold tracking-widest text-white hover:brightness-110"
                >
                  PLAY AGAIN
                </button>
                <button
                  onClick={() => setScreen("home")}
                  className="rounded-lg border border-white/20 px-6 py-3 font-mono text-sm font-bold text-white/70 hover:bg-white/5"
                >
                  HOME
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <footer className="mt-2 text-center font-mono text-[11px] text-white/30">
        Day 43 · 100 Day AI Build Challenge
      </footer>
    </div>
  );
}
