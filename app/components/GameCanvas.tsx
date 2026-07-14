"use client";

import { useEffect, useRef, useState } from "react";
import * as C from "@/lib/game/constants";
import { createInitialState, step } from "@/lib/game/engine";
import { render } from "@/lib/game/render";
import { Sound } from "@/lib/game/audio";
import type { GameState, Input, StepEffects } from "@/lib/game/types";

interface Props {
  onGameOver: (score: number, wave: number) => void;
}

export default function GameCanvas({ onGameOver }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const inputRef = useRef<Input>({ left: false, right: false, fire: false });
  const soundRef = useRef<Sound>(new Sound());
  const pausedRef = useRef(false);
  const overRef = useRef(false);

  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showTouch, setShowTouch] = useState(false);

  const togglePause = () => {
    if (overRef.current) return;
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    soundRef.current.resume();
  };

  const toggleMute = () => {
    const next = !soundRef.current.muted;
    soundRef.current.muted = next;
    setMuted(next);
  };

  useEffect(() => {
    // One-time client-only capability read; intentional setState in effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowTouch(
      window.matchMedia("(pointer: coarse)").matches ||
        navigator.maxTouchPoints > 0,
    );
  }, []);

  // Game loop + rendering.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = C.WIDTH * dpr;
    canvas.height = C.HEIGHT * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const sound = soundRef.current;
    const playEffects = (fx: StepEffects) => {
      if (fx.shoot) sound.shoot();
      if (fx.explode) sound.explode();
      if (fx.powerup) sound.powerup();
      if (fx.playerHit) sound.playerHit();
      if (fx.waveClear) sound.waveClear();
    };

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = stateRef.current;
      if (!pausedRef.current && !s.over) {
        const fx = step(s, dt, inputRef.current);
        playEffects(fx);
        if (s.over && !overRef.current) {
          overRef.current = true;
          render(ctx, s, now / 1000);
          onGameOver(s.score, s.wave);
          return; // stop the loop; parent will unmount
        }
      }
      render(ctx, s, now / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [onGameOver]);

  // Keyboard input.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          inputRef.current.left = true;
          e.preventDefault();
          break;
        case "ArrowRight":
        case "KeyD":
          inputRef.current.right = true;
          e.preventDefault();
          break;
        case "Space":
        case "ArrowUp":
          inputRef.current.fire = true;
          soundRef.current.resume();
          e.preventDefault();
          break;
        case "KeyP":
        case "Escape":
          togglePause();
          break;
        case "KeyM":
          toggleMute();
          break;
      }
    };
    const up = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          inputRef.current.left = false;
          break;
        case "ArrowRight":
        case "KeyD":
          inputRef.current.right = false;
          break;
        case "Space":
        case "ArrowUp":
          inputRef.current.fire = false;
          break;
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Touch button helpers.
  const hold = (key: keyof Input) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      inputRef.current[key] = true;
      soundRef.current.resume();
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      inputRef.current[key] = false;
    },
    onPointerLeave: () => {
      inputRef.current[key] = false;
    },
    onPointerCancel: () => {
      inputRef.current[key] = false;
    },
  });

  return (
    <div className="relative w-full max-w-[480px] select-none">
      <div className="relative aspect-[480/640] w-full overflow-hidden rounded-xl border border-fuchsia-500/30 shadow-[0_0_40px_-8px_rgba(255,47,185,0.6)]">
        <canvas
          ref={canvasRef}
          className="h-full w-full touch-none"
          style={{ imageRendering: "auto" }}
        />
        {/* scanline overlay */}
        <div className="scanlines pointer-events-none absolute inset-0" />

        {/* top-right controls */}
        <div className="absolute right-2 top-2 flex gap-2">
          <button
            onClick={toggleMute}
            className="rounded-md border border-white/20 bg-black/40 px-2 py-1 text-xs font-mono text-white/80 backdrop-blur hover:bg-black/60"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? "SOUND OFF" : "SOUND ON"}
          </button>
          <button
            onClick={togglePause}
            className="rounded-md border border-white/20 bg-black/40 px-2 py-1 text-xs font-mono text-white/80 backdrop-blur hover:bg-black/60"
          >
            {paused ? "RESUME" : "PAUSE"}
          </button>
        </div>

        {paused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-center">
              <p className="font-mono text-2xl font-bold tracking-widest text-cyan-300">
                PAUSED
              </p>
              <button
                onClick={togglePause}
                className="mt-4 rounded-lg bg-fuchsia-500 px-6 py-2 font-mono text-sm font-bold text-white hover:bg-fuchsia-400"
              >
                RESUME
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Touch controls (coarse pointers only) */}
      {showTouch && (
        <div className="mt-4 flex items-center justify-between gap-4 px-2">
          <div className="flex gap-3">
            <button
              {...hold("left")}
              className="flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/10 text-2xl text-cyan-300 active:bg-cyan-500/30"
              aria-label="Move left"
            >
              ◀
            </button>
            <button
              {...hold("right")}
              className="flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/10 text-2xl text-cyan-300 active:bg-cyan-500/30"
              aria-label="Move right"
            >
              ▶
            </button>
          </div>
          <button
            {...hold("fire")}
            className="flex h-20 w-20 items-center justify-center rounded-full border border-fuchsia-400/50 bg-fuchsia-500/20 font-mono text-sm font-bold text-fuchsia-200 active:bg-fuchsia-500/40"
            aria-label="Fire"
          >
            FIRE
          </button>
        </div>
      )}
    </div>
  );
}
